<?php

namespace App\Http\Controllers\Ladder;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LadderChecklistItemController extends Controller
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
            'ladder_checklist_items',
            [
                // 'conditions' => function ($query) {
                //     return $query
                //         ->OrderBy('id', 'ASC');
                // },

                'searchColumns' => ['checklist_item', 'checklist_criteria'],
            ]
        );

        // FOR CSV EXPORTING
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('Ladder/LadderChecklistItem', [
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

    public function store(Request $request)
    {
        $request->validate([
            'ladder_type' => 'required|string|max:255',
            'checklist_items' => 'required|array|min:1',
            'checklist_items.*.name' => 'required|string|max:255',
            'checklist_criteria' => 'required|array|min:1',
            'checklist_criteria.*.name' => 'required|string|max:255',
        ]);

        try {

            $ladderType = trim($request->ladder_type);

            // normalize JSON (para consistent comparison)
            $itemsJson = json_encode($request->checklist_items);
            $criteriaJson = json_encode($request->checklist_criteria);

            // 🔥 CHECK DUPLICATE (FULL MATCH)
            $exists = DB::connection('checklist')
                ->table('ladder_checklist_items')
                ->where('ladder_type', $ladderType)
                ->where('checklist_items', $itemsJson)
                ->where('checklist_criteria', $criteriaJson)
                ->exists();

            if ($exists) {
                return back()->withErrors([
                    'error' => 'Duplicate Ladder Checklist already exists!'
                ]);
            }

            DB::beginTransaction();

            DB::connection('checklist')->table('ladder_checklist_items')->insert([
                'ladder_type' => $ladderType,
                'checklist_items' => $itemsJson,
                'checklist_criteria' => $criteriaJson,
                'created_by' => session('emp_data')['emp_id'] ?? null,
            ]);

            DB::commit();

            return redirect()
                ->route('ladder_checklist_items.index')
                ->with('success', 'Ladder Checklist created successfully!');
        } catch (\Exception $e) {

            DB::rollBack();

            return back()->withErrors([
                'error' => $e->getMessage()
            ]);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'ladder_type' => 'required|string|max:255',
            'checklist_items' => 'required|array|min:1',
            'checklist_criteria' => 'required|array|min:1',
        ]);

        try {

            DB::beginTransaction();

            DB::connection('checklist')
                ->table('ladder_checklist_items')
                ->where('id', $id)
                ->update([
                    'ladder_type' => $request->ladder_type,
                    'checklist_items' => json_encode($request->checklist_items),
                    'checklist_criteria' => json_encode($request->checklist_criteria),
                ]);

            DB::commit();

            return redirect()->back()->with('success', 'Updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'error' => $e->getMessage()
            ]);
        }
    }

    public function destroy($id)
    {
        try {

            DB::connection('checklist')
                ->table('ladder_checklist_items')
                ->where('id', $id)
                ->delete();

            return back()->with('success', 'Deleted successfully');
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => $e->getMessage()
            ]);
        }
    }
}
