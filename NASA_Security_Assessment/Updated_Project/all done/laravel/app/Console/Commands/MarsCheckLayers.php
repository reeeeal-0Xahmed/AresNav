<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Throwable;

class MarsCheckLayers extends Command
{
    protected $signature = 'mars:check-layers';
    protected $description = 'Verify WMTSCapabilities and tile 0/0/0 of every configured map layer';

    public function handle(): int
    {
        $bad = 0;
        foreach (config('mars.layers', []) as $id => $layer) {
            $tileUrl = str_replace(['{z}', '{y}', '{x}'], '0', $layer['url']);
            $capUrl = preg_replace('#/default/default028mm/.*$#', '/WMTSCapabilities.xml', $layer['url']);

            try {
                $capRes = Http::timeout(15)->get($capUrl);
                $tileStatus = Http::timeout(15)->get($tileUrl)->status();
                $ok = $capRes->successful() || $tileStatus === 200;

                $format = 'unknown';
                if ($capRes->successful()) {
                    $body = $capRes->body();
                    if (str_contains($body, 'image/jpeg')) {
                        $format = 'jpg';
                    } elseif (str_contains($body, 'image/png')) {
                        $format = 'png';
                    }
                }

                $this->line(sprintf(
                    '%s %-16s WMTS: HTTP %-3s (format: %-7s) | Tile 0/0/0: HTTP %s',
                    $ok ? 'OK  ' : 'FAIL',
                    $id,
                    $capRes->status(),
                    $format,
                    $tileStatus
                ));
            } catch (Throwable $e) {
                $ok = false;
                $this->line(sprintf('FAIL %-16s ERR: %s', $id, $e->getMessage()));
            }

            $bad += $ok ? 0 : 1;
        }
        return $bad === 0 ? self::SUCCESS : self::FAILURE;
    }
}