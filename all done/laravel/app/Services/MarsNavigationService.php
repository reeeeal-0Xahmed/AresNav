<?php

namespace App\Services;

use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Log;

class MarsNavigationService
{
    public function calculateGridRoute(array $gridData): array
    {
        $jsonString = json_encode($gridData);
        $executablePath = base_path('bin/mars_engine');

        if (!file_exists($executablePath)) {
            Log::warning("C++ Mars Engine binary not found at: {$executablePath}. Running fallback.");
            return $this->getFallbackRoute($gridData);
        }

        try {
            $result = Process::input($jsonString)
                ->timeout(10)
                ->run($executablePath);

            if ($result->successful()) {
                $output = json_decode($result->output(), true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($output)) {
                    return $output;
                }
            }

            Log::error("C++ Mars Engine execution failed: " . $result->errorOutput());
            return $this->getFallbackRoute($gridData);
        } catch (\Exception $e) {
            Log::error("C++ Mars Engine exception: " . $e->getMessage());
            return $this->getFallbackRoute($gridData);
        }
    }

    private function getFallbackRoute(array $gridData): array
    {
        $start = $gridData['start'] ?? ['x' => 0, 'y' => 0];
        $target = $gridData['target'] ?? ['x' => 2, 'y' => 2];

        return [
            'status' => 'fallback',
            'message' => 'Simulated safe route (C++ binary pending or unavailable)',
            'path' => [
                ['x' => $start['x'], 'y' => $start['y']],
                ['x' => (int)(($start['x'] + $target['x']) / 2), 'y' => (int)(($start['y'] + $target['y']) / 2)],
                ['x' => $target['x'], 'y' => $target['y']]
            ]
        ];
    }
}
