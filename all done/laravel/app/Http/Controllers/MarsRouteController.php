<?php

namespace App\Http\Controllers;

use App\Exceptions\MarsPlanningException;
use App\Models\MarsRouteRequest;
use App\Models\SciencePoi;
use App\Services\MarsPathfinder;
use App\Services\MarsTerrainMap;
use App\Services\RouteBriefing;
use App\Services\SpaceWeather;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

final class MarsRouteController extends Controller
{
    public function terrain(string $mapId, MarsTerrainMap $terrain): JsonResponse
    {
        try {
            $map = $terrain->load($mapId);
            return response()->json($terrain->publicPayload($map))->header('Cache-Control', 'private, no-cache');
        } catch (MarsPlanningException $exception) {
            return $this->errorResponse($exception);
        }
    }

    public function store(Request $request, MarsTerrainMap $terrain, MarsPathfinder $planner, SpaceWeather $weather): JsonResponse
    {
        $request->validate([
            'map_id' => ['required', 'string', Rule::in(array_keys(config('mars.maps', [])))],
        ]);
        $record = null;
        try {
            $map = $terrain->load($request->string('map_id')->toString());
            $data = $request->validate([
                'map_id' => ['required', 'string'],
                'map_version' => ['required', 'string', 'size:64', 'regex:/^[a-f0-9]{64}$/'],
                'start' => ['required', 'array'],
                'target' => ['required', 'array'],
                'grid' => ['prohibited'], 'width' => ['prohibited'], 'height' => ['prohibited'],
            ]);
            if (!hash_equals($map['version'], $data['map_version'])) {
                throw new MarsPlanningException('الخريطة تغيرت؛ أعد تحميلها قبل اختيار المسار.', 'MAP_CHANGED', 409);
            }

            $startInput = $this->normalizeInputCoordinate($data['start'], $map, $terrain, 'start');
            $targetInput = $this->normalizeInputCoordinate($data['target'], $map, $terrain, 'target');
            if ($startInput['kind'] !== $targetInput['kind']) {
                $this->invalidCoordinate('start', 'يجب استخدام نفس نوع الإحداثيات للبداية والنهاية.');
            }
            $start = $startInput['cell'];
            $target = $targetInput['cell'];
            $terrain->assertUsablePoint($map, $start, 'البداية');
            $terrain->assertUsablePoint($map, $target, 'النهاية');

            // Persist the validated user-selected coordinates BEFORE C++ starts.
            $inputCoordinates = ['start' => $startInput['requested'], 'target' => $targetInput['requested']];
            $record = MarsRouteRequest::create([
                'id' => (string) Str::uuid(),
                'session_hash' => $this->sessionHash($request),
                'map_id' => $map['map_id'], 'map_version' => $map['version'],
                'start_x' => $start['x'], 'start_y' => $start['y'],
                'target_x' => $target['x'], 'target_y' => $target['y'],
                'input_coordinates' => $inputCoordinates,
                'status' => 'processing', 'result' => null,
            ]);
            $result = $planner->run($map, $start, $target, $startInput['requested'], $targetInput['requested']);
            $result = $this->withBriefing($result, $map, $weather);
            $result['request_id'] = $record->id;
            $record->update([
                'status' => $result['status'] === 'success' ? 'success' : 'no_path',
                'result' => $result,
            ]);
            return response()->json($result);
        } catch (MarsPlanningException $exception) {
            $body = [
                'status' => 'error', 'error_code' => $exception->errorCode,
                'message' => $exception->getMessage(), 'paths' => [], 'path' => [],
            ];
            if ($record !== null) {
                $body['request_id'] = $record->id;
                $record->update(['status' => 'failed', 'result' => $body]);
            }
            $response = response()->json($body, $exception->httpStatus);
            if ($exception->httpStatus === 429) {
                $response->header('Retry-After', '5');
            }
            return $response;
        } catch (Throwable $exception) {
            if ($exception instanceof ValidationException) {
                throw $exception;
            }
            report($exception);
            $body = ['status' => 'error', 'error_code' => 'SERVER_ERROR',
                     'message' => 'تعذر معالجة الطلب على السيرفر.', 'paths' => [], 'path' => []];
            if ($record !== null) {
                $body['request_id'] = $record->id;
                $record->update(['status' => 'failed', 'result' => $body]);
            }
            return response()->json($body, 500);
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $record = MarsRouteRequest::query()->whereKey($id)
            ->where('session_hash', $this->sessionHash($request))->firstOrFail();
        return response()->json([
            'request_id' => $record->id,
            'processing_status' => $record->status,
            'map_id' => $record->map_id,
            'start' => ['x' => $record->start_x, 'y' => $record->start_y],
            'target' => ['x' => $record->target_x, 'y' => $record->target_y],
            'input_coordinates' => $record->input_coordinates,
            'result' => $record->result,
        ]);
    }

    /**
     * Adds the mission briefing (terrain stats, EVA time, nearby science points, GO/CAUTION/NO-GO).
     * A briefing failure must never break the route itself.
     */
    private function withBriefing(array $result, array $map, SpaceWeather $weather): array
    {
        if (($result['status'] ?? '') !== 'success' || empty($result['paths'])) {
            return $result;
        }

        try {
            $settings = config('mars.maps.'.$map['map_id']);
            $service = RouteBriefing::fromFile($settings['elevations_file'], config('mars.briefing', []));
            try {
                $b = $settings['bounds'];
                $pois = SciencePoi::query()
                    ->whereBetween('lon', [$b['west'], $b['east']])
                    ->whereBetween('lat', [$b['south'], $b['north']])
                    ->get(['poi_code as id', 'name', 'type', 'lat', 'lon'])
                    ->map(fn ($poi): array => $poi->toArray())
                    ->all();
            } catch (Throwable $e) {
                report($e); // e.g. science_pois not migrated yet: briefing still works without POIs
                $pois = [];
            }
            return $service->attach($result, $map['grid'], (float) $map['cell_size_meters'], $pois, $weather->current());
        } catch (Throwable $e) {
            report($e);
            $result['briefing_error'] = 'Briefing unavailable; the route itself is unaffected.';
            return $result;
        }
    }

    /** @return array{kind:string,requested:array,cell:array{x:int,y:int}} */
    private function normalizeInputCoordinate(mixed $value, array $map, MarsTerrainMap $terrain, string $field): array
    {
        if (!is_array($value)) {
            $this->invalidCoordinate($field, 'الإحداثيات يجب أن تكون كائنًا.');
        }
        $keys = array_keys($value);
        sort($keys);
        if ($keys === ['x', 'y']) {
            if (!is_int($value['x'] ?? null) || !is_int($value['y'] ?? null)) {
                $this->invalidCoordinate($field, 'إحداثيات الشبكة يجب أن تكون أعدادًا صحيحة.');
            }
            $cell = ['x' => $value['x'], 'y' => $value['y']];
            if ($cell['x'] < 0 || $cell['x'] >= $map['width'] || $cell['y'] < 0 || $cell['y'] >= $map['height']) {
                $this->invalidCoordinate($field, 'إحداثيات الشبكة خارج حدود الشبكة.');
            }
            return ['kind' => 'grid', 'requested' => $cell, 'cell' => $cell];
        }
        if ($keys === ['lat', 'lon']) {
            foreach (['lon', 'lat'] as $coordinate) {
                if (!(is_int($value[$coordinate] ?? null) || is_float($value[$coordinate] ?? null)) || !is_finite((float) $value[$coordinate])) {
                    $this->invalidCoordinate($field, 'الإحداثيات الجغرافية يجب أن تكون أعدادًا حقيقية منتهية.');
                }
            }
            $requested = ['lon' => $value['lon'], 'lat' => $value['lat']];
            $bounds = $map['requested_bounds'];
            if ($requested['lon'] < $bounds['west'] || $requested['lon'] > $bounds['east'] ||
                $requested['lat'] < $bounds['south'] || $requested['lat'] > $bounds['north']) {
                $this->invalidCoordinate($field, 'الإحداثيات الجغرافية خارج الحدود المطلوبة.');
            }
            return ['kind' => 'geographic', 'requested' => $requested, 'cell' => $terrain->coordinateToCell($requested, $map, $field)];
        }
        $this->invalidCoordinate($field, 'استخدم بالضبط x,y أو بالضبط lon,lat دون خلط.');
    }

    private function invalidCoordinate(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => [$message]]);
    }

    private function sessionHash(Request $request): string
    {
        return hash_hmac('sha256', $request->session()->getId(), (string) config('app.key'));
    }

    private function errorResponse(MarsPlanningException $exception): JsonResponse
    {
        return response()->json([
            'status' => 'error', 'error_code' => $exception->errorCode,
            'message' => $exception->getMessage(),
        ], $exception->httpStatus);
    }
}