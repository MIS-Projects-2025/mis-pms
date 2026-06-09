<?php

namespace App\Http\Controllers\Computer;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class ComputerChecklistController extends Controller
{
    protected $datatable;
    protected $datatable1;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }


    public function index(Request $request)
    {

        $computerChecklists = DB::connection('checklist')->table('computers_checklist_items')->get();

        $computerName = DB::connection('mis')
            ->table('hardware')
            ->where('status', '1')
            ->orderBy('hostname', 'asc')
            ->get();


        $result = $this->datatable->handle(
            $request,
            'checklist',
            'computer_checklists',
            [
                'conditions' => function ($query) use ($request) {
    $query->orderBy('id', 'DESC');

    if ($request->filled('status')) {
        $query->where('status', $request->status);
    }

    if ($request->filled('start') && $request->filled('end')) {
        $query->whereBetween('date_created', [
            $request->start,
            $request->end
        ]);
    }

            return $query;
            },

                'searchColumns' => ['computer_name', 'date_checked', 'performed_by', 'recommendations'],
                'status',

                'filename' => 'computer_checklist_export_' . now()->format('Ymd_His'), // Filename for export
                'exportColumns' => ['computer_name', 'date_checked', 'date_due', 'performed_by', 'items', 'recommendations', 'verified_by', 'verified_date'],
            ]


        );

        // FOR CSV EXPORTING
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('Computer/ComputerChecklist', [
            'tableData' => $result['data'],
            'computerChecklists' => $computerChecklists,
            'computerName' => $computerName,
            'tableFilters' => $request->only([
    'search',
    'perPage',
    'sortBy',
    'sortDirection',
    'start',
    'end',
    'dateField',
    'dropdownSearchValue',
    'dropdownFields',
    'status',
]),
        ]);
    }

    public function store(Request $request)
    {
        $items = $request->input('items'); // array from frontend
        $computerName = $request->input('computer_name');
        $recommendations = $request->input('recommendations');
        $status = 2;

        if (empty($items) || !is_array($items)) {
            return redirect()->back()->with('error', 'No checklist items provided');
        }

        DB::connection('checklist')->table('computer_checklists')->insert([
            'computer_name' => $computerName ?? 'Unknown',
            'date_checked' => $request->input('date_checked') ?? null,
            'date_due' => $request->input('date_due') ?? null,
            'performed_by' => $request->input('performed_by') ?? session('emp_data.emp_name'),
            'items' => json_encode($items), // save as JSON
            'recommendations' => $recommendations ?? null,
            'status' => $status ?? null,
        ]);

        return redirect()->route('computer-checklist')
            ->with('success', 'Checklist saved successfully.');
    }

    public function update(Request $request, $id)
    {
        // Validate input
        $validated = $request->validate([
            'computer_name' => 'required|string|max:255',
            'date_checked' => 'required|date',
            'date_due' => 'required|date',
            'performed_by' => 'required|string|max:255',
            'items' => 'required|array',
            'items.*.task' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.status' => 'nullable|string|in:ok,repair,na',
            'recommendations' => 'nullable|string',
        ]);



        // Check if checklist exists
        $checklist = DB::connection('checklist')->table('computer_checklists')->where('id', $id)->first();
        if (!$checklist) {
            return redirect()->back()->with('error', 'Checklist not found.');
        }

        // Update record
        $dateToUpdate = DB::connection('checklist')->table('computer_checklists')
            ->where('id', $id)
            ->update([
                'computer_name' => $validated['computer_name'],
                'date_checked' => $validated['date_checked'],
                'performed_by' => $validated['performed_by'],
                'items' => json_encode($validated['items']),
                'recommendations' => $validated['recommendations'] ?? null,
                'updated_by' => session('emp_data.emp_name') ?? null,
            ]);

        return redirect()->route('computer-checklist')
            ->with('success', 'Checklist updated successfully.');
    }

    public function verifyings(Request $request, $id)
    {
        DB::connection('checklist')->table('computer_checklists')
            ->where('id', $id)
            ->update([
                'verified_by' => session('emp_data.emp_name'),
                'date_verified' => date('Y-m-d H:i:s'),
                'status' => 1,
            ]);

        return redirect()->route('computer-checklist')
            ->with('success', 'Checklist verified successfully.');
    }


    public function destroy($id)
    {
        DB::connection('checklist')->table('computer_checklists')->where('id', $id)->delete();

        return redirect()->route('computer-checklist')->with('success', 'Checklist removed successfully.');
    }

    public function pdf($id)
    {
        $checklist = DB::connection('checklist')->table('computer_checklists')->where('id', $id)->first();

        if (!$checklist) {
            abort(404);
        }

        $checklist->items = $checklist->items ? json_decode($checklist->items, true) : [];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('checklist.computer', compact('checklist'))
            ->setPaper('a4', 'portrait')
            ->setOptions(['defaultFont' => 'DejaVu Sans']);

        return $pdf->stream("checklist_$id.pdf");
    }
}
