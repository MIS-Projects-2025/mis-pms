<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Computer Troubleshooting Report</title>

    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            color: #111;
        }

        h2 {
            color: #8a1e1e;
            font-weight: bold;
            font-size: 26px;
            text-align: center;
        }

        .section {
            margin-top: 18px;
        }

        .divider {
            font-weight: bold;
            border-bottom: 2px solid #e5e7eb;
            margin-bottom: 10px;
            padding-bottom: 4px;
        }

        .dividers {
            font-weight: bold;
            border-bottom: 2px solid #e5e7eb;
            margin-bottom: 30px;
            padding-bottom: 4px;
        }

        .badge {
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            padding: 4px 8px;
            margin: 3px;
            border-radius: 6px;
            font-size: 11px;
        }

        .box {
            border: 1px solid #d1d5db;
            background: #f9fafb;
            padding: 8px;
            border-radius: 4px;
            white-space: pre-line;
        }

        .images {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .images img {
            width: 150px;
            height: 110px;
            object-fit: cover;
            border-radius: 4px;
            border: 1px solid #d1d5db;
        }
    </style>
</head>

<body>

<!-- Report No at top-right -->
    <div style="width: 100%; position: relative; margin-bottom: 10px;">
        <span style="position: absolute; left: -35px; top: -35px; font-weight: bold; font-size: 8px;">
            {{ $data->report_no }}
        </span>
    </div>
    <h2>Computer Troubleshooting Report</h2>

    <div class="section">
        <div class="divider">MIS Technician Info</div>

        <table width="100%" cellspacing="0" cellpadding="4">
            <tr>
                <td width="20%"><strong>Technician ID</strong></td>
                <td width="30%">{{ $data->tech_id }}</td>

                <td width="20%"><strong>Name</strong></td>
                <td width="30%">{{ $data->tech_name }}</td>
            </tr>
        </table>
    </div>


    <div class="section">
        <div class="divider">Unit Details</div>

        <table width="100%" cellspacing="0" cellpadding="4">
            <tr>
                <td width="15%"><strong>Hostname</strong></td>
                <td width="35%">{{ $data->hostname }}</td>

                <td width="15%"><strong>Serial</strong></td>
                <td width="35%">{{ $data->serial_number }}</td>
            </tr>

            <tr>
                <td><strong>Model</strong></td>
                <td>{{ $data->model }}</td>

                <td><strong>Service Tag</strong></td>
                <td>{{ $data->service_tag }}</td>
            </tr>

            <tr>
                <td><strong>Type</strong></td>
                <td>{{ $data->computer_type }}</td>

                <td><strong>OS</strong></td>
                <td>{{ $data->operating_system }}</td>
            </tr>

            <tr>
                <td><strong>Issued To</strong></td>
                <td colspan="3">{{ $data->issued_to }}</td>
            </tr>
        </table>
    </div>


    <div class="section">
        <div class="divider">Computer Issues</div>
        @foreach($computer_issues as $item)
        <span class="badge">{{ $item }}</span>
        @endforeach
    </div>

    <div class="section">
        <div class="divider">Items Checked In</div>
        @foreach($items_checked as $item)
        <span class="badge">{{ $item }}</span>
        @endforeach
    </div>

    <div class="section">
        <div class="divider">Summary of Repairs</div>
        @foreach($summary_repairs as $item)
        <span class="badge">{{ $item }}</span>
        @endforeach
    </div>



    <div class="section">
        <div class="divider">Technician Notes</div>
        <div class="box">{{ $data->technician_notes ?: '—' }}</div>
    </div>

    <div class="section">
        <div class="divider">Recommended Parts</div>
        <div class="box">{{ $data->recommended_parts ?: '—' }}</div>
    </div>

    <!-- ✅ ATTACHMENTS (FIXED) -->
    <div class="section">
        <div class="dividers">Attachments</div>

        @if(count($attachments))
        <div class="images">
            @foreach($attachments as $img)
            <img src="{{ public_path('storage/attachments/'.$img) }}" alt="Attachment">
            @endforeach
        </div>
        @else
        <p>No attachments</p>
        @endif
    </div>


</body>

</html>