<?php

use App\Http\Controllers\Ladder\LadderChecklistController;
use App\Http\Controllers\Ladder\LadderChecklistItemController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;

$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {

  Route::middleware(AdminMiddleware::class)->group(function () {

    // Ladder Checklist Items
    Route::get("/ladder-checklist-items-index", [LadderChecklistItemController::class, 'index'])->name('ladder_checklist_items.index');

    Route::post(
      "/ladder-checklist-items-store",
      [LadderChecklistItemController::class, 'store']
    )->name('ladder_checklist_items.store');

    Route::put("/ladder-checklist-items/{id}", [LadderChecklistItemController::class, 'update'])
      ->name('ladder_checklist_items.update');

    Route::delete("/ladder-checklist-items/{id}", [LadderChecklistItemController::class, 'destroy'])
      ->name('ladder_checklist_items.destroy');



    // Ladder Checklist Items
    Route::get("/ladder-checklist-index", [LadderChecklistController::class, 'index'])->name('ladder_checklist.index');

    Route::post('/ladder-checklist', [LadderChecklistController::class, 'store'])
      ->name('ladder_checklist.store');

    Route::put('/ladder-checklist/{id}/verify', [LadderChecklistController::class, 'verify'])
      ->name('ladder_checklist.verify');

    Route::put('/ladder-checklist/{id}/next-check', [LadderChecklistController::class, 'nextCheck'])
      ->name('ladder_checklist.next_check');

    Route::get('/ladder-checklist/pdf/{id}', [LadderChecklistController::class, 'generatePDF'])
      ->name('ladder_checklist.pdf');
  });
});
