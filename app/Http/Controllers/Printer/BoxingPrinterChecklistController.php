<?php

namespace App\Http\Controllers\Printer;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use DateTime;
use Illuminate\Support\Facades\Date;

class BoxingPrinterChecklistController extends Controller
{
    protected $datatable;
    protected $datatable1;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }


    public function index(Request $request)
    {

        $boxingPrinterChecklists = DB::connection('checklist')->table('boxing_printer_checklist_items')->get();



        $result = $this->datatable->handle(
            $request,
            'checklist',
            'boxing_printer_checklists',
            [
                'conditions' => function ($query) use ($request) {
                    $query->orderBy('id', 'DESC');

                    if ($request->filled('status')) {
                      $query->where('status', $request->status);
                    }

                return $query;
                },

                'searchColumns' => ['performed_by', 'date_performed', 'acknowledge_by'],
            ]
        );

        // FOR CSV EXPORTING
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('Printer/BoxingPrinterChecklist', [
            'tableData' => $result['data'],
            'boxingPrinterChecklists' => $boxingPrinterChecklists,
            'tableFilters' => $request->only([
                'search',
                'perPage',
                'sortBy',
                'sortDirection',
                'start',
                'end',
                'dropdownSearchValue',
                'dropdownFields',
                'status',
            ]),
        ]);
    }

    public function store(Request $request)
    {

        $now = Carbon::now(); // current datetime

        // A-Shift: 07:00 AM to 06:59 PM
        $aShiftStart = Carbon::today()->setTime(7, 0, 0);
        $aShiftEnd = Carbon::today()->setTime(18, 59, 0);

        // C-Shift: 07:00 PM to 06:59 AM next day
        $cShiftStart = Carbon::today()->setTime(19, 0, 0);
        $cShiftEnd = Carbon::tomorrow()->setTime(6, 59, 0);

        if ($now->between($aShiftStart, $aShiftEnd)) {
            $shift = 'A';
        } elseif ($now->between($cShiftStart, $cShiftEnd)) {
            $shift = 'C';
        } else {
            $shift = null; // or handle error if needed
        }

        // Validate fields
        $request->validate([
            'performed_by'   => 'required|string',
            'date_performed' => 'required|date',
            'items'          => 'required|array',   // all rows with checkboxes + remarks
        ]);

        // Insert
        DB::connection('checklist')->table('boxing_printer_checklists')->insert([
            'performed_by'   => $request->performed_by,
            'date_performed' => $request->date_performed,
            'items'          => json_encode($request->items),  // → SAVE JSON
            'shift'          => $shift,
            'status'         => 2,
        ]);

        return redirect()->route('boxing-printer-checklist')
            ->with('success', 'Checklist saved successfully.');
    }

    public function acknowledge($id, Request $request)
    {
        $acknowledgedBy = session('emp_data')['emp_name'] ?? null;

        $request->validate([
            'acknowledged_by' => 'required|string|max:255',
        ]);

        DB::connection('checklist')
            ->table('boxing_printer_checklists')
            ->where('id', $id)
            ->update([
                'acknowledged_by' => $acknowledgedBy,
                'date_acknowledged' => (new DateTime())->format('m/d/Y H:i'),
            ]);

        return redirect()->back()->with('success', 'Acknowledged successfully.');
    }

    public function approved($id, Request $request)
    {
        $approvedBy = session('emp_data')['emp_name'] ?? null;

        $request->validate([
            'verified_by' => 'required|string|max:255',
        ]);

        DB::connection('checklist')
            ->table('boxing_printer_checklists')
            ->where('id', $id)
            ->update([
                'verified_by' => $approvedBy,
                'date_verified' => (new DateTime())->format('m/d/Y H:i'),
                'status' => 1,
            ]);

        return redirect()->back()->with('success', 'Approved successfully.');
    }


    public function update(Request $request, $id)
    {
        DB::connection('checklist')->table('boxing_printer_checklists')
            ->where('id', $id)
            ->update([
                'date_performed' => $request->date_performed,
                'items' => $request->has('items') ? json_encode($request->items) : null,
            ]);

        return redirect()->back()->with('success', 'Checklist updated successfully.');
    }

    public function destroy($id)
    {
        DB::connection('checklist')->table('boxing_printer_checklists')->where('id', $id)->delete();

        return redirect()->back()->with('success', 'Checklist removed successfully.');
    }

    public function pdf($id)
    {

        $checklist = DB::connection('checklist')->table('boxing_printer_checklists')->where('id', $id)->first();

        if (!$checklist) {
            abort(404, 'Checklist not found.');
        }

        // Decode JSON items safely and convert to Collection
        $checklist->items = collect(json_decode($checklist->items) ?? []);

        $pdf = Pdf::loadView('checklist.boxing', compact('checklist'));
        return $pdf->stream('checklist_' . $id . '.pdf');
    }
}
