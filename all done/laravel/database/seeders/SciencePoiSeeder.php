<?php

namespace Database\Seeders;

use App\Models\SciencePoi;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Loads Perseverance (Mars 2020) drive waypoints from NASA JPL MMGIS.
 * Run: php artisan db:seed --class=SciencePoiSeeder
 */
class SciencePoiSeeder extends Seeder
{
    private const SOURCE_URL = 'https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json';
    private const KEEP_LAST = 60; // most recent waypoints that fall inside the map bounds

    public function run(): void
    {
        $bounds = config('mars.maps.jezero-regional-200m.bounds');
        $response = Http::timeout(15)->get(self::SOURCE_URL);
        if ($response->failed()) {
            $this->command->error('Could not reach NASA JPL MMGIS. Check the connection / URL.');
            return;
        }

        $inside = [];
        foreach ($response->json()['features'] ?? [] as $feature) {
            $c = $feature['geometry']['coordinates'] ?? [];
            if (count($c) < 2 || $c[0] < $bounds['west'] || $c[0] > $bounds['east'] || $c[1] < $bounds['south'] || $c[1] > $bounds['north']) {
                continue;
            }
            $inside[] = $feature;
        }
        $this->command->info(count($inside).' waypoints fall inside the map bounds.');

        $count = 0;
        foreach (array_slice($inside, -self::KEEP_LAST) as $feature) {
            $p = $feature['properties'] ?? [];
            $c = $feature['geometry']['coordinates'];
            $sol = $p['sol'] ?? $count;
            $site = $p['site'] ?? '0';
            $drive = $p['drive'] ?? '0';
            SciencePoi::updateOrCreate(
                ['poi_code' => "m20_sol_{$sol}_s{$site}_d{$drive}"],
                [
                    'name' => "Perseverance waypoint — site {$site}, drive {$drive} (sol {$sol})",
                    'description' => "Perseverance drive waypoint recorded on sol {$sol}.",
                    'lon' => $c[0],
                    'lat' => $c[1],
                    'type' => 'rover_waypoint',
                    'metadata' => [
                        'mission' => 'Mars 2020 Perseverance',
                        'sol' => $sol,
                        'elevation_m' => $c[2] ?? null,
                        'source' => 'NASA JPL MMGIS',
                    ],
                ]
            );
            $count++;
        }
        Cache::forget('mars_pois_in_bounds');
        $this->command->info("Seeded {$count} waypoints.");
    }
}