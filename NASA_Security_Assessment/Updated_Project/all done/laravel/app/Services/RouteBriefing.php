<?php

namespace App\Services;

use RuntimeException;

/**
 * Turns a planned route into a mission briefing: terrain stats, EVA time,
 * nearby science points and an explainable GO / CAUTION / NO-GO verdict.
 *
 * Framework-free on purpose (arrays in, arrays out) so it can be unit-tested
 * without booting Laravel. Every threshold is a PLANNING ASSUMPTION, not a
 * NASA operational limit; they are overridable through config('mars.briefing').
 */
final class RouteBriefing
{
    private const MARS_RADIUS_M = 3396190.0;

    private const DEFAULTS = [
        'walk_speed_kmh' => 2.0,          // assumed suited walking speed
        'eva_budget_hours' => 8.0,        // assumed EVA duration budget
        'eva_tight_share' => 0.7,         // round trip above this share of budget => CAUTION
        'poi_radius_m' => 2000.0,         // science points within this distance of the path
        'slope_caution_deg' => 10.0,
        'slope_nogo_deg' => 20.0,
        'high_cost_share_caution' => 0.25, // share of cost>=4 cells => CAUTION
        'max_pois' => 10,
    ];

    private array $opt;

    /** @param list<list<float>> $elevations [y][x] metres, same grid as terrain.json */
    public function __construct(private readonly array $elevations, array $options = [])
    {
        $this->opt = array_replace(self::DEFAULTS, $options);
    }

    public static function fromFile(string $file, array $options = []): self
    {
        $text = is_file($file) && is_readable($file) ? file_get_contents($file) : false;
        $data = $text === false ? null : json_decode($text, true);
        if (!is_array($data) || !isset($data['elevations']) || !is_array($data['elevations'])) {
            throw new RuntimeException('Elevation file missing or invalid: '.$file);
        }
        return new self($data['elevations'], $options);
    }

    /**
     * Adds ['briefing'] to every path (and 'verdict' to its GeoJSON properties).
     * Only touches successful results; returns everything else unchanged.
     *
     * @param list<array{lon:float,lat:float,id?:string,name?:string,type?:string}> $pois
     */
    public function attach(array $result, array $grid, float $cellSize, array $pois, ?array $radiation): array
    {
        if (($result['status'] ?? '') !== 'success' || empty($result['paths'])) {
            return $result;
        }
        foreach ($result['paths'] as $i => $route) {
            $briefing = $this->build(
                $route['path'] ?? [],
                $route['geographic_path'] ?? [],
                $grid,
                $cellSize,
                (float) ($route['distance_meters'] ?? 0),
                $pois,
                $radiation,
            );
            $result['paths'][$i]['briefing'] = $briefing;
            if (isset($result['paths'][$i]['geojson']['properties'])) {
                $result['paths'][$i]['geojson']['properties']['verdict'] = $briefing['verdict'];
            }
            if (isset($result['geojson']['features'][$i]['properties'])) {
                $result['geojson']['features'][$i]['properties']['verdict'] = $briefing['verdict'];
            }
        }
        $result['verdict'] = $result['paths'][0]['briefing']['verdict'];
        return $result;
    }

    public function build(
        array $path,
        array $geoPath,
        array $grid,
        float $cellSize,
        float $distanceMeters,
        array $pois,
        ?array $radiation,
    ): array {
        $slopes = [];
        $ascent = 0.0;
        $descent = 0.0;
        $classes = [1 => 0, 2 => 0, 4 => 0, 8 => 0];
        $minElev = INF;
        $maxElev = -INF;

        foreach ($path as $i => $p) {
            $z = (float) ($this->elevations[$p['y']][$p['x']] ?? NAN);
            if (is_finite($z)) {
                $minElev = min($minElev, $z);
                $maxElev = max($maxElev, $z);
            }
            if ($i === 0) {
                continue; // entering a cell pays its cost; the start cell is free
            }
            $cost = $grid[$p['y']][$p['x']] ?? null;
            if (isset($classes[$cost])) {
                $classes[$cost]++;
            }
            $prev = $path[$i - 1];
            $zPrev = (float) ($this->elevations[$prev['y']][$prev['x']] ?? NAN);
            if (!is_finite($z) || !is_finite($zPrev)) {
                continue;
            }
            $dz = $z - $zPrev;
            $run = $cellSize * hypot($p['x'] - $prev['x'], $p['y'] - $prev['y']);
            $slopes[] = rad2deg(atan(abs($dz) / max($run, 1e-9)));
            $dz > 0 ? $ascent += $dz : $descent -= $dz;
        }

        $steps = max(count($path) - 1, 0);
        sort($slopes);
        $p95 = $slopes === [] ? 0.0 : $slopes[(int) max(ceil(0.95 * count($slopes)) - 1, 0)];
        $highShare = $steps > 0 ? ($classes[4] + $classes[8]) / $steps : 0.0;

        $oneWayHours = ($distanceMeters / 1000.0) / $this->opt['walk_speed_kmh'];
        $roundTripHours = 2.0 * $oneWayHours;
        $stops = $this->sciencePoints($geoPath, $pois);
        $radiationStatus = (string) ($radiation['radiation_status'] ?? 'UNKNOWN');

        [$verdict, $reasons] = $this->verdict(
            $roundTripHours,
            $slopes === [] ? 0.0 : max($slopes),
            $highShare,
            $radiationStatus,
        );

        return [
            'verdict' => $verdict,
            'reasons' => $reasons,
            'terrain' => [
                'distance_m' => $distanceMeters,
                'steps' => $steps,
                'max_slope_deg' => round($slopes === [] ? 0.0 : max($slopes), 2),
                'mean_slope_deg' => round($slopes === [] ? 0.0 : array_sum($slopes) / count($slopes), 2),
                'p95_slope_deg' => round($p95, 2),
                'ascent_m' => round($ascent, 1),
                'descent_m' => round($descent, 1),
                'elevation_min_m' => is_finite($minElev) ? round($minElev, 1) : null,
                'elevation_max_m' => is_finite($maxElev) ? round($maxElev, 1) : null,
                'cost_cells' => $classes,
                'high_cost_share' => round($highShare, 3),
            ],
            'eva' => [
                'one_way_hours' => round($oneWayHours, 2),
                'round_trip_hours' => round($roundTripHours, 2),
                'budget_hours' => $this->opt['eva_budget_hours'],
                'walk_speed_kmh' => $this->opt['walk_speed_kmh'],
                'basis' => 'planning_assumption',
            ],
            'radiation' => [
                'status' => $radiationStatus,
                'basis' => $radiation['basis'] ?? null,
            ],
            'science_stops' => $stops,
            'limitations' => [
                'Slope is measured between 200 m cell centres; local slopes are steeper.',
                'Radiation status is an Earth-view solar-flare proxy, not a Mars surface measurement.',
                'Speeds, EVA budget and thresholds are planning assumptions, not NASA operational limits.',
            ],
        ];
    }

