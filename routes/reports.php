<?php

use App\Http\Controllers\General\AdminController;
use App\Http\Controllers\General\ProfileController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Reports\ComputerRepairController;
use App\Http\Controllers\Reports\HardwareReportController;

$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {

  Route::middleware(AdminMiddleware::class)->group(function () {
    Route::get("/hardware-reports", [HardwareReportController::class, 'index'])->name('hardware_reports.index');

    Route::get("/computer-repairs/index", [ComputerRepairController::class, 'index'])->name('computer_repairs.index');
    Route::post("/computer-repairs/store", [ComputerRepairController::class, 'store'])->name('computer_repairs.store');
    Route::get('/computer-repairs/{id}/pdf', [ComputerRepairController::class, 'pdf'])->name('computer_repairs.pdf');
  });
});
