<?php

namespace App\Http\Controllers\Cctv;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class CctvChecklistController extends Controller
{
    protected $datatable;
    protected $datatable1;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }


    public function index(Request $request)
    {


        $area = DB::connection('server25')->table('location_list')
            ->select('location_name')->get();

        $cctvLists = DB::connection('mis')->table('cctv_lists')
            ->where('status', '1')
            ->get();

        $result = $this->datatable->handle(
            $request,
            'checklist',
            'cctv_checklists',
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

                'searchColumns' => ['camera_name', 'control_no', 'location', 'due_date', 'performed_by'],
            ]
        );

        // FOR CSV EXPORTING
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }



        return Inertia::render('Cctv/CctvChecklist', [
            'tableData' => $result['data'],
            'area' => $area,
            'cctvLists' => $cctvLists,
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
        // Validate input
        $validated = $request->validate([
            'camera_name' => 'required|string|max:45',
            'control_no' => 'nullable|string|max:45',
            'ip_address' => 'required|string|max:45',
            'location' => 'required|string|max:45',
            'date_performed' => 'required|string|max:45',
            'due_date' => 'required|string|max:45',
            'performed_by' => 'required|string|max:45',
            'check_items' => 'required|string', // JSON string
            'remarks' => 'nullable|string|max:255',
            'recommendation' => 'nullable|string|max:255',
        ]);

        // Create new record
        $cctv = DB::connection('checklist')->table('cctv_checklists')->insert([
            'camera_name' => $validated['camera_name'],
            'control_no' => $validated['control_no'],
            'ip_address' => $validated['ip_address'],
            'location' => $validated['location'],
            'date_performed' => $validated['date_performed'],
            'due_date' => $validated['due_date'],
            'performed_by' => $validated['performed_by'],
            'check_items' => $validated['check_items'],
            'remarks' => $validated['remarks'] ?? '',
            'recommendation' => $validated['recommendation'] ?? '',
            'status' => 2,
        ]);

        // Return response
        return redirect()->back()->with('success', 'CCTV checklist saved successfully.');
    }

    public function update(Request $request, $id)
    {
        // ✅ VALIDATION
        $validated = $request->validate([
            'camera_name' => 'required|string|max:255',
            'ip_address' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'date_performed' => 'required|date',
            'due_date' => 'required|date',
            'performed_by' => 'required|string|max:255',
            'check_items' => 'required|string',
        ]);

        // ✅ FIND RECORD (QUERY BUILDER VERSION)
        $cctv = DB::connection('checklist')
            ->table('cctv_checklists')
            ->where('id', $id)
            ->first();

        if (!$cctv) {
            return back()->withErrors(['error' => 'Record not found']);
        }

        // 🚫 BLOCK EDIT IF VERIFIED
        if ($cctv->verified_by) {
            return back()->withErrors([
                'error' => 'This checklist is already verified and cannot be edited.'
            ]);
        }

        // ✅ OPTIONAL: EXTRACT REMARKS / RECOMMENDATION
        $decoded = json_decode($validated['check_items'], true);

        $remarks = collect($decoded)->pluck('remark')->implode('; ');
        $recommendations = collect($decoded)->pluck('recommendation')->implode('; ');

        // ✅ UPDATE (QUERY BUILDER WAY)
        DB::connection('checklist')
            ->table('cctv_checklists')
            ->where('id', $id)
            ->update([
                'camera_name'   => $validated['camera_name'],
                'ip_address'    => $validated['ip_address'],
                'location'      => $validated['location'],
                'date_performed' => $validated['date_performed'],
                'due_date'      => $validated['due_date'],
                'performed_by'  => $validated['performed_by'],
                'check_items'   => $validated['check_items'],
                'remarks'       => $remarks,
                'recommendation' => $recommendations,
                'updated_by'    => session('emp_data.emp_name'),
            ]);

        return back()->with('success', 'Checklist updated successfully!');
    }

    public function verifyings(Request $request, $id)
    {
        DB::connection('checklist')->table('cctv_checklists')
            ->where('id', $id)
            ->update([
                'verified_by' => session('emp_data.emp_name'),
                'date_verified' => date('Y-m-d H:i:s'),
                'status' => 1,
            ]);

        return redirect()->back()
            ->with('success', 'CCTVChecklist verified successfully.');
    }



    public function viewPdf($id)
    {
        $report = DB::connection('checklist')
            ->table('cctv_checklists')
            ->where('id', $id)
            ->first();

        if (!$report) {
            abort(404, 'Report not found');
        }

        $checkItems = json_decode($report->check_items, true);

        $pdf = Pdf::loadView('reports.cctv-pdf', [
            'report' => $report,
            'checkItems' => $checkItems
        ])->setPaper('A4', 'portrait');

        return $pdf->stream('cctv-preventive-maintenance.pdf');
    }
}
