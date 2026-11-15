<?php

namespace App\Services;

use App\Exceptions\MarsPlanningException;
use Illuminate\Contracts\Config\Repository;
use JsonException;

final class MarsTerrainMap
{
    public function __construct(private readonly Repository $config) {}

    public function load(string $mapId): array
    {
        $settings = $this->config->get('mars.maps.'.$mapId);
        if (!is_array($settings)) {
            throw new MarsPlanningException('الخريطة المطلوبة غير موجودة.', 'MAP_NOT_FOUND', 404);
        }
        $file = $settings['terrain_file'] ?? '';
        if (!is_string($file) || !is_file($file) || !is_readable($file)) {
            throw new MarsPlanningException('ملف التضاريس غير متاح على السيرفر.', 'TERRAIN_UNAVAILABLE');
        }
        try {
            $text = file_get_contents($file);
            if ($text === false) {
                throw new MarsPlanningException('تعذر قراءة التضاريس.', 'TERRAIN_UNAVAILABLE');
            }
            $data = json_decode($text, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new MarsPlanningException('ملف التضاريس ليس JSON صالحًا.', 'INVALID_TERRAIN');
        }
        if (!is_array($data)) {
            throw new MarsPlanningException('ملف التضاريس غير صالح.', 'INVALID_TERRAIN');
        }

        $width = $data['width'] ?? null;
        $height = $data['height'] ?? null;
        $grid = $data['grid'] ?? null;
        $metadata = $data['terrainMetadata'] ?? null;
        if (!is_int($width) || !is_int($height) || $width <= 0 || $height <= 0 || $width * $height > 1_000_000 ||
            !is_array($grid) || !array_is_list($grid) || count($grid) !== $height || !is_array($metadata)) {
            throw new MarsPlanningException('أبعاد أو بيانات التضاريس غير صالحة.', 'INVALID_TERRAIN');
        }
        foreach ($grid as $row) {
            if (!is_array($row) || !array_is_list($row) || count($row) !== $width) {
                throw new MarsPlanningException('صفوف التضاريس غير متطابقة.', 'INVALID_TERRAIN');
            }
            foreach ($row as $cost) {
                if (!is_int($cost) || !in_array($cost, [-1, 1, 2, 4, 8], true)) {
                    throw new MarsPlanningException('تكلفة الخلية غير صالحة.', 'INVALID_TERRAIN');
                }
            }
        }

        MarsCoordinates::assertMetadata($metadata);
        $cellSize = (float) $metadata['cellSizeMeters'];
        try {
            $version = hash('sha256', json_encode([
                'width' => $width,
                'height' => $height,
                'grid' => $grid,
                'terrainMetadata' => $metadata,
            ], JSON_THROW_ON_ERROR));
        } catch (JsonException $exception) {
            throw new MarsPlanningException('تعذر تثبيت نسخة التضاريس.', 'INVALID_TERRAIN');
        }

        return [
            'map_id' => $mapId,
            'title' => $settings['title'] ?? $mapId,
            'version' => $version,
            'width' => $width,
            'height' => $height,
            'cell_size_meters' => $cellSize,
            'grid' => $grid,
            'terrain_metadata' => $metadata,
            'projection' => $metadata['projection'],
            'affine' => MarsCoordinates::assertAffine($metadata['affine']),
            'requested_bounds' => $metadata['requestedBounds'],
            'raster_bounds' => $metadata['rasterBounds'],
            'regional_scale' => $metadata['navigationScale'] ?? 'regional',
            'warnings' => $metadata['warnings'],
            'thresholds' => $metadata['thresholds'],
            'source' => $this->safeSource($metadata),
        ];
    }

    public function publicPayload(array $map): array
    {
        $metadata = $map['terrain_metadata'];
        $payload = [
            'map_id' => $map['map_id'],
            'title' => $map['title'],
            'width' => $map['width'],
            'height' => $map['height'],
            'grid' => $map['grid'],
            'version' => $map['version'],
            'projection' => $map['projection'],
            'affine' => $map['affine'],
            'requested_bounds' => $map['requested_bounds'],
            'raster_bounds' => $map['raster_bounds'],
            'regional_scale' => $map['regional_scale'],
            'warnings' => $map['warnings'],
            'source' => $map['source'],
            'thresholds' => $map['thresholds'],
            'legend' => [
                'costs' => [-1, 1, 2, 4, 8],
                'labels' => ['-1' => 'blocked', '1' => 'low', '2' => 'moderate', '4' => 'high', '8' => 'very_high'],
            ],
            'cell_size_meters' => $map['cell_size_meters'],
        ];
        return $payload;
    }

    public function resultMetadata(array $map): array
    {
        $metadata = $map['terrain_metadata'];
        unset($metadata['sourceDem']);
        return $metadata;
    }

    public function coordinateToCell(array $coordinate, array $map, string $label): array
    {
        MarsCoordinates::assertFiniteNumber($coordinate['lon'] ?? null, $label.' longitude');
        MarsCoordinates::assertFiniteNumber($coordinate['lat'] ?? null, $label.' latitude');
        $bounds = $map['requested_bounds'];
        if ((float) $coordinate['lon'] < (float) $bounds['west'] || (float) $coordinate['lon'] > (float) $bounds['east'] ||
            (float) $coordinate['lat'] < (float) $bounds['south'] || (float) $coordinate['lat'] > (float) $bounds['north']) {
            throw new MarsPlanningException($label.' خارج الحدود الجغرافية المطلوبة.', 'OUT_OF_BOUNDS', 422);
        }
        $projected = MarsCoordinates::project($coordinate, $map['terrain_metadata']);
        $affine = $map['affine'];
        $determinant = $affine[0] * $affine[4] - $affine[1] * $affine[3];
        if (abs($determinant) < 1e-12) {
            throw new MarsPlanningException('تحويل التضاريس غير قابل للعكس.', 'INVALID_TERRAIN');
        }
        $dx = $projected['x'] - $affine[2];
        $dy = $projected['y'] - $affine[5];
        $column = ($affine[4] * $dx - $affine[1] * $dy) / $determinant;
        $row = (-$affine[3] * $dx + $affine[0] * $dy) / $determinant;
        return ['x' => (int) floor($column), 'y' => (int) floor($row)];
    }

    public function cellCenter(array $map, array $point): array
    {
        return MarsCoordinates::cellCenter((int) $point['x'], (int) $point['y'], $map['terrain_metadata']);
    }

    public function assertUsablePoint(array $map, array $point, string $label): void
    {
        $x = $point['x'] ?? null;
        $y = $point['y'] ?? null;
        if (!is_int($x) || !is_int($y) || $x < 0 || $x >= $map['width'] || $y < 0 || $y >= $map['height']) {
            throw new MarsPlanningException($label.' خارج حدود الشبكة.', 'OUT_OF_BOUNDS', 422);
        }
        if ($map['grid'][$y][$x] < 0) {
            throw new MarsPlanningException($label.' تقع على خلية ممنوعة.', 'BLOCKED_POINT', 422);
        }
    }

    private function safeSource(array $metadata): array
    {
        $source = is_array($metadata['source'] ?? null) ? $metadata['source'] : [];
        $sourceUrl = $metadata['sourceUrl'] ?? null;
        if (is_string($sourceUrl) && !isset($source['url']) && !isset($source['originalUrl'])) {
            $source['url'] = $sourceUrl;
        }
        unset($source['sourceDem'], $source['path'], $source['file'], $source['filename']);
        $source['nominal_cell_size_meters'] = $source['nominalPixelSpacingMeters'] ?? $metadata['cellSizeMeters'] ?? null;
        $source['navigation_scale'] = $metadata['navigationScale'] ?? 'regional';
        return $source;
    }
}
