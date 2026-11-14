<?php

namespace App\Services;

use App\Exceptions\MarsPlanningException;

final class MarsCoordinates
{
    public const RADIUS_METERS = 3396190.0;

    /** @param array{lon:int|float,lat:int|float} $coordinate */
    public static function project(array $coordinate, array $metadata): array
    {
        self::assertFiniteNumber($coordinate['lon'] ?? null, 'longitude');
        self::assertFiniteNumber($coordinate['lat'] ?? null, 'latitude');
        self::assertProjectionMetadata($metadata);

        $projection = $metadata['projection'];
        $latTs = self::radians((float) $projection['standardParallelDegrees']);
        $lon0 = (float) $projection['centralLongitudeDegrees'];
        $lat0 = (float) $projection['latitudeOriginDegrees'];
        $radius = (float) $projection['radiusMeters'];

        return [
            'x' => $radius * cos($latTs) * self::radians((float) $coordinate['lon'] - $lon0),
            'y' => $radius * self::radians((float) $coordinate['lat'] - $lat0),
        ];
    }

    /** @return array{lon:float,lat:float} */
    public static function inverse(array $projected, array $metadata): array
    {
        self::assertFiniteNumber($projected['x'] ?? null, 'projected x');
        self::assertFiniteNumber($projected['y'] ?? null, 'projected y');
        self::assertProjectionMetadata($metadata);

        $projection = $metadata['projection'];
        $latTs = self::radians((float) $projection['standardParallelDegrees']);
        $lon0 = (float) $projection['centralLongitudeDegrees'];
        $lat0 = (float) $projection['latitudeOriginDegrees'];
        $radius = (float) $projection['radiusMeters'];

        return [
            'lon' => rad2deg((float) $projected['x'] / ($radius * cos($latTs))) + $lon0,
            'lat' => rad2deg((float) $projected['y'] / $radius) + $lat0,
        ];
    }

    /** @return array{lon:float,lat:float} */
    public static function cellCenter(int $x, int $y, array $metadata): array
    {
        $affine = self::assertAffine($metadata['affine'] ?? null);
        $projected = [
            'x' => $affine[0] * ($x + 0.5) + $affine[1] * ($y + 0.5) + $affine[2],
            'y' => $affine[3] * ($x + 0.5) + $affine[4] * ($y + 0.5) + $affine[5],
        ];
        return self::inverse($projected, $metadata);
    }

    /** @return array{0:float,1:float,2:float,3:float,4:float,5:float} */
    public static function assertAffine(mixed $affine): array
    {
        if (!is_array($affine) || !array_is_list($affine) || count($affine) !== 6) {
            throw new MarsPlanningException('التحويل الجغرافي للتضاريس غير صالح.', 'INVALID_TERRAIN');
        }
        $values = [];
        foreach ($affine as $value) {
            self::assertFiniteNumber($value, 'affine');
            $values[] = (float) $value;
        }
        if (abs($values[1]) > 1e-12 || abs($values[3]) > 1e-12 || $values[0] <= 0 || $values[4] >= 0 || abs($values[0] + $values[4]) > 1e-9 * max(1.0, abs($values[0]))) {
            throw new MarsPlanningException('تحويل التضاريس ليس شبكة مترية شمالية مربعة.', 'INVALID_TERRAIN');
        }
        return $values;
    }

    public static function assertProjectionMetadata(array $metadata): void
    {
        $projection = $metadata['projection'] ?? null;
        if (!is_array($projection) || ($projection['type'] ?? null) !== 'mars_spherical_equirectangular') {
            throw new MarsPlanningException('إسقاط التضاريس غير مدعوم.', 'INVALID_TERRAIN');
        }
        foreach (['radiusMeters', 'standardParallelDegrees', 'centralLongitudeDegrees', 'latitudeOriginDegrees'] as $key) {
            self::assertFiniteNumber($projection[$key] ?? null, 'projection');
        }
        if (abs((float) $projection['radiusMeters'] - self::RADIUS_METERS) > 1e-6) {
            throw new MarsPlanningException('نصف قطر المريخ في التضاريس غير مدعوم.', 'INVALID_TERRAIN');
        }
    }

    public static function assertMetadata(array $metadata): void
    {
        foreach (['cellSizeMeters'] as $key) {
            self::assertFiniteNumber($metadata[$key] ?? null, $key);
            if ((float) $metadata[$key] <= 0) {
                throw new MarsPlanningException('بيانات الخلية في التضاريس غير صالحة.', 'INVALID_TERRAIN');
            }
        }
        $center = $metadata['center'] ?? null;
        if (!is_array($center)) {
            throw new MarsPlanningException('مركز التضاريس غير صالح.', 'INVALID_TERRAIN');
        }
        self::assertFiniteNumber($center['lon'] ?? null, 'center longitude');
        self::assertFiniteNumber($center['lat'] ?? null, 'center latitude');
        $area = $metadata['areaSizeMeters'] ?? null;
        if (!is_array($area) || array_diff(['width', 'height'], array_keys($area)) !== []) {
            throw new MarsPlanningException('حجم منطقة التضاريس غير صالح.', 'INVALID_TERRAIN');
        }
        foreach (['width', 'height'] as $dimension) {
            self::assertFiniteNumber($area[$dimension], 'area size');
            if ((float) $area[$dimension] <= 0) {
                throw new MarsPlanningException('حجم منطقة التضاريس غير صالح.', 'INVALID_TERRAIN');
            }
        }
        if (!is_string($metadata['crsWkt'] ?? null) || trim($metadata['crsWkt']) === '') {
            throw new MarsPlanningException('مرجع الإحداثيات في التضاريس غير صالح.', 'INVALID_TERRAIN');
        }
        self::assertAffine($metadata['affine'] ?? null);
        self::assertProjectionMetadata($metadata);
        foreach (['requestedBounds', 'rasterBounds'] as $key) {
            $bounds = $metadata[$key] ?? null;
            $boundKeys = is_array($bounds) ? array_keys($bounds) : [];
            sort($boundKeys);
            if ($boundKeys !== ['east', 'north', 'south', 'west']) {
                throw new MarsPlanningException('حدود التضاريس غير صالحة.', 'INVALID_TERRAIN');
            }
            foreach (['west', 'south', 'east', 'north'] as $bound) {
                self::assertFiniteNumber($bounds[$bound] ?? null, $key);
            }
            if ((float) $bounds['west'] >= (float) $bounds['east'] || (float) $bounds['south'] >= (float) $bounds['north']) {
                throw new MarsPlanningException('حدود التضاريس غير صالحة.', 'INVALID_TERRAIN');
            }
        }
        if (!is_array($metadata['warnings'] ?? null) || !is_array($metadata['thresholds'] ?? null)) {
            throw new MarsPlanningException('وصف التضاريس غير مكتمل.', 'INVALID_TERRAIN');
        }
    }

    public static function assertFiniteNumber(mixed $value, string $label): void
    {
        if (!(is_int($value) || is_float($value)) || !is_finite((float) $value) || is_bool($value)) {
            throw new MarsPlanningException('قيمة '.$label.' غير صالحة.', 'INVALID_TERRAIN');
        }
    }

    private static function radians(float $degrees): float
    {
        return $degrees * M_PI / 180.0;
    }
}
