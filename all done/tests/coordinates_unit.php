<?php

require dirname(__DIR__).'/laravel/app/Exceptions/MarsPlanningException.php';
require dirname(__DIR__).'/laravel/app/Services/MarsCoordinates.php';

use App\Services\MarsCoordinates;

$metadata = [
    'cellSizeMeters' => 200,
    'areaSizeMeters' => ['width' => 70600, 'height' => 59600],
    'center' => ['lon' => 77.42982155, 'lat' => 18.46611095],
    'crsWkt' => 'EQC MarsSphere R3396190 northup squaremetric',
    'affine' => [200, 0, -35300, 0, -200, 29800],
    'projection' => [
        'type' => 'mars_spherical_equirectangular',
        'radiusMeters' => 3396190,
        'standardParallelDegrees' => 18.46611095,
        'centralLongitudeDegrees' => 77.42982155,
        'latitudeOriginDegrees' => 18.46611095,
    ],
    'requestedBounds' => ['west' => 76.80291421306124, 'south' => 17.96348644765699, 'east' => 78.05672888693876, 'north' => 18.96873545234301],
    'rasterBounds' => ['west' => 76.802, 'south' => 17.963, 'east' => 78.057, 'north' => 18.969],
    'warnings' => [],
    'thresholds' => [],
];

MarsCoordinates::assertMetadata($metadata);
$original = ['lon' => 77.5, 'lat' => 18.5];
$projected = MarsCoordinates::project($original, $metadata);
$inverse = MarsCoordinates::inverse($projected, $metadata);
if (abs($inverse['lon'] - $original['lon']) > 1e-10 || abs($inverse['lat'] - $original['lat']) > 1e-10) {
    throw new RuntimeException('Projection inverse round-trip failed.');
}
$center = MarsCoordinates::cellCenter(176, 148, $metadata);
$expectedX = -35300 + 200 * (176.5);
$expectedY = 29800 - 200 * (148.5);
$centerProjected = MarsCoordinates::project($center, $metadata);
if (abs($centerProjected['x'] - $expectedX) > 1e-7 || abs($centerProjected['y'] - $expectedY) > 1e-7) {
    throw new RuntimeException('Affine cell-center mapping failed.');
}
echo "coordinates_unit: passed\n";
