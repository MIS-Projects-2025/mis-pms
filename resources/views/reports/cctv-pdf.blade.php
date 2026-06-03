<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>CCTV Preventive Maintenance</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
        }

        h1 {
            color: #c2410c;
            margin-bottom: 0;
        }

        h2 {
            margin-top: 4px;
            font-weight: normal;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        th,
        td {
            border: 1px solid #999;
            padding: 6px;
            vertical-align: top;
        }

        th {
            background-color: #f3f4f6;
            text-align: center;
        }

        .header-grid {
            width: 100%;
            margin-bottom: 15px;
        }

        .header-grid td {
            border: none;
            padding: 4px 0;
        }

        .label {
            font-weight: bold;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            border: none;
            /* remove table border */
        }

        .footer-table td,
        .footer-table th {
            padding: 2px 4px;
            border: none;
            /* remove cell borders */
        }
    </style>
</head>

<body>

    {{-- TITLE --}}
    <div style="text-align:center;">
        <h1>CCTV</h1>
        <h2>Preventative Maintenance Checklist</h2>
    </div>

    {{-- HEADER INFO --}}
    <table class="header-grid border border-collapse w-100">
        <tr>
            <td>
                <span class="label">Machine No:</span>
                {{ $report->camera_name ?? '' }}
            </td>
            <td>
                <span class="label">Location:</span>
                {{ $report->location ?? '' }}
            </td>
            <td>
                <span class="label">IP Address:</span>
                {{ $report->ip_address ?? '' }}
            </td>
        </tr>

        <tr>
            <td>
                <span class="label">Done By:</span>
                {{ $report->performed_by ?? '' }}
            </td>

            <td>
                <span class="label">Performed Date:</span>
                {{ $report->date_performed 
                ? \Carbon\Carbon::parse($report->date_performed)->format('m/d/Y') 
                : '' }}
            </td>

            <td>
                <span class="label">Date Due:</span>
                {{ $report->due_date 
                ? \Carbon\Carbon::parse($report->due_date)->format('m/d/Y') 
                : '' }}
            </td>
        </tr>

        <tr>
            <td colspan="3">
                <span class="label">Verified By:</span>
                {{ $report->verified_by ?? 'Pending' }}

                @if($report->date_verified)
                <br>
                {{ \Carbon\Carbon::parse($report->date_verified)->format('m/d/Y g:i A') }}
                @endif
            </td>
        </tr>
    </table>


    {{-- TABLE --}}
    <table>
        <thead>
            <tr>
                <th width="5%">#</th>
                <th width="35%">Checklist Item</th>
                <th width="30%">Remarks</th>
                <th width="30%">Recommendation</th>
            </tr>
        </thead>
        <tbody>
            @foreach($checkItems as $index => $item)
            <tr>
                <td align="center">{{ $index + 1 }}</td>
                <td>{{ $item['item'] }}</td>
                <td>{{ $item['remark'] }}</td>
                <td>{{ $item['recommendation'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    {{-- Footer --}}
    <table class="footer-table">
        <tr>
            <td style="text-align: left; color: #b91c1c; font-weight: bold;">TELFORD SVC PHILS., INC.</td>
            <td style="text-align: right;">MIS-06 (Rev.1)</td>
        </tr>
    </table>

</body>

</html>