<?php
// Standalone CLI integration. Isolated in-memory SQLite, not your real application database.
$vendor = $argv[1] ?? null; $binary = $argv[2] ?? null;
if (!$vendor || !$binary) {
    fwrite(STDERR, "Usage: php tests/backend_integration.php vendor/autoload.php bin/rover_pathfinder\n"); exit(2);
}
require $vendor;
$root = dirname(__DIR__);
spl_autoload_register(function ($class) use ($root): void {
    if (str_starts_with($class, 'App\\')) {
        $file = $root.'/laravel/app/'.str_replace('\\', '/', substr($class, 4)).'.php';
        if (is_file($file)) require_once $file;
    }
}, true, true);
if (!class_exists('App\\Http\\Controllers\\Controller')) class_alias(Illuminate\Routing\Controller::class, 'App\\Http\\Controllers\\Controller');

$elevationsFile = is_file($root.'/laravel/storage/app/private/mars/jezero-regional-200m/elevations.json')
    ? $root.'/laravel/storage/app/private/mars/jezero-regional-200m/elevations.json'
    : $root.'/data/elevations.json';

$app = new Illuminate\Foundation\Application($root.'/tests');
$config = new Illuminate\Config\Repository([
    'app' => ['key' => 'isolated-regional-test-key', 'env' => 'testing', 'debug' => true, 'locale' => 'en', 'fallback_locale' => 'en'],
    'cache' => ['default' => 'array', 'stores' => ['array' => ['driver' => 'array']]],
    'database' => ['default' => 'sqlite', 'connections' => ['sqlite' => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]]],
    'view' => ['paths' => [], 'compiled' => sys_get_temp_dir()],
    'logging' => ['default' => 'single', 'channels' => ['single' => ['driver' => 'single', 'path' => sys_get_temp_dir().'/mars-regional-test.log']]],
    'mars' => [
        'binary' => realpath($binary), 'timeout_seconds' => 120,
        'temporary_directory' => sys_get_temp_dir().'/mars-regional-'.getmypid(),
        'maps' => ['jezero-regional-200m' => [
            'terrain_file' => $root.'/laravel/storage/app/private/mars/jezero-regional-200m/terrain.json',
            'elevations_file' => $elevationsFile,
            'title' => 'Jezero full selected viewport — regional 200m',
            'bounds' => ['west' => 76.80291421306124, 'south' => 17.96348644765699, 'east' => 78.05672888693876, 'north' => 18.96873545234301],
        ]],
        'briefing' => [
            'walk_speed_kmh' => 2.0,
            'eva_budget_hours' => 8.0,
            'poi_radius_m' => 2000,
            'slope_caution_deg' => 10,
            'slope_nogo_deg' => 20,
            'high_cost_share_caution' => 0.25,
        ],
    ],
]);
$app->instance('config', $config);
$app->instance('request', Illuminate\Http\Request::create('http://localhost/'));
Illuminate\Support\Facades\Facade::setFacadeApplication($app);
foreach ([
    Illuminate\Filesystem\FilesystemServiceProvider::class,
    Illuminate\Translation\TranslationServiceProvider::class,
    Illuminate\Validation\ValidationServiceProvider::class,
    Illuminate\View\ViewServiceProvider::class,
    Illuminate\Database\DatabaseServiceProvider::class,
    Illuminate\Cache\CacheServiceProvider::class,
] as $provider) {
    $app->register($provider);
}
$app->boot();
$app->singleton(Illuminate\Contracts\Debug\ExceptionHandler::class, Illuminate\Foundation\Exceptions\Handler::class);
(new Illuminate\Foundation\Providers\FoundationServiceProvider($app))->registerRequestValidation();
foreach (glob($root.'/laravel/database/migrations/*.php') as $file) { $migration = require $file; $migration->up(); }

// Seed one POI right on the southwest start point to verify briefing science_stops integration.
App\Models\SciencePoi::create([
    'poi_code' => 'test_poi_sw',
    'name' => 'Test Jezero Delta Outcrop',
    'description' => 'Integration test science target',
    'lon' => 77.0,
    'lat' => 18.1,
    'type' => 'science_target',
    'metadata' => ['source' => 'integration_test'],
]);

// Cache nominal space weather so integration tests do not depend on external network.
Illuminate\Support\Facades\Cache::put('nasa_donki_space_weather', [
    'radiation_status' => 'NOMINAL',
    'strongest_flare_class' => 'NONE',
    'basis' => 'earth_view_flare_proxy',
], 3600);

