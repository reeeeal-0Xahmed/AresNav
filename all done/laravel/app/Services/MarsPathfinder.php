<?php

namespace App\Services;

use App\Exceptions\MarsPlanningException;
use Illuminate\Contracts\Config\Repository;
use JsonException;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Symfony\Component\Process\Process;

final class MarsPathfinder
{
    public function __construct(
        private readonly Repository $config,
        private readonly MarsTerrainMap $terrain,
    ) {}

    public function run(array $map, array $start, array $target, ?array $requestedStart = null, ?array $requestedTarget = null): array
    {
        $this->terrain->assertUsablePoint($map, $start, 'البداية');
        $this->terrain->assertUsablePoint($map, $target, 'النهاية');
        $requestedStart ??= $start;
        $requestedTarget ??= $target;
        $binary = $this->config->get('mars.binary');
        if (!is_string($binary) || !is_file($binary) || !is_executable($binary)) {
            throw new MarsPlanningException('برنامج C++ غير جاهز على السيرفر.', 'BINARY_UNAVAILABLE');
        }
        $directory = (string) $this->config->get('mars.temporary_directory');
        if ($directory === '' || (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory))) {
            throw new MarsPlanningException('مجلد المعالجة غير متاح.', 'TEMP_UNAVAILABLE');
        }
        $lock = fopen($directory.'/'.hash('sha256', $map['map_id']).'.lock', 'c');
        if ($lock === false) {
            throw new MarsPlanningException('تعذر تجهيز المعالجة.', 'LOCK_UNAVAILABLE');
        }
        if (!flock($lock, LOCK_EX | LOCK_NB)) {
            fclose($lock);
            throw new MarsPlanningException('هناك طلب قيد المعالجة؛ حاول بعد قليل.', 'PLANNER_BUSY', 429);
        }
        $temporaryFile = null;
        try {
            $temporaryFile = tempnam($directory, 'route_');
            if ($temporaryFile === false || realpath(dirname($temporaryFile)) !== realpath($directory)) {
                throw new MarsPlanningException('تعذر إنشاء ملف الطلب.', 'TEMP_UNAVAILABLE');
            }
            chmod($temporaryFile, 0600);
            $payload = [
                'width' => $map['width'], 'height' => $map['height'],
                'start' => $start, 'target' => $target, 'grid' => $map['grid'],
            ];
            $json = json_encode($payload, JSON_THROW_ON_ERROR);
            if (file_put_contents($temporaryFile, $json) !== strlen($json)) {
                throw new MarsPlanningException('تعذر كتابة ملف الطلب.', 'TEMP_WRITE_FAILED');
            }
            $process = new Process([$binary, $temporaryFile], dirname($binary));
            $process->setTimeout(max(1, min(300, (int) $this->config->get('mars.timeout_seconds', 120))));
            try {
                $process->run();
            } catch (ProcessTimedOutException $exception) {
                throw new MarsPlanningException('انتهت مهلة الحساب؛ لا توجد نتيجة مكتملة.', 'PLANNER_TIMEOUT', 504);
            }
            $stdout = $process->getOutput();
            if (strlen($stdout) > 16 * 1024 * 1024) {
                throw new MarsPlanningException('نتيجة المسار أكبر من الحد المدعوم.', 'RESULT_TOO_LARGE', 502);
            }
            try {
                $result = json_decode($stdout, true, 512, JSON_THROW_ON_ERROR);
            } catch (JsonException $exception) {
                throw new MarsPlanningException('برنامج المسارات لم يرجع JSON صالحًا.', 'INVALID_PLANNER_OUTPUT', 502);
            }
            if (!$process->isSuccessful() || !is_array($result)) {
                throw new MarsPlanningException('تعذر إكمال برنامج المسارات.', 'PLANNER_FAILED', 502);
            }
            if (($result['status'] ?? null) === 'error' && ($result['error_code'] ?? null) === 'NO_PATH') {
                return $this->decorateNoPath($map, $start, $target, $requestedStart, $requestedTarget);
            }
            $result = $this->validateResult($result, $map, $start, $target);
            $result['map_id'] = $map['map_id'];
            $result['map_version'] = $map['version'];
            $result['start'] = $start;
            $result['target'] = $target;
            return $this->decorateResult($result, $map, $start, $target, $requestedStart, $requestedTarget);
        } finally {
            if (is_string($temporaryFile) && is_file($temporaryFile)) {
                unlink($temporaryFile);
            }
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    private function decorateNoPath(array $map, array $start, array $target, array $requestedStart, array $requestedTarget): array
    {
        return $this->decorateResult([
            'status' => 'error', 'error_code' => 'NO_PATH',
            'message' => 'لا يوجد طريق بين النقطتين وفق شبكة التضاريس الحالية.',
            'path' => [], 'paths' => [],
            'map_id' => $map['map_id'], 'map_version' => $map['version'],
            'start' => $start, 'target' => $target,
        ], $map, $start, $target, $requestedStart, $requestedTarget);
    }

    private function decorateResult(array $result, array $map, array $start, array $target, array $requestedStart, array $requestedTarget): array
    {
        $result['requested_start'] = $requestedStart;
        $result['requested_target'] = $requestedTarget;
        $result['start_geographic'] = $this->terrain->cellCenter($map, $start);
        $result['target_geographic'] = $this->terrain->cellCenter($map, $target);
        $result['terrain_metadata'] = $this->terrain->resultMetadata($map);
        $features = [];
        foreach ($result['paths'] as $index => &$route) {
            $geographicPath = [];
            foreach ($route['path'] as $point) {
                $center = $this->terrain->cellCenter($map, $point);
                $geographicPath[] = ['lon' => $center['lon'], 'lat' => $center['lat']];
            }
            $route['geographic_path'] = $geographicPath;
            $coordinates = array_map(static fn (array $point): array => [$point['lon'], $point['lat']], $geographicPath);
            $geometry = count($coordinates) >= 2
                ? ['type' => 'LineString', 'coordinates' => $coordinates]
                : ['type' => 'Point', 'coordinates' => $coordinates[0] ?? [null, null]];
            $feature = [
                'type' => 'Feature',
                'properties' => [
                    'rank' => $route['rank'] ?? $index + 1,
                    'cost' => $route['cost'] ?? null,
                    'steps' => $route['steps'] ?? null,
                    'distance_meters' => $route['distance_meters'] ?? null,
                ],
                'geometry' => $geometry,
            ];
            $route['geojson'] = $feature;
            $features[] = $feature;
        }
        unset($route);
        $result['geojson'] = ['type' => 'FeatureCollection', 'features' => $features];
        return $result;
    }

    private function validateResult(array $result, array $map, array $start, array $target): array
    {
        $paths = $result['paths'] ?? null;
        if (($result['status'] ?? null) !== 'success' || !is_array($paths) || !array_is_list($paths) || count($paths) < 1 || count($paths) > 3) {
            throw new MarsPlanningException('صيغة نتيجة المسارات غير صحيحة.', 'INVALID_PLANNER_OUTPUT', 502);
        }
        $previousCost = -INF;
        $seenRoutes = [];
        foreach ($paths as $index => &$route) {
            $points = $route['path'] ?? null;
            $cost = $route['cost'] ?? null;
            if (!is_array($points) || !array_is_list($points) || count($points) < 1 || count($points) > $map['width'] * $map['height'] ||
                !(is_int($cost) || is_float($cost)) || !is_finite((float) $cost) || $cost < 0 || $cost < $previousCost ||
                $points[0] !== $start || $points[count($points) - 1] !== $target) {
                throw new MarsPlanningException('المسار لا يطابق نقاط الطلب.', 'INVALID_PLANNER_OUTPUT', 502);
            }
            $seen = [];
            $calculatedCost = 0.0;
            foreach ($points as $i => $point) {
                if (!is_array($point)) {
                    throw new MarsPlanningException('إحداثيات المسار غير صالحة.', 'INVALID_PLANNER_OUTPUT', 502);
                }
                $x = $point['x'] ?? null;
                $y = $point['y'] ?? null;
                if (!is_int($x) || !is_int($y) || $x < 0 || $x >= $map['width'] || $y < 0 || $y >= $map['height'] || $map['grid'][$y][$x] < 0) {
                    throw new MarsPlanningException('المسار يدخل خلية غير صالحة.', 'INVALID_PLANNER_OUTPUT', 502);
                }
                $id = $y * $map['width'] + $x;
                if (isset($seen[$id])) {
                    throw new MarsPlanningException('المسار يكرر خلية.', 'INVALID_PLANNER_OUTPUT', 502);
                }
                $seen[$id] = true;
                if ($i > 0) {
                    $before = $points[$i - 1];
                    if (abs($before['x'] - $x) + abs($before['y'] - $y) !== 1) {
                        throw new MarsPlanningException('المسار يحتوي قفزة غير مسموحة.', 'INVALID_PLANNER_OUTPUT', 502);
                    }
                    $calculatedCost += $map['grid'][$y][$x];
                }
            }
            if (abs($calculatedCost - $cost) > 1e-8 * max(1.0, abs($calculatedCost))) {
                throw new MarsPlanningException('تكلفة المسار لا تطابق الشبكة.', 'INVALID_PLANNER_OUTPUT', 502);
            }
            $hash = hash('sha256', json_encode($points, JSON_THROW_ON_ERROR));
            if (isset($seenRoutes[$hash])) {
                throw new MarsPlanningException('برنامج المسارات كرر نفس المسار.', 'INVALID_PLANNER_OUTPUT', 502);
            }
            $seenRoutes[$hash] = true;
            $route['rank'] = $index + 1;
            $route['steps'] = count($points) - 1;
            $route['distance_meters'] = $route['steps'] * $map['cell_size_meters'];
            $previousCost = $cost;
        }
        unset($route);
        $result['paths'] = $paths;
        $result['path'] = $paths[0]['path'];
        return $result;
    }
}
