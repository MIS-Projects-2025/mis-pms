<?php

use App\Http\Controllers\Cctv\CctvChecklistController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;

$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {

  Route::middleware(AdminMiddleware::class)->group(function () {
    Route::get("/cctv-index", [CctvChecklistController::class, 'index'])->name('cctv.index');
    Route::post("/cctv-tbl", [CctvChecklistController::class, 'store'])->name('cctv.store');
    Route::put("/cctv-tbl/edit/{id}", [CctvChecklistController::class, 'update'])->name('cctv.update');
    Route::get('/reports/{id}/pdf', [CctvChecklistController::class, 'viewPdf'])->name('cctv.viewPdf');

    Route::put("/cctv-checklist/verifyings/{id}", [CctvChecklistController::class, 'verifyings'])->name('cctv-checklist.verify');
  });
});
