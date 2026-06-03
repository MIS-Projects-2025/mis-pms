<?php

namespace App\Http\Controllers\Ladder;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class LadderChecklistController extends Controller
{
    protected $datatable;
    protected $datatable1;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }


    public function index(Request $request)
    {
        $ladderChecklistItems = DB::connection('checklist')
            ->table('ladder_checklist_items')
            ->get();

        $result = $this->datatable->handle(
            $request,
            'checklist',
            'ladder_checklist',
            [
                'conditions' => function ($query) {
                    return $query
                        ->OrderBy('id', 'desc');
                },

                'searchColumns' => ['done_check', 'next_check'],
            ]
        );

        // FOR CSV EXPORTING
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('Ladder/LadderChecklist', [
            'tableData' => $result['data'],
            'ladderChecklistItems' => $ladderChecklistItems,
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
        $validated = $request->validate([
            'date' => 'required|date',
            'sections' => 'required|array',
            'remarks' => 'nullable|string',

            'first_inspected_by' => 'required|string',
        ]);

        DB::connection('checklist')->table('ladder_checklist')->insert([

            // 🔥 FIRST CHECK
            'done_check' => $validated['date'],
            'sections' => json_encode($validated['sections']),
            'remarks' => $validated['remarks'] ?? null,

            'first_inspected_by' => $validated['first_inspected_by'],
            'first_verified_by' => null,

            // 🔥 SECOND CHECK (EMPTY)
            'next_check' => null,
            'second_inspected_by' => null,
            'second_verified_by' => null,
        ]);

        return redirect()->back()->with('success', 'Checklist saved successfully.');
    }

    public function verify(Request $request, $id)
    {
        $request->validate([
            'stage' => 'required|in:first,second',
        ]);

        $verifiedDate = Carbon::now();

        $verifiedBy = session('emp_data')['emp_name'] ?? null;

        if (!$verifiedBy) {
            return back()->with('error', 'No employee session found.');
        }

        $column = $request->stage === 'first'
            ? 'first_verified_by'
            : 'second_verified_by';

        $dateColumn = $request->stage === 'first'
            ? 'first_verified_date'
            : 'second_verified_date';

        DB::connection('checklist')
            ->table('ladder_checklist')
            ->where('id', $id)
            ->update([
                $column => $verifiedBy,
                $dateColumn => $verifiedDate,
            ]);

        return back()->with('success', 'Checklist verified successfully.');
    }

    public function nextCheck(Request $request, $id)
    {
        DB::connection('checklist')
            ->table('ladder_checklist')
            ->where('id', $id)
            ->update([
                'next_check' => $request->next_check,
                'second_inspected_by' => $request->second_inspected_by,
                'sections' => json_encode($request->sections)
            ]);

        return back()->with('success', 'Next check updated successfully.');
    }

    public function generatePDF($id)
    {

        $checklistItems = DB::connection('checklist')
            ->table('ladder_checklist_items')
            ->where('id', $id)
            ->get();

        $checklist = DB::connection('checklist')
            ->table('ladder_checklist')
            ->where('id', $id)
            ->first();

        $checklist->sections = json_decode($checklist->sections, true);

        $pdf = pdf::loadView('pdf.ladder_checklist', compact('checklist'));

        return $pdf->stream('ladder_checklist.pdf');
    }
}
