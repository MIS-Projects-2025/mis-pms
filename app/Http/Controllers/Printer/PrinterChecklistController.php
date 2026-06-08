<?php

namespace App\Http\Controllers\Printer;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class PrinterChecklistController extends Controller
{
    protected $datatable;
    protected $datatable1;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }


    public function index(Request $request)
    {

        $printerChecklists = DB::connection('checklist')->table('printer_checklist_items')->get();

        $today = Carbon::today();

        // Kunin lahat ng printers sa checklist na existing base sa pm_date at next_pm
        // $existingChecklist = DB::connection('checklist')
        //     ->table('printer_checklists')
        //     ->whereDate('pm_date', '<=', $today)
        //     ->whereDate('next_pm', '>', $today)
        //     ->pluck('printer_name')
        //     ->toArray(); // convert sa array para sa whereNotIn

        $existingChecklist = DB::connection('checklist')
            ->table('printer_checklists')
            ->whereMonth('pm_date', $today->month)
            ->whereYear('pm_date', $today->year)
            ->when($today->isLastOfMonth(), function ($query) {
                // Exclude lahat kapag last day na
                $query->whereRaw('1 = 0');
            })
            ->pluck('printer_name')
            ->toArray();

        // Kunin ang printers sa mis na wala sa existing checklist
        $printerName = DB::connection('mis')
            ->table('printer')
            ->where('printer_name', '!=', 'N/A')
            ->where('status', '1')
            ->whereNotIn('printer_name', $existingChecklist)
            ->orderBy('printer_name', 'asc')
            ->get();

        $printerName = $printerName->map(function ($printer) {
            $locationValue = $printer->location;

            // Check kung number (ID)
            if (is_numeric($locationValue)) {
                $locationName = DB::connection('server25')
                    ->table('location_list')
                    ->where('id', $locationValue)
                    ->value('location_name');

                $printer->location = $locationName ?? $locationValue;
            }

            return $printer;
        });



        $result = $this->datatable->handle(
            $request,
            'checklist',
            'printer_checklists',
            [
                'conditions' => function ($query) use ($request) {
                    $query->orderBy('id', 'DESC');

                    if ($request->filled('status')) {
                      $query->where('status', $request->status);
                    }

                return $query;
                },

                'searchColumns' => ['pm_date', 'performed_by', 'printer_name', 'serial_num', 'location', 'next_pm'],
            ]
        );

        // FOR CSV EXPORTING
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('Printer/PrinterChecklist', [
            'tableData' => $result['data'],
            'printerChecklists' => $printerChecklists,
            'printerName' => $printerName,
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
        // Validate required fields (optional)
        $request->validate([
            'pm_date' => 'required|date',
            'performed_by' => 'required|string',
            'printer_name' => 'required|string',
            'serial_num' => 'required|string',
            'location' => 'required|string',
            'next_pm' => 'nullable|date',
            'items' => 'required|array',
        ]);

        // Insert into printer_checklists table
        DB::connection('checklist')->table('printer_checklists')->insert([
            'pm_date' => $request->input('pm_date'),
            'performed_by' => $request->input('performed_by'),
            'printer_name' => $request->input('printer_name'),
            'serial_num' => $request->input('serial_num'),
            'location' => $request->input('location'),
            'next_pm' => $request->input('next_pm'),
            'items' => json_encode($request->input('items')), // save checklist items as JSON
            'recommendations' => $request->input('recommendations') ?? null,
            'status' => 2,
        ]);

        return redirect()->route('printer-checklist')
            ->with('success', 'Checklist saved successfully.');
    }

    public function verifyings(Request $request, $id)
    {
        DB::connection('checklist')->table('printer_checklists')
            ->where('id', $id)
            ->update([
                'verified_by' => session('emp_data.emp_name'),
                'date_verified' => date('Y-m-d H:i:s'),
                'status' => 1,
            ]);

        return redirect()->back()
            ->with('success', 'Checklist verified successfully.');
    }

    public function update(Request $request, $id)
    {
        DB::connection('checklist')->table('printer_checklists')
            ->where('id', $id)
            ->update([
                'pm_date' => $request->pm_date,
                'printer_name' => $request->printer_name,
                'serial_num' => $request->serial_num,
                'location' => $request->location,
                'next_pm' => $request->next_pm,
                'recommendations' => $request->recommendations,
                'items' => $request->has('items') ? json_encode($request->items) : null,
            ]);

        return redirect()->route('printer-checklist')->with('success', 'Checklist updated successfully.');
    }

    public function destroy($id)
    {
        DB::connection('checklist')->table('printer_checklists')->where('id', $id)->delete();

        return redirect()->route('printer-checklist')->with('success', 'Checklist removed successfully.');
    }

    public function pdf($id)
    {
        $checklist = DB::connection('checklist')->table('printer_checklists')->where('id', $id)->first();

        if (!$checklist) {
            abort(404, 'Checklist not found.');
        }

        // Decode JSON items safely and convert to Collection
        $checklist->items = collect(json_decode($checklist->items) ?? []);

        $pdf = Pdf::loadView('checklist.printer', compact('checklist'));
        return $pdf->stream('checklist_' . $id . '.pdf');
    }
}
