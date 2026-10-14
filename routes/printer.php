<?php

use App\Http\Controllers\Printer\PrinterChecklistController;
use App\Http\Controllers\Printer\PrinterChecklistItemController;
use App\Http\Controllers\General\ProfileController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Printer\BoxingPrinterChecklistController;
use App\Http\Controllers\Printer\BoxingPrinterChecklistItemController;

$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {

  Route::middleware(AdminMiddleware::class)->group(function () {

    // printer checklist
    Route::get("/printer-checklist", [PrinterChecklistController::class, 'index'])->name('printer-checklist');
    Route::post("/printer-checklist/store", [PrinterChecklistController::class, 'store'])->name('printer-checklist.store');
    Route::put("/printer-checklist/update/{id}", [PrinterChecklistController::class, 'update'])->name('printer-checklist.update');
    Route::delete("/printer-checklist/destroy/{id}", [PrinterChecklistController::class, 'destroy'])->name('printer-checklist.destroy');
    Route::get('/printer-checklist/pdf/{id}', [PrinterChecklistController::class, 'pdf'])
      ->name('printer-checklist.pdf');

    Route::put("/printer-checklist/verifyings/{id}", [PrinterChecklistController::class, 'verifyings'])->name('printer-checklist.verify');


    // printer checklist items
    Route::get("/printer-checklist-items", [PrinterChecklistItemController::class, 'index'])->name('printer-checklist-items');
    Route::post("/printer-checklist-items/bulk-store", [PrinterChecklistItemController::class, 'bulkStore'])->name('printer-checklist-items.bulk-store');
    Route::put("/printer-checklist-items/update/{id}", [PrinterChecklistItemController::class, 'update'])->name('printer-checklist-items.update');
    Route::delete("/printer-checklist-items/destroy/{id}", [PrinterChecklistItemController::class, 'destroy'])->name('printer-checklist-items.destroy');



    // boxing printer checklist items
    Route::get("/boxing/printer-checklist-items", [BoxingPrinterChecklistItemController::class, 'index'])->name('boxing-printer-checklist-items');
    Route::post("/boxing/printer-checklist-items/bulk-store", [BoxingPrinterChecklistItemController::class, 'bulkStore'])->name('boxing-printer-checklist-items.bulk-store');
    Route::put("/boxing/printer-checklist-items/update/{id}", [BoxingPrinterChecklistItemController::class, 'update'])->name('boxing-printer-checklist-items.update');
    Route::delete("/boxing/printer-checklist-items/destroy/{id}", [BoxingPrinterChecklistItemController::class, 'destroy'])->name('boxing-printer-checklist-items.destroy');



    // boxing printer checklist
    Route::get("/boxing/printer-checklist", [BoxingPrinterChecklistController::class, 'index'])->name('boxing-printer-checklist');
    Route::post("/boxing/printer-checklist/bulk-store", [BoxingPrinterChecklistController::class, 'store'])->name('boxing-printer-checklist.bulk-store');
    Route::post('/boxing-printer-checklist/{id}/acknowledge', [BoxingPrinterChecklistController::class, 'acknowledge'])->name('boxing-printer-checklist.acknowledge');
    Route::post('/boxing-printer-checklist/{id}/approved', [BoxingPrinterChecklistController::class, 'approved'])->name('boxing-printer-checklist.approved');
    Route::put("/boxing/printer-checklist/update/{id}", [BoxingPrinterChecklistController::class, 'update'])->name('boxing-printer-checklist.update');
    Route::delete("/boxing/printer-checklist/destroy/{id}", [BoxingPrinterChecklistController::class, 'destroy'])->name('boxing-printer-checklist.destroy');
    Route::get('/boxing/boxing-printer-checklist/pdf/{id}', [BoxingPrinterChecklistController::class, 'pdf'])->name('boxing-printer-checklist.pdf');
  });
});
