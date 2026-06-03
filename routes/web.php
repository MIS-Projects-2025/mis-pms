<?php

use App\Http\Controllers\DemoController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

$app_name = env('APP_NAME', '');

// Authentication routes
require __DIR__ . '/auth.php';

// General routes
require __DIR__ . '/general.php';

// Computer routes
require __DIR__ . '/computer.php';

// Printer routes
require __DIR__ . '/printer.php';

// Reports routes
require __DIR__ . '/reports.php';

// cctv routes
require __DIR__ . '/cctv.php';

// Inventory routes
require __DIR__ . '/inventory.php';

// Ladder routes
require __DIR__ . '/ladder.php';

Route::get("/demo", [DemoController::class, 'index'])->name('demo');

Route::fallback(function () {
    return Inertia::render('404');
})->name('404');
