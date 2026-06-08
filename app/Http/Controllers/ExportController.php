<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\GenericExport;
use App\Services\ExportService;

class ExportController extends Controller
{
    protected ExportService $exportService;

    public function __construct(ExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    public function index()
    {
        $tables = collect(config('export_tables'))
            ->map(fn ($item, $key) => [
                'label' => $item['label'],
                'value' => $key,
            ])->values();

        return Inertia::render('ExportPage', [
            'tables' => $tables,
        ]);
    }

    public function preview(Request $request)
    {
        $request->validate([
            'table' => 'required|string',
            'from' => 'required|date',
            'to' => 'required|date',
        ]);

        $data = $this->exportService->fetch(
            $request->table,
            Carbon::parse($request->from),
            Carbon::parse($request->to)
        );

        return response()->json([
            'data' => $data->take(100),
        ]);
    }



    public function generate(Request $request)
    {
        $request->validate([
            'table' => 'required|string',
            'from' => 'required|date',
            'to' => 'required|date',
            'format' => 'required|in:excel,csv',
        ]);

        $data = $this->exportService->fetch(
            $request->table,
            Carbon::parse($request->from),
            Carbon::parse($request->to)
        );

        $filename =
            $request->table .
            '_' .
            now()->format('Ymd_His');

        if ($request->format === 'csv') {

            return Excel::download(
                new GenericExport($data),
                $filename . '.csv',
                \Maatwebsite\Excel\Excel::CSV
            );
        }

        return Excel::download(
            new GenericExport($data),
            $filename . '.xlsx',
            \Maatwebsite\Excel\Excel::XLSX
        );
    }

    private function exportPdf($data, $label, $filename)
    {
        $pdf = app('dompdf.wrapper');
        $pdf->loadView('exports.generic', compact('data', 'label'));

        return $pdf->download("$filename.pdf");
    }
}