    /** @return array{0:string,1:list<array{code:string,severity:string,detail:string}>} */
    private function verdict(float $roundTripHours, float $maxSlope, float $highShare, string $radiation): array
    {
        $level = 0;
        $reasons = [];
        $add = function (int $sev, string $code, string $detail) use (&$level, &$reasons): void {
            $level = max($level, $sev);
            $reasons[] = ['code' => $code, 'severity' => $sev === 2 ? 'NO-GO' : 'CAUTION', 'detail' => $detail];
        };

        $budget = (float) $this->opt['eva_budget_hours'];
        if ($roundTripHours > $budget) {
            $add(2, 'EVA_TIME_EXCEEDED', sprintf('Round trip ~%.1f h exceeds the %.1f h EVA budget.', $roundTripHours, $budget));
        } elseif ($roundTripHours > $budget * $this->opt['eva_tight_share']) {
            $add(1, 'EVA_TIME_TIGHT', sprintf('Round trip ~%.1f h uses most of the %.1f h EVA budget.', $roundTripHours, $budget));
        }
        if ($maxSlope >= $this->opt['slope_nogo_deg']) {
            $add(2, 'SLOPE_LIMIT', sprintf('Max slope %.1f° reaches the %.0f° limit.', $maxSlope, $this->opt['slope_nogo_deg']));
        } elseif ($maxSlope >= $this->opt['slope_caution_deg']) {
            $add(1, 'STEEP_SECTION', sprintf('Max slope %.1f° on at least one step.', $maxSlope));
        }
        if ($highShare > $this->opt['high_cost_share_caution']) {
            $add(1, 'HIGH_COST_TERRAIN', sprintf('%.0f%% of the route crosses high-cost terrain.', $highShare * 100));
        }
        match ($radiation) {
            'HIGH_RADIATION_WARNING' => $add(2, 'RADIATION_HIGH', 'Strong recent solar flare activity.'),
            'ELEVATED' => $add(1, 'RADIATION_ELEVATED', 'Moderate recent solar flare activity.'),
            'NOMINAL' => null,
            default => $add(1, 'RADIATION_UNKNOWN', 'Space-weather data unavailable; treat as unverified.'),
        };

        return [['GO', 'CAUTION', 'NO-GO'][$level], $reasons];
    }

    /** @return list<array<string,mixed>> */
    private function sciencePoints(array $geoPath, array $pois): array
    {
        if ($geoPath === []) {
            return [];
        }
        $out = [];
        foreach ($pois as $poi) {
            if (!isset($poi['lon'], $poi['lat'])) {
                continue;
            }
            $cosLat = cos(deg2rad((float) $poi['lat']));
            $best = INF;
            $bestIdx = 0;
            foreach ($geoPath as $i => $g) {
                $dx = deg2rad($g['lon'] - $poi['lon']) * $cosLat * self::MARS_RADIUS_M;
                $dy = deg2rad($g['lat'] - $poi['lat']) * self::MARS_RADIUS_M;
                $d2 = $dx * $dx + $dy * $dy;
                if ($d2 < $best) {
                    $best = $d2;
                    $bestIdx = $i;
                }
            }
            $dist = sqrt($best);
            if ($dist <= $this->opt['poi_radius_m']) {
                $out[] = [
                    'id' => $poi['id'] ?? null,
                    'name' => $poi['name'] ?? null,
                    'type' => $poi['type'] ?? null,
                    'distance_to_path_m' => round($dist),
                    'nearest_path_index' => $bestIdx,
                ];
            }
        }
        usort($out, static fn (array $a, array $b): int => $a['distance_to_path_m'] <=> $b['distance_to_path_m']);
        return array_slice($out, 0, (int) $this->opt['max_pois']);
    }
}
