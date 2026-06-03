<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class ComputerRepairController extends Controller
{
    protected $datatable;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }

    public function index(Request $request)
    {

        $computerName = DB::connection('mis')
            ->table('hardware as h')
            ->where('h.status', 1) // make sure hardware table has 'status' column

            // Software Subquery
            ->leftJoin(DB::raw("
        (
            SELECT 
                hs.hardware_id,
                JSON_ARRAYAGG(
                    CASE WHEN s.software_type = 'Operating System' 
                    THEN s.version END
                ) AS os_details,
                JSON_ARRAYAGG(
                    CASE WHEN s.software_type = 'Productivity Suite' 
                    THEN s.software_name END
                ) AS office_details
            FROM hardware_software hs
            JOIN software_inventory s ON hs.software_inventory_id = s.id
            GROUP BY hs.hardware_id
        ) sw
    "), 'h.id', '=', 'sw.hardware_id')

            // Hardware User Subquery
            ->leftJoin(DB::raw("
        (
            SELECT 
                hardware_id,
                JSON_ARRAYAGG(user_id) AS issued_to
            FROM hardware_users
            GROUP BY hardware_id
        ) hu
    "), 'h.id', '=', 'hu.hardware_id')

            ->select(
                'h.*',
                'sw.os_details',
                'sw.office_details',
                'hu.issued_to'
            )
            ->orderBy('h.hostname')
            ->get()
            ->map(function ($item) {
                $item->os_details = json_decode($item->os_details ?? '[]', true);
                $item->office_details = json_decode($item->office_details ?? '[]', true);
                $item->issued_to = json_decode($item->issued_to ?? '[]', true);
                return $item;
            });



        $result = $this->datatable->handle(
            $request,
            'checklist',
            'computer_repair_tbl',
            [
                'searchColumns' => [
                    'tech_name',
                    'model',
                    'serial_number',
                    'operating_system',
                    'computer_type',
                    'computer_issues',
                    'issued_to',
                ],
            ]
        );

        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('Reports/ComputerRepair', [
            'tableData' => $result['data'],
            'computerName' => $computerName,
            'tableFilters' => $request->only([
                'search',
                'perPage',
                'sortBy',
                'sortDirection',
                'start',
                'end',
                'dropdownSearchValue',
                'dropdownFields',
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tech_id' => 'required',
            'tech_name' => 'required',
            'hardware_id' => 'required|integer',
            'hostname' => 'required',
            'serial_number' => 'required',
            'model' => 'required',
            'service_tag' => 'nullable',
            'computer_type' => 'nullable',
            'operating_system' => 'nullable',
            'issued_to' => 'nullable',

            'computer_issues' => 'array',
            'items_checked' => 'array',
            'summary_repairs' => 'array',

            'technician_notes' => 'nullable|string',
            'recommended_parts' => 'nullable|string',

            'attachments.*' => 'image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        // 🔹 HANDLE IMAGE UPLOADS
        $attachmentNames = [];

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {

                // unique filename
                $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();

                // save to public/storage/attachments
                $file->storeAs('attachments', $filename, 'public');

                // store filename only
                $attachmentNames[] = $filename;
            }
        }

        // 🔹 GENERATE REPORT NO
        $currentYear = Carbon::now()->format('Y');

        // Get the last report count for this year
        $lastReport = DB::connection('checklist')->table('computer_repair_tbl')
            ->where('report_no', 'like', "MISPM-{$currentYear}-%")
            ->orderBy('id', 'desc')
            ->first();

        if ($lastReport && preg_match('/1234567890/', $lastReport->report_no, $matches)) {
            $nextCount = intval($matches[1]) + 1;
        } else {
            $nextCount = 1;
        }

        // Random combination: 4 chars including letters, numbers, symbols
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $randomCombo = '';
        for ($i = 0; $i < 4; $i++) {
            $randomCombo .= $characters[rand(0, strlen($characters) - 1)];
        }

        $reportNo = "MISPM-{$currentYear}-{$randomCombo}-{$nextCount}";

        // 🔹 SAVE RECORD
        DB::connection('checklist')->table('computer_repair_tbl')->insert([
            'tech_id' => $data['tech_id'],
            'tech_name' => $data['tech_name'],
            'hardware_id' => $data['hardware_id'],
            'hostname' => $data['hostname'],
            'serial_number' => $data['serial_number'],
            'model' => $data['model'],
            'service_tag' => $data['service_tag'],
            'computer_type' => $data['computer_type'],
            'operating_system' => $data['operating_system'],
            'issued_to' => $data['issued_to'],

            'computer_issues' => json_encode($data['computer_issues'] ?? []),
            'items_checked' => json_encode($data['items_checked'] ?? []),
            'summary_repairs' => json_encode($data['summary_repairs'] ?? []),

            'technician_notes' => $data['technician_notes'],
            'recommended_parts' => $data['recommended_parts'],

            // 👇 filenames only
            'attachments' => json_encode($attachmentNames),

            'report_no' => $reportNo, // 👈 save generated report number
        ]);

        return redirect()->back()->with('success', 'Repair report saved.');
    }

    public function pdf($id)
    {
        $repair = DB::connection('checklist')
            ->table('computer_repair_tbl')
            ->where('id', $id)
            ->first();

        abort_if(!$repair, 404);

        $data = [
            'data' => $repair,
            'computer_issues' => json_decode($repair->computer_issues, true) ?? [],
            'items_checked' => json_decode($repair->items_checked, true) ?? [],
            'summary_repairs' => json_decode($repair->summary_repairs, true) ?? [],
            'attachments' => json_decode($repair->attachments, true) ?? [],
        ];

        $pdf = Pdf::loadView('computer_repairs.pdf', $data);

        // Downloadable
        return $pdf->stream('computer_repair_report_' . $repair->id . '.pdf');
    }
}
