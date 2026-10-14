<?php

namespace App\Http\Controllers\Computer;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class ComputerChecklistController extends Controller
{
    protected $datatable;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }

    /**
     * Mga computer na naka-lock pa (hindi pa pwede mag-checklist uli).
     * Lalabas ulit ang computer 3 months bago ang date_due ng pinakahuling checklist niya.
     * Halimbawa: date_due = 2026-12-31 -> lalabas simula 2026-09-30.
     */
    private function lockedComputers(): array
    {
        return DB::connection('checklist')
            ->table('computer_checklists')
            ->whereIn('id', function ($sub) {
                $sub->selectRaw('MAX(id)')
                    ->from('computer_checklists')
                    ->groupBy('computer_name');
            })
            ->whereRaw('DATE_SUB(date_due, INTERVAL 3 MONTH) > ?', [Carbon::today()->toDateString()])
            ->pluck('computer_name')
            ->toArray();
    }

    public function index(Request $request)
    {
        $computerChecklists = DB::connection('checklist')
            ->table('computers_checklist_items')
            ->get();

        $existingChecklist = $this->lockedComputers();

        $computerName = DB::connection('mis')
            ->table('hardware')
            ->where('status', '1')
            ->whereNotIn('hostname', $existingChecklist)
            ->orderBy('hostname', 'asc')
            ->get();

        $result = $this->datatable->handle(
            $request,
            'checklist',
            'computer_checklists',
            [
                'conditions' => function ($query) use ($request) {
                    if ($request->filled('status')) {
                        $query->where('status', $request->status);
                    }

                    if ($request->filled('start') && $request->filled('end')) {
                        $query->whereBetween('date_created', [
                            $request->start,
                            $request->end
                        ]);
                    }

                    return $query
                        ->orderBy('date_checked', 'DESC')
                        ->orderByRaw('verified_by IS NULL DESC');
                },

                'searchColumns' => ['computer_name', 'date_checked', 'performed_by', 'recommendations'],
                'status',

                'filename' => 'computer_checklist_export_' . now()->format('Ymd_His'),
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
        $validated = $request->validate([
            'computer_name'       => 'required|string|max:255',
            'date_checked'        => 'required|date',
            'date_due'            => 'required|date',
            'items'               => 'required|array|min:1',
            'items.*.task'        => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.status'      => 'required|string|in:ok,repair,na',
            'recommendations'     => 'nullable|string',
        ]);

        $computerName = $validated['computer_name'];

        // Lock para hindi magsabay ang dalawang submit para sa parehong computer
        $lock = Cache::lock('computer_checklist_store_' . md5($computerName), 10);

        if (!$lock->get()) {
            return back()->withErrors([
                'computer_name' => 'May ibang nag-su-submit para sa computer na ito. Subukan ulit.',
            ]);
        }

        try {
            if (in_array($computerName, $this->lockedComputers(), true)) {
                return back()->withErrors([
                    'computer_name' => "May active na checklist na ang {$computerName}. Hindi pa ito due para sa susunod na PM.",
                ]);
            }

            DB::connection('checklist')->table('computer_checklists')->insert([
                'computer_name'   => $computerName,
                'date_checked'    => $validated['date_checked'],
                'date_due'        => $validated['date_due'],
                'performed_by'    => session('emp_data.emp_name'),
                'items'           => json_encode($validated['items']),
                'recommendations' => $validated['recommendations'] ?? null,
                'status'          => 2,
            ]);
        } finally {
            $lock->release();
        }

        return redirect()->route('computer-checklist')
            ->with('success', 'Checklist saved successfully.');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'computer_name'       => 'required|string|max:255',
            'date_checked'        => 'required|date',
            'date_due'            => 'required|date',
            'performed_by'        => 'required|string|max:255',
            'items'               => 'required|array',
            'items.*.task'        => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.status'      => 'nullable|string|in:ok,repair,na',
            'recommendations'     => 'nullable|string',
        ]);

        $checklist = DB::connection('checklist')
            ->table('computer_checklists')
            ->where('id', $id)
            ->first();

        if (!$checklist) {
            return redirect()->back()->with('error', 'Checklist not found.');
        }

        // Bawal lumipat sa computer na may active na checklist
        if (
            $validated['computer_name'] !== $checklist->computer_name
            && in_array($validated['computer_name'], $this->lockedComputers(), true)
        ) {
            return back()->withErrors([
                'computer_name' => "May active na checklist na ang {$validated['computer_name']}.",
            ]);
        }

        DB::connection('checklist')
            ->table('computer_checklists')
            ->where('id', $id)
            ->update([
                'computer_name'   => $validated['computer_name'],
                'date_checked'    => $validated['date_checked'],
                'date_due'        => $validated['date_due'],
                'performed_by'    => $validated['performed_by'],
                'items'           => json_encode($validated['items']),
                'recommendations' => $validated['recommendations'] ?? null,
                'updated_by'      => session('emp_data.emp_name') ?? null,
            ]);

        return redirect()->route('computer-checklist')
            ->with('success', 'Checklist updated successfully.');
    }

    public function verifyings(Request $request, $id)
    {
        DB::connection('checklist')
            ->table('computer_checklists')
            ->where('id', $id)
            ->update([
                'verified_by'   => session('emp_data.emp_name'),
                'date_verified' => date('Y-m-d H:i:s'),
                'status'        => 1,
            ]);

        return redirect()->route('computer-checklist')
            ->with('success', 'Checklist verified successfully.');
    }

    public function destroy($id)
    {
        DB::connection('checklist')
            ->table('computer_checklists')
            ->where('id', $id)
            ->delete();

        return redirect()->route('computer-checklist')
            ->with('success', 'Checklist removed successfully.');
    }

    public function pdf($id)
    {
        $checklist = DB::connection('checklist')
            ->table('computer_checklists')
            ->where('id', $id)
            ->first();

        if (!$checklist) {
            abort(404);
        }

        $checklist->items = $checklist->items ? json_decode($checklist->items, true) : [];

        $pdf = Pdf::loadView('checklist.computer', compact('checklist'))
            ->setPaper('a4', 'portrait')
            ->setOptions(['defaultFont' => 'DejaVu Sans']);

        return $pdf->stream("checklist_$id.pdf");
    }
}
