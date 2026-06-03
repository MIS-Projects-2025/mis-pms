<?php

namespace App\Http\Controllers\Printer;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BoxingPrinterChecklistItemController extends Controller
{
    protected $datatable;
    protected $datatable1;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }


    public function index(Request $request)
    {
        $result = $this->datatable->handle(
            $request,
            'checklist',
            'boxing_printer_checklist_items',
            [
                // 'conditions' => function ($query) {
                //     return $query
                //         ->whereIn('emp_role', ['admin']);
                // },

                'searchColumns' => ['item', 'created_by', 'updated_by'],
            ]
        );

        // FOR CSV EXPORTING
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('Printer/BoxingPrinterChecklistItem', [
            'tableData' => $result['data'],
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

    public function bulkStore(Request $request)
    {
        $items = [];

        foreach ($request->items as $item) {
            $items[] = [
                'item'        => $item['item'],
                'created_by'  => session('emp_data')['emp_name'] ?? null,
            ];
        }

        // Insert all at once
        DB::connection('checklist')
            ->table('boxing_printer_checklist_items')
            ->insert($items);

        return back()->with('success', 'Items added successfully!');
    }

    public function update(Request $request, $id)
    {
        $updatedBy = session('emp_data')['emp_name'] ?? null;

        // Validate form data
        $validated = $request->validate([
            'item' => 'nullable|string',
        ]);

        // Add updated_by field
        $validated['updated_by'] = $updatedBy;

        // Update record sa checklist
        DB::connection('checklist')
            ->table('boxing_printer_checklist_items')
            ->where('id', $id)
            ->update($validated);

        return redirect()->back()->with('success', 'Checklist item updated successfully.');
    }





    public function destroy($id)
    {
        DB::connection('checklist')->table('boxing_printer_checklist_items')->where('id', $id)->delete();

        return redirect()->route('boxing-printer-checklist-items')->with('success', 'Checklist item removed successfully.');
    }
}
