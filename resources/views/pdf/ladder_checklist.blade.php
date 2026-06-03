<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Ladder Checklist</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9px;
        }

        .header {
            text-align: center;
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 50px;
            color: #910202;
        }

        .sub-header {
            text-align: center;
            font-size: 10px;
            margin-bottom: 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }

        th,
        td {
            border: 1px solid black;
            padding: 3px;
        }

        .no-border {
            border: none !important;
        }

        .center {
            text-align: center;
        }

        .bold {
            font-weight: bold;
        }

        .checkbox {
            font-size: 12px;
        }

        .section-title {
            background: #eaeaea;
            font-weight: bold;
        }

        .footer {
            margin-top: 10px;
            font-size: 10px;
        }

        .line {
            border-bottom: 1px solid black;
            height: 12px;
        }

        .small {
            font-size: 8px;
        }
    </style>
</head>

<body>

    <div class="header">LADDER INSPECTION CHECKLIST</div>

    @foreach($checklist->sections as $section)

    <table>
        <tr>
            <td colspan="7" class="section-title">
                Ladder Type: {{ $section['ladder_type'] }}
            </td>
        </tr>

        <tr class="center">
            <th rowspan="2">Frequency</th>
            <th rowspan="2">Check Item</th>
            <th rowspan="2">Criteria</th>
            <th colspan="2">
                {{ \Carbon\Carbon::parse($checklist->done_check)->format('F d Y') }}
            </th>

            <th colspan="2">
                {{ \Carbon\Carbon::parse($checklist->next_check)->format('F d Y') }}
            </th>
        </tr>

        <tr class="center">
            <th>Yes</th>
            <th>No</th>
            <th>Yes</th>
            <th>No</th>
        </tr>

        @foreach($section['rows'] as $index => $row)
        <tr>

            @if($index === 0)
            <td rowspan="{{ count($section['rows']) }}" class="center">
                Twice a Month
            </td>
            @endif

            <td>{{ $row['item'] }}</td>

            <td>
                {{ $row['first_criteria'] ?? implode(', ', $row['criteriaList'] ?? []) }}
            </td>

            <td class="center checkbox">
                {{ $row['first_yes'] ? '✔' : '' }}
            </td>

            <td class="center checkbox">
                {{ $row['first_no'] ? '✔' : '' }}
            </td>

            <td class="center checkbox">
                {{ $row['second_yes'] ? '✔' : '' }}
            </td>

            <td class="center checkbox">
                {{ $row['second_no'] ? '✔' : '' }}
            </td>

        </tr>
        @endforeach

    </table>

    @endforeach

    <!-- INSTRUCTIONS -->
    <div class="small">
        1. Put a check on the box that satisfies "Yes" or "No"<br>
        2. If YES, select the corresponding criteria
    </div>

    <br>

    <!-- REMARKS -->
    <table>
        <tr>
            <td style="width: 15%;" class="bold center">Remarks:</td>
            <td>{{ $checklist->remarks }}</td>
        </tr>
    </table>

    <br>

    <!-- SIGNATURES -->
    <table class="no-border">
        <tr class="no-border">
            <td class="no-border">
                <b>Inspected by:</b><br>
                <div class="line">{{ $checklist->first_inspected_by }} / {{ $checklist->done_check ? \Carbon\Carbon::parse($checklist->done_check)->format('F d Y g:i A') : '' }}</div>
            </td>

            <td class="no-border">
                <b>Verified by:</b><br>
                <div class="line">{{ $checklist->first_verified_by }} / {{ $checklist->first_verified_date ? \Carbon\Carbon::parse($checklist->first_verified_date)->format('F d Y g:i A') : '' }}</div>
            </td>
        </tr>

        <tr class="no-border">
            <td class="no-border">
                <b>Second Inspected by:</b><br>
                <div class="line">{{ $checklist->second_inspected_by }} / {{ $checklist->next_check ? \Carbon\Carbon::parse($checklist->next_check)->format('F d Y g:i A' ) : '' }}</div>
            </td>

            <td class="no-border">
                <b>Second Verified by:</b><br>
                <div class="line">{{ $checklist->second_verified_by }} / {{ $checklist->second_verified_date ? \Carbon\Carbon::parse($checklist->second_verified_date)->format('F d Y g:i A') : '' }}</div>
            </td>
        </tr>
    </table>

    <br>

    <div class="footer center">
        TELFORD SVC PHILS.,INC<br>
        INF-15 (Rev.2)
    </div>

</body>

</html>