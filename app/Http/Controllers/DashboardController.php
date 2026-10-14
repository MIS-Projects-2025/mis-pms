<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    /**
     * PM sources.
     *  name       = column ng pangalan ng item (null kung iisa lang ang item, gamitin ang fixed_name)
     *  due        = column ng due date
     *  lead       = kailan magiging "available": bilang ng months bago due,
     *               o 'month' = simula ng buwan ng due date
     *  inventory  = i-check sa MIS inventory (computer/printer) kung active pa
     */
    private array $pmSources = [
        'computer' => [
            'table'     => 'computer_checklists',
            'name'      => 'computer_name',
            'due'       => 'date_due',
            'lead'      => 3,
            'inventory' => 'computer',
        ],
        'printer' => [
            'table'     => 'printer_checklists',
            'name'      => 'printer_name',
            'due'       => 'next_pm',
            'lead'      => 'month',
            'inventory' => 'printer',
        ],
        'cctv' => [
            'table'     => 'cctv_checklists',
            'name'      => 'camera_name',
            'due'       => 'due_date',
            'lead'      => 3,
            'inventory' => null,
        ],
        'ladder' => [
            'table'      => 'ladder_checklist',
            'name'       => null,
            'fixed_name' => 'Ladder Inspection',
            'due'        => 'next_check',
            'lead'       => 3,
            'inventory'  => null,
        ],
    ];

    private function perDay(string $table)
    {
        return DB::connection('checklist')
            ->table($table)
            ->selectRaw('DATE(date_created) as date, COUNT(*) as total')
            ->groupBy(DB::raw('DATE(date_created)'))
            ->pluck('total', 'date')
            ->map(fn ($v) => (int) $v);
    }

    private function norm($name): string
    {
        return mb_strtolower(trim(preg_replace('/\s+/', ' ', (string) $name)));
    }

    /**
     * Active items sa MIS inventory. Null = walang inventory check.
     * Return: [normalized_name => display_name]
     */
    private function inventoryNames(?string $kind): ?array
    {
        if ($kind === null) {
            return null;
        }

        if ($kind === 'computer') {
            $names = DB::connection('mis')
                ->table('hardware')
                ->where('status', '1')
                ->pluck('hostname');
        } elseif ($kind === 'printer') {
            $names = DB::connection('mis')
                ->table('printer')
                ->where('printer_name', '!=', 'N/A')
                ->where('status', '1')
                ->where('printer_category', 'Bardcode Printer')
                ->pluck('printer_name');
        } else {
            return null;
        }

        $map = [];
        foreach ($names as $n) {
            if (trim((string) $n) === '') {
                continue;
            }
            $map[$this->norm($n)] = trim($n);
        }

        return $map;
    }

    /**
     * Pinakahuling checklist per item, tapos i-classify:
     *  overdue   = lampas na ang due date
     *  available = due today o pasok na sa "lead" window
     *  upcoming  = malayo pa
     */
    private function pmItems(Carbon $today): array
    {
        $items = [];

        foreach ($this->pmSources as $type => $cfg) {
            try {
                $table   = $cfg['table'];
                $nameCol = $cfg['name'];
                $dueCol  = $cfg['due'];

                $query = DB::connection('checklist')->table($table);

                if ($nameCol) {
                    $query->whereIn('id', function ($sub) use ($table, $nameCol) {
                        $sub->selectRaw('MAX(id)')
                            ->from($table)
                            ->groupBy($nameCol);
                    })->select('id', "$nameCol as name", "$dueCol as due");
                } else {
                    // Iisang item lang: kunin ang pinakahuling record
                    $query->orderByDesc('id')
                        ->limit(1)
                        ->selectRaw("id, ? as name, $dueCol as due", [$cfg['fixed_name']]);
                }

                // Kasama dito ang may blank/invalid due; i-skip sila sa classify, hindi sa "recorded"
                $rows = $query->get();

                // Isang record per normalized name (pinakamataas na id ang panalo)
                $latest = [];
                foreach ($rows as $row) {
                    $key = $this->norm($row->name);
                    if (!isset($latest[$key]) || $row->id > $latest[$key]->id) {
                        $latest[$key] = $row;
                    }
                }

                // Inventory check
                $inventory = $this->inventoryNames($cfg['inventory']);

                foreach ($latest as $key => $row) {
                    if ($inventory !== null && !isset($inventory[$key])) {
                        continue; // wala na / hindi active sa inventory
                    }

                    if ($row->due === null || trim($row->due) === '') {
                        continue;
                    }

                    try {
                        $due = Carbon::parse($row->due)->startOfDay();
                    } catch (\Throwable $e) {
                        Log::warning("Dashboard PM [$type] invalid due date '{$row->due}' for {$row->name}");
                        continue;
                    }

                    $availableFrom = $cfg['lead'] === 'month'
                        ? $due->copy()->startOfMonth()
                        : $due->copy()->subMonthsNoOverflow((int) $cfg['lead']);

                    if ($today->gt($due)) {
                        $status = 'overdue';
                        $days   = (int) $due->diffInDays($today);
                    } elseif ($today->gte($availableFrom)) {
                        $status = 'available';
                        $days   = (int) $today->diffInDays($due);
                    } else {
                        $status = 'upcoming';
                        $days   = (int) $today->diffInDays($due);
                    }

                    $items[] = [
                        'type'           => $type,
                        'name'           => $inventory[$key] ?? trim($row->name),
                        'due'            => $due->toDateString(),
                        'available_from' => $availableFrom->toDateString(),
                        'status'         => $status,
                        'days'           => $days,
                    ];
                }

                // Active sa inventory pero wala pang kahit anong checklist = available agad
                if ($inventory !== null) {
                    foreach ($inventory as $key => $displayName) {
                        if (isset($latest[$key])) {
                            continue;
                        }

                        $items[] = [
                            'type'           => $type,
                            'name'           => $displayName,
                            'due'            => null,
                            'available_from' => null,
                            'status'         => 'available',
                            'days'           => null,
                        ];
                    }
                }
            } catch (\Throwable $e) {
                // Huwag mag-crash ang dashboard kung may mali sa isang source
                Log::warning("Dashboard PM source [$type] failed: " . $e->getMessage());
            }
        }

        usort($items, function ($a, $b) {
            return strcmp($a['due'] ?? '0000-00-00', $b['due'] ?? '0000-00-00');
        });

        return $items;
    }

    public function index(Request $request)
    {
        $today = Carbon::today();

        // Trend (group by date_created)
        $computerPerDay = $this->perDay('computer_checklists');
        $printerPerDay  = $this->perDay('printer_checklists');
        $boxingPerDay   = $this->perDay('boxing_printer_checklists');
        $repairPerDay   = $this->perDay('computer_repair_tbl');
        $cctvPerDay     = $this->perDay('cctv_checklists');

        $allDates = collect()
            ->merge($computerPerDay->keys())
            ->merge($printerPerDay->keys())
            ->merge($boxingPerDay->keys())
            ->merge($repairPerDay->keys())
            ->merge($cctvPerDay->keys())
            ->unique()
            ->sort()
            ->values();

        return inertia('Dashboard', [
            'today'          => $today->toDateString(),
            'chartDates'     => $allDates,
            'computerPerDay' => $computerPerDay,
            'printerPerDay'  => $printerPerDay,
            'boxingPerDay'   => $boxingPerDay,
            'repairPerDay'   => $repairPerDay,
            'cctvPerDay'     => $cctvPerDay,
            'pmItems'        => $this->pmItems($today),
        ]);
    }
}
