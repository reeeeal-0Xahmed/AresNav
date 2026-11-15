<?php

use App\Http\Controllers\MarsContextController;
use App\Http\Controllers\MarsRouteController;
use Illuminate\Support\Facades\Route;

// Include this file FROM routes/web.php, so session + CSRF middleware remain enabled.
// For your public production app, also apply your existing authentication policy.
Route::prefix('mars')->name('mars.')->group(function (): void {
    // Route planning (terrain, planner, saved requests)
    Route::get('/terrain/{mapId}', [MarsRouteController::class, 'terrain'])->name('terrain');
    Route::post('/routes', [MarsRouteController::class, 'store'])->middleware('throttle:5,1')->name('routes.store');
    Route::get('/routes/{id}', [MarsRouteController::class, 'show'])->whereUuid('id')->name('routes.show');

    // Context layers (read-only)
    Route::middleware('throttle:60,1')->group(function (): void {
        Route::get('/layers', [MarsContextController::class, 'layers'])->name('layers');
        Route::get('/science/pois', [MarsContextController::class, 'pois'])->name('pois');
        Route::get('/space-weather', [MarsContextController::class, 'spaceWeather'])->name('space-weather');
        Route::get('/images', [MarsContextController::class, 'images'])->name('images');
    });
});
