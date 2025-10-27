<?php

use App\Http\Controllers\GalacticTycoons\BuildingsController;
use App\Http\Controllers\GalacticTycoons\CalculatorController;
use App\Http\Controllers\GalacticTycoons\GalacticTycoonsController;
use App\Http\Controllers\GalacticTycoons\PlannerController;
use App\Http\Controllers\GalacticTycoons\PricesController;
use App\Http\Controllers\GalacticTycoons\RecipesController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/galactic-tycoons');
});

// ========================================
// GALACTIC TYCOONS - API ROUTES
// ========================================
Route::prefix('/api/galactic-tycoons')->group(function () {
    // Recipes API
    Route::get('/recipes', [RecipesController::class, 'get']);
    Route::post('/recipes', [RecipesController::class, 'save']);

    // Machines API
    Route::get('/machines', [RecipesController::class, 'getMachines']);

    // Buildings API
    Route::get('/buildings', [BuildingsController::class, 'get']);

    // Workers API (for upkeep calculations)
    Route::get('/workers', [BuildingsController::class, 'getWorkers']);

    // Prices API (fallback, uses localStorage)
    Route::get('/prices', [BuildingsController::class, 'getPrices']);
    
    // Planner API
    Route::get('/planner/building-costs', [PlannerController::class, 'getBuildingCosts']);

    // Fetch prices from external API (proxy to avoid CORS)
    Route::get('/prices/fetch-from-api', [PricesController::class, 'fetchFromApi']);
});

// ========================================
// GALACTIC TYCOONS - WEB ROUTES
// ========================================
Route::prefix('/galactic-tycoons')->group(function () {
    // Galactic Tycoons Index
    Route::get('/', [GalacticTycoonsController::class, 'index'])
        ->name('galactic-tycoons.index');

    // Market Prices
    Route::get('/prices', [PricesController::class, 'index'])
        ->name('galactic-tycoons.prices');

    // Crafting Recipes
    Route::get('/recipes', [RecipesController::class, 'index'])
        ->name('galactic-tycoons.recipes');

    // Buildings Management (old combined page - redirect to systems)
    Route::get('/buildings', function () {
        return redirect()->route('galactic-tycoons.buildings.systems');
    })->name('galactic-tycoons.buildings');

    // Buildings per System
    Route::get('/buildings/systems', [BuildingsController::class, 'systems'])
        ->name('galactic-tycoons.buildings.systems');

    // Worker Upkeep
    Route::get('/buildings/upkeep', [BuildingsController::class, 'upkeep'])
        ->name('galactic-tycoons.buildings.upkeep');

    // Workforce Summary
    Route::get('/buildings/workforce', [BuildingsController::class, 'workforce'])
        ->name('galactic-tycoons.buildings.workforce');

    // Calculator
    Route::get('/calculator', [CalculatorController::class, 'index'])
        ->name('galactic-tycoons.calculator');

    // Planner
    Route::get('/planner', [PlannerController::class, 'index'])
        ->name('galactic-tycoons.planner');
});
