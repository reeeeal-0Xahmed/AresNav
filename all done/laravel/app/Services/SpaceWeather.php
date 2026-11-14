<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * NASA DONKI solar-flare status used as a RADIATION PROXY.
 * DONKI reports flares as seen from Earth; this is NOT a Mars surface dose measurement.
 */
final class SpaceWeather
{
    private const CACHE_KEY = 'nasa_donki_space_weather';
    private const WINDOW_DAYS = 7;
    private const LETTER_RANK = ['A' => 1, 'B' => 2, 'C' => 3, 'M' => 4, 'X' => 5];

    public function current(): array
    {
        $cached = Cache::get(self::CACHE_KEY);
        if (is_array($cached)) {
            return $cached;
        }

        try {
            $response = Http::timeout(10)->get(env('DONKI_FLR_URL') ?: 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR', [
                'startDate' => now()->subDays(self::WINDOW_DAYS)->format('Y-m-d'),
                'endDate' => now()->format('Y-m-d'),
            ]);

            if ($response->successful()) {$body = trim($response->body());$data = $body === '' ? [] :$response->json();
                if (is_array($data)) {$status = $this->classify($data);
                    Cache::put(self::CACHE_KEY, $status, now()->addHours(3));
                    return $status;
                }
            }
            Log::warning('DONKI request failed', ['status' => $response->status()]);
        } catch (Throwable $e) {
            Log::warning('DONKI exception: '.$e->getMessage());
        }

        return $this->unknown();
    }

    /** @param list<array<string,mixed>> $flares */
    public function classify(array $flares): array
    {
        $strongest = null;
        $bestScore = -1.0;
        foreach ($flares as$flare) {
            if (!is_array($flare)) {
                continue;
            }
            $class = (string) ($flare['classType'] ?? '');
            if (!preg_match('/^([ABCMX])(\d+(?:\.\d+)?)$/',$class, $m)) { continue; }$score = self::LETTER_RANK[$m[1]] * 1000 + (float)$m[2];
            if ($score >$bestScore) {
                $bestScore =$score;
                $strongest = [
                    'class' => $class,
                    'letter' => $m[1],
                    'mag' => (float) $m[2], 'time' =>$flare['beginTime'] ?? null,
                ];
            }
        }

        $status = 'NOMINAL';
        if ($strongest !== null) {
            if ($strongest['letter'] === 'X') {$status = 'HIGH_RADIATION_WARNING';
            } elseif ($strongest['letter'] === 'M' && $strongest['mag'] >= 5.0) {$status = 'ELEVATED';
            }
        }

        return [
            'radiation_status' => $status,
            'strongest_flare_class' => $strongest['class'] ?? 'NONE',
            'event_time' => $strongest['time'] ?? null,
            'window_days' => self::WINDOW_DAYS,
            'basis' => 'earth_view_flare_proxy',
            'source' => 'NASA DONKI FLR',
            'checked_at' => now()->toIso8601String(),
        ];
    }

    private function unknown(): array
    {
        return [
            'radiation_status' => 'UNKNOWN',
            'strongest_flare_class' => null,
            'event_time' => null,
            'window_days' => self::WINDOW_DAYS,
            'basis' => 'earth_view_flare_proxy',
            'source' => 'NASA DONKI FLR (unavailable)',
            'checked_at' => now()->toIso8601String(),
        ];
    }
}