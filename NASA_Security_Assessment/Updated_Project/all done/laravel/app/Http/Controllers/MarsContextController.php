<?php

namespace App\Http\Controllers;

use App\Models\SciencePoi;
use App\Services\SpaceWeather;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

/** Read-only context layers around the route planner (map tiles, POIs, imagery, space weather). */
final class MarsContextController extends Controller
{
    public function layers(): JsonResponse
    {
        return response()->json(['status' => 'success', 'data' => config('mars.layers', [])]);
    }

    public function pois(): JsonResponse
    {
        $pois = Cache::get('mars_pois_in_bounds');
        if (!is_array($pois)) {
            $b = config('mars.maps.jezero-regional-200m.bounds');
            $pois = SciencePoi::query()
                ->whereBetween('lon', [$b['west'], $b['east']])
                ->whereBetween('lat', [$b['south'], $b['north']])
                ->get(['poi_code as id', 'name', 'description', 'lat', 'lon', 'type', 'metadata'])
                ->toArray();

            if ($pois !== []) {
                Cache::put('mars_pois_in_bounds', $pois, now()->addHours(1));
            }
        }

        return response()->json(['status' => 'success', 'count' => count($pois), 'data' => $pois]);
    }

    public function spaceWeather(SpaceWeather $weather): JsonResponse
    {
        return response()->json(['status' => 'success', 'data' => $weather->current()]);
    }

    public function images(): JsonResponse
    {
        $images = Cache::get('mars_jezero_images');
        if (!is_array($images)) {
            $images = $this->fetchImages();
            if ($images !== []) {
                Cache::put('mars_jezero_images', $images, now()->addHours(6)); // never cache a failure
            }
        }
        if ($images === []) {
            return response()->json(['status' => 'error', 'message' => 'NASA image library unavailable.', 'data' => []], 503);
        }
        return response()->json(['status' => 'success', 'data' => $images]);
    }

    private function fetchImages(): array
    {
        try {
            $response = Http::timeout(10)->get('https://images-api.nasa.gov/search', [
                'q' => 'Perseverance Jezero Crater surface',
                'media_type' => 'image',
                'page' => 1,
            ]);
            if (!$response->successful()) {
                return [];
            }
            return collect($response->json()['collection']['items'] ?? [])
                ->take(8)
                ->map(fn (array $item): array => [
                    'id' => $item['data'][0]['nasa_id'] ?? null,
                    'title' => $item['data'][0]['title'] ?? 'Jezero Crater',
                    'img_src' => $item['links'][0]['href'] ?? '',
                    'date' => substr($item['data'][0]['date_created'] ?? '', 0, 10),
                    'source' => 'NASA Image and Video Library',
                ])
                ->filter(fn (array $img): bool => $img['img_src'] !== '')
                ->values()
                ->all();
        } catch (Throwable) {
            return [];
        }
    }
}