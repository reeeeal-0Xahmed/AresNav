<?php
// Logic-only test of SpaceWeather::classify (Laravel's now() helper is stubbed).
namespace { 
    class FakeNow { function toIso8601String() { return '2026-11-14T00:00:00+00:00'; } }
    function now() { return new FakeNow(); }
}
namespace {
    require __DIR__.'/../laravel/app/Services/SpaceWeather.php';
    $w = new App\Services\SpaceWeather();
    $fail = 0;
    $t = function (string $n, bool $ok) use (&$fail) { echo ($ok ? 'PASS ' : 'FAIL ').$n."\n"; if (!$ok) $fail++; };
    $t('no flares => NOMINAL', $w->classify([])['radiation_status'] === 'NOMINAL');
    $t('C9.9 => NOMINAL', $w->classify([['classType' => 'C9.9']])['radiation_status'] === 'NOMINAL');
    $t('M1.2 => NOMINAL', $w->classify([['classType' => 'M1.2']])['radiation_status'] === 'NOMINAL');
    $t('M5.0 => ELEVATED', $w->classify([['classType' => 'M5.0']])['radiation_status'] === 'ELEVATED');
    $t('X1.0 => HIGH', $w->classify([['classType' => 'X1.0']])['radiation_status'] === 'HIGH_RADIATION_WARNING');
    // regression: old code used end($flares); an X flare followed by a weaker one was reported SAFE
    $r = $w->classify([['classType' => 'X2.1', 'beginTime' => 'a'], ['classType' => 'C1.0', 'beginTime' => 'b']]);
    $t('strongest wins, not last (old bug)', $r['radiation_status'] === 'HIGH_RADIATION_WARNING' && $r['strongest_flare_class'] === 'X2.1');
    $t('garbage classType ignored', $w->classify([['classType' => 'zz'], []])['radiation_status'] === 'NOMINAL');
    echo $fail === 0 ? "ALL PASSED\n" : "$fail FAILED\n"; exit($fail ? 1 : 0);
}