$terrain = new App\Services\MarsTerrainMap($config);
$planner = new App\Services\MarsPathfinder($config, $terrain);
$weather = new App\Services\SpaceWeather();
$controller = new App\Http\Controllers\MarsRouteController;
$map = $terrain->load('jezero-regional-200m');
$session = new Illuminate\Session\Store('test', new Illuminate\Session\ArraySessionHandler(120)); $session->start();
$checkCount = 0;
function check($condition, $message): void { global $checkCount; if (!$condition) throw new RuntimeException($message); $checkCount++; }
function requestFor(array $payload, $session): Illuminate\Http\Request {
    $request = Illuminate\Http\Request::create('/mars/routes', 'POST', [], [], [], [
        'CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json',
    ], json_encode($payload));
    $request->setLaravelSession($session); return $request;
}
function payloadFor(array $start, array $target, array $map): array {
    return ['map_id' => $map['map_id'], 'map_version' => $map['version'], 'start' => $start, 'target' => $target];
}
check($map['width'] === 353 && $map['height'] === 298, 'Entire selected viewport dimensions');
check(!isset($map['start']) && !isset($map['target']), 'Terrain has no static endpoints');
$public = $controller->terrain('jezero-regional-200m', $terrain)->getData(true);
check(isset($public['requested_bounds'], $public['raster_bounds'], $public['projection']), 'Geographic transform contract');
check($public['regional_scale'] === 'regional' && $public['cell_size_meters'] == 200, 'Regional scale disclosed');
check(!str_contains(json_encode($public), '/home/ubuntu'), 'No server paths exposed');

