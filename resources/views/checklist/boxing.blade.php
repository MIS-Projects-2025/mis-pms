<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Checklist PDF</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 10px;
        }

        table,
        th,
        td {
            border: 1px solid #333;
        }

        th,
        td {
            padding: 5px;
            text-align: center;
        }

        th {
            background-color: #f0f0f0;
        }

        .header {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
            color: #b91c1c;
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

    <div class="header">BOXING PRINTER STARTUP CHECKLIST</div>

    <table>
        <tr>
            <th><strong>Done By:</strong></th>
            <th><strong>Date:</strong></th>
            <th><strong>Acknowledged By:</strong></th>
            <th><strong>Approved By:</strong></th>
        </tr>
        <tr>
            <td>{{ $checklist->performed_by }}</td>
            <td>{{ $checklist->date_performed }}</td>
            <td>{{ $checklist->acknowledged_by ?? 'Waiting for acknowledgement' }}</td>
            <td>{{ $checklist->verified_by ?? 'Waiting for approval' }}</td>
        </tr>
    </table>


    <table>
        <thead>
            <tr>
                <th>STATION NAME</th>
                <th>CHECK (Internal parts)</th>
                <th>REPLACE RIBBON / P2 LABEL</th>
                <th>RESTART / CALIBRATE</th>
                <th>REMARKS</th>
            </tr>
        </thead>
        <tbody>
            @foreach($checklist->items as $item)
            <tr>
                <td>{{ $item->station_name ?? '' }}</td>
                <td>{{ $item->check_internal ?? '' ? '✔' : '' }}</td>
                <td>{{ $item->replace_ribbon ?? '' ? '✔' : '' }}</td>
                <td>{{ $item->restart_calib ?? '' ? '✔' : '' }}</td>
                <td>{{ $item->remarks ?? '' }}</td>

            </tr>
            @endforeach
        </tbody>
    </table>
    {{-- Footer --}}
    <table class="footer-table">
        <tr>
            <td style="text-align: left; color: #b91c1c; font-weight: bold;">TELFORD SVC PHILS., INC.</td>
            <td style="text-align: right;">MAINT-71 (REV1)</td>
        </tr>
    </table>


</body>

</html>