# Common Patterns & Data Flow

## Table of Contents

1. [DataTableService Pattern](#datatableservice-pattern)
2. [Checklist CRUD Pattern](#checklist-crud-pattern)
3. [Verification Workflow](#verification-workflow)
4. [PDF Generation](#pdf-generation)
5. [CSV Export](#csv-export)
6. [Date Handling](#date-handling)
7. [Error Handling & Flash Messages](#error-handling--flash-messages)
8. [Frontend Component Patterns](#frontend-component-patterns)

---

## DataTableService Pattern

The `DataTableService` (`app/Services/DataTableService.php`) is a **generic, reusable service** that handles datatable operations for all checklist modules. It significantly reduces code duplication across controllers.

### How It Works

```php
public function handle(
    Request $request,
    string $connectionName,  // Database connection to use
    string $tableName,       // Table to query
    array $options = []       // Configuration options
)
```

### Options Array

| Option                 | Type       | Description                                                |
| ---------------------- | ---------- | ---------------------------------------------------------- |
| `searchColumns`        | `array`    | Columns to search against                                  |
| `joins`                | `array`    | Join configurations (table, first, operator, second, type) |
| `conditions`           | `callable` | Custom query conditions (closure receives query builder)   |
| `defaultSortBy`        | `string`   | Default sort column                                        |
| `defaultSortDirection` | `string`   | Default sort direction (`asc`/`desc`)                      |
| `dateColumn`           | `string`   | Column used for date range filtering                       |
| `filename`             | `string`   | Custom filename for CSV export                             |
| `exportColumns`        | `array`    | Columns to include in CSV export                           |

### Usage Example

```php
// In a checklist controller:
public function index(Request $request)
{
    $result = $this->datatable->handle(
        $request,
        'checklist',                    // connection
        'computer_checklists',          // table
        [
            'conditions' => function ($query) use ($request) {
                $query->orderBy('date_checked', 'DESC');
                if ($request->filled('status')) {
                    $query->where('status', $request->status);
                }
                return $query;
            },
            'searchColumns' => ['computer_name', 'performed_by', 'verified_by'],
        ]
    );

    // If CSV export is requested, return directly
    if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
        return $result;
    }

    return Inertia::render('Module/Page', [
        'tableData' => $result['data'],    // Paginated results
        'tableFilters' => $request->only(['search', 'perPage', 'sortBy', ...]),
    ]);
}
```

### Return Value

The service returns:

1. **Normal request**: `['data' => PaginatedCollection, 'columns' => array]`
2. **Export request**: `StreamedResponse` (CSV file download)

---

## Checklist CRUD Pattern

All checklist modules follow a consistent CRUD pattern:

### Index (List View)

```
Controller:
  1. Fetch checklist items template from DB (e.g., computers_checklist_items)
  2. Fetch available assets from MIS inventory (e.g., hardware, printers)
  3. Fetch existing checklists via DataTableService
  4. Pass all data to Inertia page

Frontend (React):
  1. Render DataTable with checklist records
  2. "New Checklist" button opens modal/drawer
  3. Form includes:
     - Asset selector (combobox/select)
     - Date fields
     - Checklist items with status checkboxes
     - Recommendations field
```

### Store (Create)

```
Frontend:
  1. User fills form
  2. Clicks Submit → router.post(route, payload)
  3. Payload includes items as JSON array

Controller:
  1. Validate request
  2. Insert record with JSON-encoded items
  3. Status set to 2 (Pending)
  4. Redirect back with success message
```

### Update

```
Frontend:
  1. User clicks Edit → modal opens with pre-filled data
  2. Modifies fields
  3. Clicks Save → router.put(route, payload)

Controller:
  1. Validate request
  2. Update record
  3. Redirect back with success message
```

### Delete

```
Frontend:
  1. User clicks Delete → confirm dialog
  2. router.delete(route)

Controller:
  1. Delete record
  2. Redirect back with success message
```

---

## Verification Workflow

The verification process is a key pattern across all checklist modules:

### Status State Machine

```
[Status: 2 - Pending]
    ↓
Verification action
    ↓
[Status: 1 - Verified]
    (verified_by + date_verified set)
```

### Implementation

```php
public function verifyings(Request $request, $id)
{
    DB::connection('checklist')->table('computer_checklists')
        ->where('id', $id)
        ->update([
            'verified_by' => session('emp_data.emp_name'),
            'date_verified' => date('Y-m-d H:i:s'),
            'status' => 1,
        ]);

    return redirect()->back()
        ->with('success', 'Checklist verified successfully.');
}
```

### Approval Chain (Boxing Printer)

Boxing printer checklists have a **2-step approval**:

```
Step 1: Acknowledge (by boxing role user)
  → Sets acknowledged_by, date_acknowledged

Step 2: Verify (by admin/superadmin)
  → Sets verified_by, date_verified, status=1
```

**Rule:** The same user cannot both acknowledge and verify.

### Verification Authorization

Verification rights are currently hardcoded by employee ID:

- **Computer/Printer/CCTV verification**: `emp_id === "1268"` (checked in frontend)
- **Ladder First verification**: `emp_id === "16"` (checked in frontend)
- **Ladder Second verification**: `emp_id === "16"` (checked in frontend)

---

## PDF Generation

PDF generation uses **barryvdh/laravel-dompdf** (DOMPDF wrapper).

### Pattern

```php
public function pdf($id)
{
    // 1. Fetch checklist from database
    $checklist = DB::connection('checklist')
        ->table('printer_checklists')
        ->where('id', $id)
        ->first();

    // 2. Decode JSON items
    $checklist->items = collect(json_decode($checklist->items) ?? []);

    // 3. Load Blade view
    $pdf = Pdf::loadView('checklist.printer', compact('checklist'));

    // 4. Stream to browser (or download)
    return $pdf->stream('checklist_' . $id . '.pdf');
}
```

### Blade Templates

| Module          | Template Path                                    |
| --------------- | ------------------------------------------------ |
| Computer        | `resources/views/checklist/computer.blade.php`   |
| Printer         | `resources/views/checklist/printer.blade.php`    |
| Boxing Printer  | `resources/views/checklist/boxing.blade.php`     |
| CCTV            | `resources/views/reports/cctv-pdf.blade.php`     |
| Ladder          | `resources/views/pdf/ladder_checklist.blade.php` |
| Computer Repair | `resources/views/computer_repairs/pdf.blade.php` |

**Note:** PDF download is only enabled when the checklist is verified (status=1).

---

## CSV Export

The system offers two CSV export methods:

### 1. DataTableService Export

Integrated into the datatable flow:

```php
// Add ?export=1 to any datatable URL
$result = $this->datatable->handle($request, 'checklist', 'table', [
    'exportColumns' => ['col1', 'col2', ...],
    'filename' => 'custom_export_filename',
]);
```

### 2. ExportController (Laravel Excel)

The dedicated export module uses `maatwebsite/laravel-excel`:

```php
return Excel::download(
    new GenericExport($data),
    $filename . '.csv',
    \Maatwebsite\Excel\Excel::CSV
);
```

---

## Date Handling

### Date Formats

| Context                   | Format                   | Example                    |
| ------------------------- | ------------------------ | -------------------------- |
| Database (MySQL)          | `Y-m-d` or `Y-m-d H:i:s` | `2025-01-15 10:30:00`      |
| HTML input[type=date]     | `Y-m-d`                  | `2025-01-15`               |
| Display (US locale)       | `m/d/Y`                  | `01/15/2025`               |
| Display (with month name) | `F/d/Y H:i:s`            | `January/15/2025 10:30:00` |

### Due Date Calculations

| Module   | Calculation                                   |
| -------- | --------------------------------------------- |
| Computer | Last day of month +6 months from date checked |
| Printer  | 11th of next month from PM date               |
| CCTV     | +1 month from date performed                  |

### Timezone

The application uses `Asia/Manila` timezone (configurable via `APP_TIMEZONE` env).

---

## Error Handling & Flash Messages

### Server-Side

```php
// Success
return redirect()->back()->with('success', 'Checklist saved successfully.');

// Error
return back()->withErrors(['field' => 'Error message']);
```

### Client-Side

```php
// Using Inertia
router.post(route('checklist.store'), payload, {
    onSuccess: () => {
        alert('✅ Success message');
        // or use sonner toast:
        // toast.success('Saved!');
    },
    onError: (errors) => {
        console.error(errors);
        alert('❌ Error message');
    },
    onFinish: () => {
        // Always runs
    },
});
```

### Toast Notifications

The system uses **Sonner** for toast notifications:

```jsx
<Toaster richColors position="top-center" theme={theme} />
```

---

## Frontend Component Patterns

### DataTable Component

**File:** `resources/js/Components/DataTable.jsx`

**Props:**

| Prop              | Type                            | Description                                                         |
| ----------------- | ------------------------------- | ------------------------------------------------------------------- |
| `columns`         | `Array<{key, label}>`           | Column definitions                                                  |
| `data`            | `Array`                         | Table data                                                          |
| `meta`            | `Object`                        | Pagination metadata (from, to, total, links, currentPage, lastPage) |
| `routeName`       | `String`                        | Route name for navigation                                           |
| `filters`         | `Object`                        | Current filter state                                                |
| `rowKey`          | `String`                        | Unique row identifier                                               |
| `selectable`      | `Boolean`                       | Enable row checkboxes                                               |
| `dateRangeSearch` | `Boolean`                       | Show date range filter                                              |
| `showExport`      | `Boolean`                       | Show export button                                                  |
| `filterDropdown`  | `Object`                        | Dropdown filter config (key, fields, options)                       |
| `tabs`            | `Array<{label, value, count?}>` | Tab filters                                                         |
| `tabKey`          | `String`                        | Filter key for tabs                                                 |

### Modal/Dialog Pattern

All checklist modules use shadcn/ui `<Dialog>` component for create/view/edit operations:

- **Create/Edit**: Dialog with form fields and save/submit buttons
- **View**: Read-only dialog with all checklist details
- **PDF button**: Shown only when checklist is verified

### Theme Support

The application supports **dark/light mode** via:

- `ThemeContext` (React context)
- `next-themes` library
- Tailwind CSS dark mode classes
- Theme toggler in the NavBar

---

_Next: [Configuration & Deployment](/docs/configuration.md)_