$cases = [
    ['southwest_to_northeast', ['lon' => 77.0, 'lat' => 18.1], ['lon' => 77.9, 'lat' => 18.8], 600],
    ['northwest_to_southeast', ['lon' => 76.85, 'lat' => 18.9], ['lon' => 78.0, 'lat' => 18.05], 774],
    ['grid_input', ['x' => 55, 'y' => 257], ['x' => 308, 'y' => 50], 600],
    ['same_point', ['lon' => 77.42982155, 'lat' => 18.46611095], ['lon' => 77.42982155, 'lat' => 18.46611095], 0],
];
$summaryCases = []; $savedResults = [];
foreach ($cases as [$name, $startInput, $targetInput, $expected]) {
    $beforeTime = microtime(true);
    $response = $controller->store(requestFor(payloadFor($startInput, $targetInput, $map), $session), $terrain, $planner, $weather);
    $elapsed = microtime(true) - $beforeTime;
    $data = $response->getData(true);
    check($response->getStatusCode() === 200 && $data['status'] === 'success', 'Success: '.json_encode($data));
    check(!isset($data['briefing_error']), 'Briefing computed without error: '.($data['briefing_error'] ?? ''));
    check(isset($data['verdict']) && in_array($data['verdict'], ['GO', 'CAUTION', 'NO-GO'], true), 'Root verdict attached');
    check($data['requested_start'] == $startInput && $data['requested_target'] == $targetInput, 'Original selected points returned');
    check($data['paths'][0]['cost'] == $expected, 'Actual least cost matches independent baseline');
    check(count($data['paths']) === ($name === 'same_point' ? 1 : 3), 'Correct number of loopless routes');
    if ($name === 'southwest_to_northeast') {
        check(!empty($data['paths'][0]['briefing']['science_stops']), 'Nearby science POI attached to briefing');
    }
    $record = App\Models\MarsRouteRequest::findOrFail($data['request_id']);
    check($record->status === 'success' && $record->input_coordinates['start'] == $startInput, 'Selected input persisted');
    check($record->start_x === $data['start']['x'] && $record->target_y === $data['target']['y'], 'Canonical cells persisted');
    check($record->result['request_id'] === $data['request_id'], 'Full result persisted');
    $distinct = [];
    foreach ($data['paths'] as $idx => $route) {
        $points = $route['path'];
        check(isset($route['briefing']['verdict']), 'Briefing attached to every path');
        check(($route['geojson']['properties']['verdict'] ?? null) === $route['briefing']['verdict'], 'Verdict copied to path GeoJSON');
        check(($data['geojson']['features'][$idx]['properties']['verdict'] ?? null) === $route['briefing']['verdict'], 'Verdict copied to root GeoJSON');
        check($points[0] === $data['start'] && end($points) === $data['target'], 'Each route matches the requested cells');
        check(count($route['geographic_path']) === count($points), 'Geographic path for every cell');
        check($route['distance_meters'] == 200 * (count($points)-1), 'Projected grid length');
        $sum = 0; $seen = [];
        foreach ($points as $i => $point) {
            $id = $point['y'] * $map['width'] + $point['x'];
            check(!isset($seen[$id]), 'Loopless route'); $seen[$id] = true;
            check($map['grid'][$point['y']][$point['x']] >= 0, 'No forbidden cell');
            if ($i) { $before = $points[$i-1]; check(abs($before['x']-$point['x'])+abs($before['y']-$point['y'])===1, 'Four-neighbor path'); $sum += $map['grid'][$point['y']][$point['x']]; }
            $geo = $route['geographic_path'][$i]; $b = $map['requested_bounds'];
            check($geo['lon'] >= $b['west'] && $geo['lon'] <= $b['east'] && $geo['lat'] >= $b['south'] && $geo['lat'] <= $b['north'], 'Returned centers remain inside full viewport');
        }
        check($sum == $route['cost'], 'Entered-cell cost verified');
        $hash = hash('sha256', json_encode($points)); check(!isset($distinct[$hash]), 'Distinct paths'); $distinct[$hash]=true;
        check($route['geojson']['geometry']['type'] === ($name === 'same_point' ? 'Point' : 'LineString'), 'Valid GeoJSON geometry');
    }
    check($data['geojson']['type'] === 'FeatureCollection' && count($data['geojson']['features']) === count($data['paths']), 'Root GeoJSON for frontend');
    $summaryCases[] = ['case' => $name, 'request_id' => $data['request_id'], 'requested_start' => $startInput,
                      'requested_target' => $targetInput, 'costs' => array_column($data['paths'], 'cost'),
                      'distance_meters' => array_column($data['paths'], 'distance_meters'), 'verdict' => $data['verdict'],
                      'elapsed_seconds_on_sandbox' => round($elapsed,4)];
    $savedResults[$name] = $data;
}
$first = $summaryCases[0]['request_id'];
$shown = $controller->show(requestFor([], $session), $first)->getData(true);
check($shown['input_coordinates']['start'] == $cases[0][1], 'Saved request retrievable');
$other = new Illuminate\Session\Store('other', new Illuminate\Session\ArraySessionHandler(120)); $other->start();
try { $controller->show(requestFor([], $other), $first); throw new RuntimeException('Cross-session record access'); }
catch (Illuminate\Database\Eloquent\ModelNotFoundException $e) { check(true, 'Session ownership enforced'); }
$before = App\Models\MarsRouteRequest::count();
$blocked = null;
foreach ($map['grid'] as $y => $row) { foreach ($row as $x => $cost) if ($cost < 0) { $blocked=['x'=>$x,'y'=>$y]; break 2; } }
check($blocked !== null, 'Actual terrain contains modeled obstacles');
$blockedGeo = $terrain->cellCenter($map, $blocked);
$blockedResponse = $controller->store(requestFor(payloadFor($blockedGeo, $cases[0][2], $map), $session), $terrain, $planner, $weather);
check($blockedResponse->getStatusCode()===422 && $blockedResponse->getData(true)['error_code']==='BLOCKED_POINT', 'Blocked geographic selection rejected without relocation');
foreach ([['lon'=>76.7,'lat'=>18.5], ['x'=>353,'y'=>0], ['lon'=>77.0,'lat'=>18.1,'x'=>1], ['lon'=>'77.0','lat'=>18.1]] as $bad) {
    try { $controller->store(requestFor(payloadFor($bad, $cases[0][2], $map), $session), $terrain, $planner, $weather); throw new RuntimeException('Invalid coordinate accepted'); }
    catch (Illuminate\Validation\ValidationException $e) { check($e->status===422, 'Invalid coordinate is 422'); }
}
$stale = payloadFor($cases[0][1], $cases[0][2], $map); $stale['map_version']=str_repeat('0',64);
$staleResponse=$controller->store(requestFor($stale,$session),$terrain,$planner,$weather);
check($staleResponse->getStatusCode()===409, 'Stale map version rejected');
check(App\Models\MarsRouteRequest::count()===$before, 'Invalid requests are not successful saved routes');
check(glob($config->get('mars.temporary_directory').'/route_*')===[], 'Temporary request files cleaned');
$result=['status'=>'passed','framework'=>Illuminate\Foundation\Application::VERSION,'checks'=>$checkCount,
         'map_id'=>$map['map_id'],'map_version'=>$map['version'],'dimensions'=>[$map['width'],$map['height']],
         'cases'=>$summaryCases,'database'=>'isolated SQLite in-memory',
         'note'=>'Full integration: Laravel controller/services, RouteBriefing, SpaceWeather, SciencePoi, and native C++ solver'];
file_put_contents($root.'/tests/backend_test_result.json',json_encode($result,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)."\n");
file_put_contents($root.'/tests/example_route_response.json',json_encode($savedResults['southwest_to_northeast'],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)."\n");
file_put_contents($root.'/tests/example_route_request.json',json_encode(payloadFor($cases[0][1],$cases[0][2],$map),JSON_PRETTY_PRINT)."\n");
echo json_encode($result,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)."\n";
foreach (glob($config->get('mars.temporary_directory').'/*.lock') as $file) unlink($file);
rmdir($config->get('mars.temporary_directory'));