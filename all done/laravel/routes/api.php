<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MarsNavigationController;

Route::post('/route/plan', [MarsNavigationController::class, 'calculateRoute']);
Route::get('/science/pois', [MarsNavigationController::class, 'getSciencePOIs']);
Route::post('/science/pois/sync', [MarsNavigationController::class, 'syncSciencePOIs']);
Route::get('/maps/layers', [MarsNavigationController::class, 'getMapLayers']);
Route::get('/mars/images', [MarsNavigationController::class, 'getMarsContextImages']);
Route::get('/mars/space-weather', [MarsNavigationController::class, 'getSpaceWeather']);
