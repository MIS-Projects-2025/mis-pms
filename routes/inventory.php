<?php

use App\Http\Controllers\InventoryController;
use Illuminate\Support\Facades\Route;

$app_name = $app_name ?? env('APP_NAME', 'app');

Route::prefix($app_name)->group(function () {

     Route::get('/{hardwareId}/full-details', [InventoryController::class, 'getFullHardwareDetails'])->name('hardware.full.details');
    Route::get('/hostnames', [InventoryController::class, 'getHostNames'])->name('hardware.hostnames');

});
