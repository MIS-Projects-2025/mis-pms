<?php

namespace App\Http\Controllers\Computer;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ComputerChecklistItemController extends Controller
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
            'computers_checklist_items',
            [
                // 'conditions' => function ($query) {
                //     return $query
                //         ->whereIn('emp_role', ['admin']);
                // },

                'searchColumns' => ['task', 'description', 'created_by', 'updated_by'],
            ]
        );

        // FOR CSV EXPORTING
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('Computer/ComputerChecklistItem', [
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
                'task'        => $item['task'],
                'description' => $item['description'],
                'created_by'  => session('emp_data')['emp_name'] ?? null,
            ];
        }

        // Insert all at once
        DB::connection('checklist')
            ->table('computers_checklist_items')
            ->insert($items);

        return back()->with('success', 'Items added successfully!');
    }

    public function update(Request $request, $id)
    {
        $updatedBy = session('emp_data')['emp_name'] ?? null;

        // Validate form data
        $validated = $request->validate([
            'task' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        // Add updated_by field
        $validated['updated_by'] = $updatedBy;

        // Update record sa MySQL
        DB::connection('checklist')
            ->table('computers_checklist_items')
            ->where('id', $id)
            ->update($validated);

        return redirect()->back()->with('success', 'Checklist item updated successfully.');
    }





    public function destroy($id)
    {
        DB::connection('checklist')->table('computers_checklist_items')->where('id', $id)->delete();

        return redirect()->route('computer-checklist-items')->with('success', 'Checklist item removed successfully.');
    }
}
