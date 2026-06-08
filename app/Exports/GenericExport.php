<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class GenericExport implements FromCollection, WithHeadings
{
    protected Collection $rows;

    public function __construct($data)
    {
        $this->rows = collect($data);
    }

    public function collection(): Collection
    {
        return $this->rows;
    }

    public function headings(): array
    {
        if ($this->rows->isEmpty()) {
            return [];
        }

        return array_keys(
            $this->rows->first()
        );
    }
}
