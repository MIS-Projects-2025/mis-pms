<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class HardwareReportController extends Controller
{
    protected $datatable;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }

    public function index(Request $request)
    {
        $computerName = DB::connection('mis')
            ->table('hardware')
            ->where('hardware.status', 1)

            // Hardware Parts Subquery (return arrays, not concatenated strings)
            ->leftJoin(
                DB::raw("(SELECT 
                hardware_id,
                JSON_ARRAYAGG(CASE WHEN part_type='RAM' THEN CONCAT(brand, ' ', specifications) END) AS ram_details,
                JSON_ARRAYAGG(CASE WHEN part_type='STORAGE' THEN CONCAT(brand, ' ', specifications) END) AS hdd_details,
                JSON_ARRAYAGG(CASE WHEN part_type='Monitor' THEN CONCAT(brand, ' ', specifications) END) AS monitor_details,
                JSON_ARRAYAGG(CASE WHEN part_type='PSU' THEN CONCAT(brand, ' ', specifications) END) AS psu_details,
                JSON_ARRAYAGG(CASE WHEN part_type='Casing' THEN CONCAT(brand, ' ', specifications) END) AS casing_details,
                JSON_ARRAYAGG(CASE WHEN part_type='Keyboard' THEN CONCAT(brand, ' ', specifications) END) AS keyboard_details,
                JSON_ARRAYAGG(CASE WHEN part_type='Mouse' THEN CONCAT(brand, ' ', specifications) END) AS mouse_details,
                JSON_ARRAYAGG(CASE WHEN part_type='Battery' THEN CONCAT(brand, ' ', specifications) END) AS battery_details
            FROM hardware_parts
            GROUP BY hardware_id
    ) AS hp"),
                'hardware.hostname',
                '=',
                'hp.hardware_id'
            )


            // Software Subquery (same array output)
            ->leftJoin(
                DB::raw("(SELECT 
                    hardware_id,
                    JSON_ARRAYAGG(CASE WHEN s.type='Operating System' THEN s.name END) AS os_details,
                    JSON_ARRAYAGG(CASE WHEN s.type='Antivirus' THEN s.name END) AS antivirus_details,
                    JSON_ARRAYAGG(CASE WHEN s.type='Productivity Suite' THEN s.name END) AS office_details
                FROM hardware_software hs
                JOIN software_inventory s ON hs.software_id = s.id
                GROUP BY hardware_id
        ) AS sw"),
                'hardware.id',
                '=',
                'sw.hardware_id'
            )

            ->select('hardware.*', 'hp.*', 'sw.*')
            ->orderBy('hardware.hostname', 'asc')
            ->get()
            ->map(function ($item) {

                // convert JSON strings → actual PHP arrays
                foreach ($item as $key => $value) {
                    if (is_string($value) && (str_starts_with($value, '[') || str_starts_with($value, '{'))) {
                        $item->$key = json_decode($value, true);
                    }
                }

                return $item;
            });


        $result = $this->datatable->handle(
            $request,
            'checklist',
            'hardware_reports',
            [
                'searchColumns' => ['computer_name', 'location', 'purpose'],
            ]
        );

        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('Reports/HardwareReports', [
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
}
