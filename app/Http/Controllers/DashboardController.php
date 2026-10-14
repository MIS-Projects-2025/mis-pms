<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
       

        // Group by date_created (DATE only)
        $computerPerDay = DB::connection('checklist')
            ->table('computer_checklists')
            ->selectRaw('DATE(date_created) as date, COUNT(*) as total')
            ->groupBy(DB::raw('DATE(date_created)'))
            ->pluck('total', 'date');

        $printerPerDay = DB::connection('checklist')
            ->table('printer_checklists')
            ->selectRaw('DATE(date_created) as date, COUNT(*) as total')
            ->groupBy(DB::raw('DATE(date_created)'))
            ->pluck('total', 'date');

        $boxingPerDay = DB::connection('checklist')
            ->table('boxing_printer_checklists')
            ->selectRaw('DATE(date_created) as date, COUNT(*) as total')
            ->groupBy(DB::raw('DATE(date_created)'))
            ->pluck('total', 'date');

        $repairPerDay = DB::connection('checklist')
            ->table('computer_repair_tbl')
            ->selectRaw('DATE(date_created) as date, COUNT(*) as total')
            ->groupBy(DB::raw('DATE(date_created)'))
            ->pluck('total', 'date');

        $cctvPerDay = DB::connection('checklist')
            ->table('cctv_checklists')
            ->selectRaw('DATE(date_created) as date, COUNT(*) as total')
            ->groupBy(DB::raw('DATE(date_created)'))
            ->pluck('total', 'date');

        // Kunin lahat ng unique dates
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
            'chartDates' => $allDates,
            'computerPerDay' => $computerPerDay,
            'printerPerDay' => $printerPerDay,
            'boxingPerDay' => $boxingPerDay,
            'repairPerDay' => $repairPerDay,
            'cctvPerDay' => $cctvPerDay,
        ]);
    }
}
