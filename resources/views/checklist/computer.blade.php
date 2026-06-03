<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Preventive Maintenance Checklist</title>
    <style>
        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 12px;
            line-height: 1.3;
        }

        h2 {
            text-align: center;
            color: #b91c1c;
            margin-bottom: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        th,
        td {
            border: 1px solid #000;
            padding: 4px;
        }

        th {
            background-color: #f0f0f0;
            text-align: left;
        }

        td.text-center {
            text-align: center;
        }

        .header-grid {
            display: table;
            width: 100%;
            margin-bottom: 15px;
        }

        .header-row {
            display: table-row;
        }

        .header-cell {
            display: table-cell;
            width: 33%;
            padding: 4px;
        }

        textarea {
            width: 100%;
            border: 1px solid #000;
            min-height: 80px;
            padding: 4px;
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 12px;
            resize: none;
        }

        .footer {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }

        .footer-table td {
            border: none;
            /* important: remove borders from td */
        }
    </style>
</head>

<body>

    <h2>Preventive Maintenance Checklist for Desktop PCs and Laptops</h2>

    {{-- Header Info --}}
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
        <tr>
            <td style="padding: 5px; font-weight: bold;">Computer Name:</td>
            <td style="padding: 5px;">{{ $checklist->computer_name ?? '-' }}</td>

            <td style="padding: 5px; font-weight: bold;">Done By:</td>
            <td style="padding: 5px;">{{ $checklist->performed_by ?? '-' }}</td>

            <td style="padding: 5px; font-weight: bold;">Date Done:</td>
            <td style="padding: 5px;">{{ $checklist->date_created ? \Carbon\Carbon::parse($checklist->date_created)->format('m/d/Y g:i A') : '-' }}</td>
        </tr>

        <tr>
            <td style="padding: 5px; font-weight: bold;">Date Due:</td>
            <td style="padding: 5px;">{{ $checklist->date_due ? \Carbon\Carbon::parse($checklist->date_due)->format('m/d/Y') : '-' }}</td>

            <td style="padding: 5px; font-weight: bold;">Verified By:</td>
            <td style="padding: 5px;">{{ $checklist->verified_by ?? '-' }}</td>

            <td style="padding: 5px; font-weight: bold;">Date Verified:</td>
            <td style="padding: 5px;">{{ $checklist->date_verified ? \Carbon\Carbon::parse($checklist->date_verified)->format('m/d/Y g:i A') : '-' }}</td>
        </tr>
    </table>


    {{-- Checklist Table --}}
    <table>
        <thead>
            <tr>
                <th>Item#</th>
                <th>Task</th>
                <th>Description</th>
                <th class="text-center">OK</th>
                <th class="text-center">REPAIR</th>
                <th class="text-center">N/A</th>
            </tr>
        </thead>
        <tbody>
            @if(is_array($checklist->items) && count($checklist->items))
            @foreach($checklist->items as $index => $item)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $item['task'] ?? '' }}</td>
                <td>{!! nl2br(e($item['description'] ?? '')) !!}</td>
                <td class="text-center">{!! isset($item['status']) && $item['status'] === 'ok' ? '✔' : '' !!}</td>
                <td class="text-center">{!! isset($item['status']) && $item['status'] === 'repair' ? '✔' : '' !!}</td>
                <td class="text-center">{!! isset($item['status']) && $item['status'] === 'na' ? '✔' : '' !!}</td>
            </tr>
            @endforeach
            @else
            <tr>
                <td class="text-center" colspan="6">No checklist items available</td>
            </tr>
            @endif
        </tbody>
    </table>

    {{-- Recommendations --}}
    <div>
        <label><strong>Recommendations:</strong></label>
        <textarea readonly>{{ $checklist->recommendations ?? '' }}</textarea>
    </div>

    {{-- Footer --}}
    <table class="footer-table">
        <tr>
            <td style="text-align: left; color: #b91c1c; font-weight: bold;">TELFORD SVC PHILS., INC.</td>
            <td style="text-align: right;">MIS-03 (Rev.1)</td>
        </tr>
    </table>





</body>

</html>