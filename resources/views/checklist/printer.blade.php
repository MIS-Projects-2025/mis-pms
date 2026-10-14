<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Printer Checklist</title>
    <style>
        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 12px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
        }

        table,
        th,
        td {
            border: 1px solid black;
            padding: 4px;
        }

        th {
            background-color: #f0f0f0;
        }

        .checkbox {
            text-align: center;
            width: 20px;
        }

        h2 {
            text-align: center;
            color: #b91c1c;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }

        .footer-table tr td {
            border: none;
            /* important: remove borders from td */
        }
    </style>
</head>

<body>

    <h2>BARCODE PRINTER PREVENTIVE MAINTENANCE CHECKLIST</h2>

    <table>
        <tr>
            <td><strong>Printer Name:</strong> {{ $checklist->printer_name }}</td>
            <td><strong>Serial Number:</strong> {{ $checklist->serial_num }}</td>
        </tr>
        <tr>
            <td><strong>Location:</strong> {{ $checklist->location }}</td>
            <td><strong>Done By:</strong> {{ $checklist->performed_by }}</td>
        </tr>
        <tr>
            <td><strong>Date Done:</strong> {{ $checklist->pm_date ? \Carbon\Carbon::parse($checklist->pm_date)->format('m/d/Y') : '-' }}</td>
            <td><strong>Date Due:</strong> {{ $checklist->next_pm ? \Carbon\Carbon::parse($checklist->next_pm)->format('m/d/Y') : '-' }}</td>
        </tr>
        <tr>
            <td><strong>Verified By:</strong> {{ $checklist->verified_by }}</td>.
            <td><strong>Date Verified:</strong> {{ $checklist->date_verified ? \Carbon\Carbon::parse($checklist->date_verified)->format('m/d/Y g:i A') : '-' }}</td>
        </tr>
    </table>

    {{-- SECTION 1: First 4 checkboxes --}}
    @php $section1 = $checklist->items->slice(0, 4); @endphp
    @if($section1->isNotEmpty())
    <table>
        @foreach($section1 as $item)
        <tr>
            <td class="checkbox">{{ $item->checkitem == 1 ? '✔' : '' }}</td>
            <td>{{ $item->item }}</td>
        </tr>
        @endforeach
    </table>
    @endif

    {{-- SECTION 2: Parts 5–12 --}}
    @php $section2 = $checklist->items->slice(4, 8); @endphp
    @if($section2->isNotEmpty())
    <table>
        <thead>
            <tr>
                <th>Parts</th>
                <th>Action</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($section2 as $item)
            <tr>
                <td>{{ $item->item }}</td>
                <td>{{ $item->action ?? '' }}</td>
                <td>{{ $item->remarks ?? '' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    {{-- SECTION 3: item 13 --}}
    @php $section3 = $checklist->items->slice(12, 1)->first(); @endphp
    @if($section3)
    <table>
        <tr>
            <td class="checkbox">{{ $section3->checkitem == 1 ? '✔' : '' }}</td>
            <td>{{ $section3->item }}</td>
        </tr>
    </table>
    @endif

    {{-- SECTION 4: Quality / Settings 14–end --}}
    @php $section4 = $checklist->items->slice(13); @endphp
    @if($section4->isNotEmpty())
    <table>
        <thead>
            <tr>
                <th>Parts</th>
                <th>Quality / Settings</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($section4 as $item)
            <tr>
                <td>{{ $item->item }}</td>
                <td>{{ $item->action ?? 'OK' }}</td>
                <td>{{ $item->remarks ?? '' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <p><strong>Technical Report / Recommendation:</strong></p>
    <p>{{ $checklist->recommendations }}</p>

    <hr>
    {{-- Footer --}}
    <table class="footer-table">
        <tr>
            <td style="text-align: left; color: #b91c1c; font-weight: bold;">TELFORD SVC PHILS., INC.</td>
            <td style="text-align: right;">MAINT-51 (Rev.4)</td>
        </tr>
    </table>
</body>

</html>