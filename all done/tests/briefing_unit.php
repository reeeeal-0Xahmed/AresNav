<?php
// Run from the package root: php tests/briefing_unit.php
require __DIR__.'/../laravel/app/Services/RouteBriefing.php';

use App\Services\RouteBriefing;

$fail = 0;
function check(string $name, bool $ok, string $extra = ''): void {
    global $fail;
    echo ($ok ? 'PASS ' : 'FAIL ').$name.($extra !== '' ? "  [$extra]" : '')."\n";
    if (!$ok) { $fail++; }
}
$deg = 200.0 / 3396190.0 * 180 / M_PI; // degrees of longitude per 200 m at the equator

// ---- 1. hand-computed case --------------------------------------------------
$elev = [[0.0, 10.0, 10.0]];
$grid = [[1, 2, 4]];
$path = [['x' => 0, 'y' => 0], ['x' => 1, 'y' => 0], ['x' => 2, 'y' => 0]];
$geo  = [['lon' => 0.0, 'lat' => 0.0], ['lon' => $deg, 'lat' => 0.0], ['lon' => 2 * $deg, 'lat' => 0.0]];
$pois = [
    ['id' => 'near', 'name' => 'Near', 'type' => 't', 'lon' => $deg, 'lat' => 0.0],
    ['id' => 'far', 'name' => 'Far', 'type' => 't', 'lon' => 1.0, 'lat' => 1.0],
];
$b = (new RouteBriefing($elev))->build($path, $geo, $grid, 200.0, 400.0, $pois, ['radiation_status' => 'NOMINAL']);
$expSlope = rad2deg(atan(10 / 200));
check('max slope', abs($b['terrain']['max_slope_deg'] - round($expSlope, 2)) < 1e-9, (string) $b['terrain']['max_slope_deg']);
check('mean slope', abs($b['terrain']['mean_slope_deg'] - round($expSlope / 2, 2)) < 1e-9);
check('ascent/descent', $b['terrain']['ascent_m'] === 10.0 && $b['terrain']['descent_m'] === 0.0);
check('cost cells exclude start', $b['terrain']['cost_cells'] === [1 => 0, 2 => 1, 4 => 1, 8 => 0]);
check('high-cost share 0.5 => CAUTION', $b['verdict'] === 'CAUTION' && $b['reasons'][0]['code'] === 'HIGH_COST_TERRAIN');
check('eva 0.4 h round trip', $b['eva']['round_trip_hours'] === 0.4);
check('science stops: near only', count($b['science_stops']) === 1 && $b['science_stops'][0]['id'] === 'near' && $b['science_stops'][0]['distance_to_path_m'] === 0.0);

// ---- 2. verdict rules -------------------------------------------------------
$flat = [[0.0, 0.0, 0.0]];
$easy = [[1, 1, 1]];
$mk = fn (?array $rad, float $dist = 400.0) => (new RouteBriefing($flat))->build($path, $geo, $easy, 200.0, $dist, [], $rad)['verdict'];
check('nominal => GO', $mk(['radiation_status' => 'NOMINAL']) === 'GO');
check('unknown radiation => CAUTION', $mk(null) === 'CAUTION');
check('high radiation => NO-GO', $mk(['radiation_status' => 'HIGH_RADIATION_WARNING']) === 'NO-GO');
check('8 h budget exceeded => NO-GO', $mk(['radiation_status' => 'NOMINAL'], 10000.0) === 'NO-GO'); // 10 km => 10 h round trip
check('tight time => CAUTION', $mk(['radiation_status' => 'NOMINAL'], 6000.0) === 'CAUTION');   // 6 h of 8 h

// ---- 3. same-cell route does not crash -------------------------------------
$one = (new RouteBriefing($flat))->build([['x' => 0, 'y' => 0]], [['lon' => 0.0, 'lat' => 0.0]], $easy, 200.0, 0.0, [], ['radiation_status' => 'NOMINAL']);
check('single-cell route => GO', $one['verdict'] === 'GO' && $one['terrain']['steps'] === 0);

// ---- 4. real Jezero data ----------------------------------------------------
$root = dirname(__DIR__);
$terrain = json_decode(file_get_contents("$root/laravel/storage/app/private/mars/jezero-regional-200m/terrain.json"), true);
$result  = json_decode(file_get_contents("$root/tests/example_route_response.json"), true);
$svc = RouteBriefing::fromFile("$root/laravel/storage/app/private/mars/jezero-regional-200m/elevations.json");
$t0 = microtime(true);
$out = $svc->attach($result, $terrain['grid'], 200.0, [], ['radiation_status' => 'NOMINAL']);
$ms = round((microtime(true) - $t0) * 1000);
check('real: every path got a briefing', count(array_filter($out['paths'], fn ($p) => isset($p['briefing']))) === count($out['paths']));
check('real: verdict copied into GeoJSON', ($out['geojson']['features'][0]['properties']['verdict'] ?? null) === $out['paths'][0]['briefing']['verdict']);
check('real: 96 km route is NO-GO on EVA time', $out['verdict'] === 'NO-GO');
echo json_encode(['ms' => $ms, 'path0' => ['terrain' => $out['paths'][0]['briefing']['terrain'], 'eva' => $out['paths'][0]['briefing']['eva'], 'reasons' => $out['paths'][0]['briefing']['reasons']]], JSON_PRETTY_PRINT)."\n";

echo $fail === 0 ? "\nALL PASSED\n" : "\n$fail FAILED\n";
exit($fail === 0 ? 0 : 1);
