<?php

use App\Http\Controllers\Computer\ComputerChecklistController;
use App\Http\Controllers\Computer\ComputerChecklistItemController;
use App\Http\Controllers\General\ProfileController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;

$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {

  Route::middleware(AdminMiddleware::class)->group(function () {
    Route::get("/computer-checklist", [ComputerChecklistController::class, 'index'])->name('computer-checklist');
    Route::post("/computer-checklist/store", [ComputerChecklistController::class, 'store'])->name('computer-checklist.store');
    Route::put("/computer-checklist/update/{id}", [ComputerChecklistController::class, 'update'])->name('computer-checklist.update');
    Route::delete("/computer-checklist/destroy/{id}", [ComputerChecklistController::class, 'destroy'])->name('computer-checklist.destroy');
    Route::get('/computer-checklist/pdf/{id}', [ComputerChecklistController::class, 'pdf'])->name('computer-checklist.pdf');

    Route::put("/computer-checklist/verifyings/{id}", [ComputerChecklistController::class, 'verifyings'])->name('computer-checklist.verify');


    Route::get("/computer-checklist-items", [ComputerChecklistItemController::class, 'index'])->name('computer-checklist-items');
    Route::post("/computer-checklist-items/bulk-store", [ComputerChecklistItemController::class, 'bulkStore'])->name('computer-checklist-items.bulk-store');
    Route::put("/computer-checklist-items/update/{id}", [ComputerChecklistItemController::class, 'update'])->name('computer-checklist-items.update');
    Route::delete("/computer-checklist-items/destroy/{id}", [ComputerChecklistItemController::class, 'destroy'])->name('computer-checklist-items.destroy');
  });

  Route::get("/", [DashboardController::class, 'index'])->name('dashboard');
  Route::get("/profile", [ProfileController::class, 'index'])->name('profile.index');
  Route::post("/change-password", [ProfileController::class, 'changePassword'])->name('changePassword');
});
