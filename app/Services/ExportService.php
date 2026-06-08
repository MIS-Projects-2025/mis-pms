<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ExportService
{
    public function fetch(string $table, Carbon $from, Carbon $to)
{
    $config = config("export_tables.$table");

    if (!$config) {
        throw new \Exception("Invalid table selected");
    }

    $dateColumn = $config['date_column'] ?? 'created_at';

    return DB::table($table)
        ->whereBetween($dateColumn, [
            $from->startOfDay(),
            $to->endOfDay()
        ])
        ->orderBy($dateColumn, 'desc')
        ->get();
}

    public function getLabel(string $table)
    {
        return config("export_tables.$table.label", $table);
    }
}
