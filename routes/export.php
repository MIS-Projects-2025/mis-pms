<?php

use App\Http\Controllers\ExportController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;

$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {

  Route::middleware(AdminMiddleware::class)->group(function () {

    Route::get('/export', [ExportController::class, 'index'])->name('export.index');
    Route::get('/export/preview', [ExportController::class, 'preview'])->name('export.preview');
    Route::post('/export/generate', [ExportController::class, 'generate'])->name('export.generate');


  });
});
