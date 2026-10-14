# Module Documentation

Each module in the system is documented below with its purpose, routes, controllers, frontend pages, and workflow.

---

## 1. Dashboard

**Purpose:** Provide real-time monitoring of all checklist activities with daily counts and trend charts.

### Routes

| Method | URI          | Name        | Controller Method           |
| ------ | ------------ | ----------- | --------------------------- |
| GET    | `/{prefix}/` | `dashboard` | `DashboardController@index` |

### Data Flow

```
DashboardController@index
  ↓ Queries 5 tables (checklist database)
  ├── computer_checklists → COUNT per day
  ├── printer_checklists → COUNT per day
  ├── boxing_printer_checklists → COUNT per day
  ├── computer_repair_tbl → COUNT per day
  └── cctv_checklists → COUNT per day
  ↓ Merges all dates → chart data
  ↓ Passes to Inertia → Dashboard.jsx
```

### Frontend

- **File:** `resources/js/Pages/Dashboard.jsx`
- **Layout:** `AuthenticatedLayout`
- **Components Used:**
    - `recharts` LineChart with 5 datasets (Computer, Printer, Boxing, Repair, CCTV)
    - Cards showing today's counts for each checklist type
    - Real-time clock updating every second

---

## 2. Computer Checklist

**Purpose:** Perform and manage preventive maintenance checklists for desktop computers and laptops.

### Routes

| Method | URI                                   | Name                         | Controller                               |
| ------ | ------------------------------------- | ---------------------------- | ---------------------------------------- |
| GET    | `/computer-checklist`                 | `computer-checklist`         | `ComputerChecklistController@index`      |
| POST   | `/computer-checklist/store`           | `computer-checklist.store`   | `ComputerChecklistController@store`      |
| PUT    | `/computer-checklist/update/{id}`     | `computer-checklist.update`  | `ComputerChecklistController@update`     |
| DELETE | `/computer-checklist/destroy/{id}`    | `computer-checklist.destroy` | `ComputerChecklistController@destroy`    |
| PUT    | `/computer-checklist/verifyings/{id}` | `computer-checklist.verify`  | `ComputerChecklistController@verifyings` |
| GET    | `/computer-checklist/pdf/{id}`        | `computer-checklist.pdf`     | `ComputerChecklistController@pdf`        |

### Workflow

1. **Create**: Technician selects computer name (from MIS inventory), date done, date due (auto-calculated: last day after 6 months from date done), then checks each item as OK/REPAIR/N/A.
2. **View**: Opens read-only modal with all checklist details.
3. **Edit**: Modify checklist items (only if not verified and user is the creator or admin).
4. **Verify**: Authorized admin marks checklist as verified → enables PDF download.
5. **Delete**: Remove checklist (only if not verified and user is the creator or admin).
6. **PDF**: Generate PDF file of verified checklist using dompdf.

### Data Structure

```json
{
    "computer_name": "PC-001",
    "date_checked": "2025-01-15",
    "date_due": "2025-07-31",
    "performed_by": "John Doe",
    "items": [
        { "task": "Clean interior dust", "description": "...", "status": "ok" },
        {
            "task": "Check fan operation",
            "description": "...",
            "status": "repair"
        }
    ],
    "recommendations": "Replace CPU fan",
    "verified_by": "Admin",
    "date_verified": "2025-01-16 10:30:00",
    "status": 1
}
```

### Status Values

| Value | Meaning              |
| ----- | -------------------- |
| 2     | Pending (unverified) |
| 1     | Verified             |

### Frontend

- **File:** `resources/js/Pages/Computer/ComputerChecklist.jsx`
- **Components:** Custom `ComboboxSelect` for computer search, DataTable, shadcn/ui Dialog, Table, Checkbox
- **PDF View:** `resources/views/checklist/computer.blade.php`

---

## 3. Printer Checklist

**Purpose:** Perform preventive maintenance on barcode printers used in production.

### Routes

| Method | URI                                  | Name                        | Controller                              |
| ------ | ------------------------------------ | --------------------------- | --------------------------------------- |
| GET    | `/printer-checklist`                 | `printer-checklist`         | `PrinterChecklistController@index`      |
| POST   | `/printer-checklist/store`           | `printer-checklist.store`   | `PrinterChecklistController@store`      |
| PUT    | `/printer-checklist/update/{id}`     | `printer-checklist.update`  | `PrinterChecklistController@update`     |
| DELETE | `/printer-checklist/destroy/{id}`    | `printer-checklist.destroy` | `PrinterChecklistController@destroy`    |
| PUT    | `/printer-checklist/verifyings/{id}` | `printer-checklist.verify`  | `PrinterChecklistController@verifyings` |
| GET    | `/printer-checklist/pdf/{id}`        | `printer-checklist.pdf`     | `PrinterChecklistController@pdf`        |

### Checklist Structure

The printer checklist has 4 sections:

1. **Section 1** (items 1-4): Simple checkbox items
2. **Section 2** (items 5-12): Parts inspection with Action (A/I/R/D) + Remarks
3. **Section 3** (item 13): Single checkbox
4. **Section 4** (items 14-17): Quality/Settings check + Remarks

### Due Date Logic

Next PM date is automatically set to the **11th of next month**.

### Frontend

- **File:** `resources/js/Pages/Printer/PrinterChecklist.jsx`
- **Printer Selection:** Ant Design `<Select>` with search
- **PDF View:** `resources/views/checklist/printer.blade.php`

---

## 4. Boxing Printer Checklist

**Purpose:** Daily startup checklist for boxing printers, with A/C shift tracking and 2-level approval workflow.

### Routes

| Method | URI                                          | Name                                   | Controller                                     |
| ------ | -------------------------------------------- | -------------------------------------- | ---------------------------------------------- |
| GET    | `/boxing/printer-checklist`                  | `boxing-printer-checklist`             | `BoxingPrinterChecklistController@index`       |
| POST   | `/boxing/printer-checklist/bulk-store`       | `boxing-printer-checklist.bulk-store`  | `BoxingPrinterChecklistController@store`       |
| PUT    | `/boxing/printer-checklist/update/{id}`      | `boxing-printer-checklist.update`      | `BoxingPrinterChecklistController@update`      |
| DELETE | `/boxing/printer-checklist/destroy/{id}`     | `boxing-printer-checklist.destroy`     | `BoxingPrinterChecklistController@destroy`     |
| POST   | `/boxing-printer-checklist/{id}/acknowledge` | `boxing-printer-checklist.acknowledge` | `BoxingPrinterChecklistController@acknowledge` |
| POST   | `/boxing-printer-checklist/{id}/approved`    | `boxing-printer-checklist.approved`    | `BoxingPrinterChecklistController@approved`    |
| GET    | `/boxing/boxing-printer-checklist/pdf/{id}`  | `boxing-printer-checklist.pdf`         | `BoxingPrinterChecklistController@pdf`         |

### Approval Workflow

```
Technician creates checklist (status=2)
  ↓
Boxing role user Acknowledges (fills acknowledged_by)
  ↓
Admin/Superadmin Verifies (fills verified_by, status=1)
```

**Note:** The same user **cannot** both acknowledge and verify the same checklist.

### Shift Logic

```javascript
// A-Shift: 07:00 - 18:59
// C-Shift: 19:00 - 06:59 (next day)
```

The system prevents duplicate submissions for the same shift/day.
Only one checklist per shift per day is allowed.

### Frontend

- **File:** `resources/js/Pages/Printer/BoxingPrinterChecklist.jsx`
- **Layout:** Columns: Station Name, Check Internal Parts, Replace Ribbon/P2 Label, Restart/Calibrate, Remarks
- **Shift Colors:** A-shift (blue), C-shift (purple) with distinct visual badges

---

## 5. CCTV Checklist

**Purpose:** Perform preventive maintenance on CCTV cameras and surveillance equipment.

### Routes

| Method | URI                               | Name                    | Controller                           |
| ------ | --------------------------------- | ----------------------- | ------------------------------------ |
| GET    | `/cctv-index`                     | `cctv.index`            | `CctvChecklistController@index`      |
| POST   | `/cctv-tbl`                       | `cctv.store`            | `CctvChecklistController@store`      |
| PUT    | `/cctv-tbl/edit/{id}`             | `cctv.update`           | `CctvChecklistController@update`     |
| PUT    | `/cctv-checklist/verifyings/{id}` | `cctv-checklist.verify` | `CctvChecklistController@verifyings` |
| GET    | `/reports/{id}/pdf`               | `cctv.viewPdf`          | `CctvChecklistController@viewPdf`    |

### Checklist Categories

1. **Camera & Housing** (6 items): Lens focus, field of view, cleaning, pan/tilt/zoom
2. **Wire & Cable** (4 items): Cable wear, dressing, connectors, coaxial signal
3. **Control Equipment** (6 items): Monitors, DVRs, contrast/brightness, power connections

Each item has fields for: **Remarks** and **Recommendation**.

### Due Date

Auto-set to 1 month from date performed.

### Frontend

- **File:** `resources/js/Pages/Cctv/CctvChecklist.jsx`
- **Camera Selection:** Ant Design `<Select>` fetching from `cctv_lists` table (MIS database)
- **PDF View:** `resources/views/reports/cctv-pdf.blade.php`
- **Styling:** Pink border theme for CCTV modals

---

## 6. Ladder Checklist

**Purpose:** Two-stage ladder inspection process ensuring safety compliance.

### Routes

| Method | URI                                 | Name                          | Controller                              |
| ------ | ----------------------------------- | ----------------------------- | --------------------------------------- |
| GET    | `/ladder-checklist-index`           | `ladder_checklist.index`      | `LadderChecklistController@index`       |
| POST   | `/ladder-checklist`                 | `ladder_checklist.store`      | `LadderChecklistController@store`       |
| PUT    | `/ladder-checklist/{id}/verify`     | `ladder_checklist.verify`     | `LadderChecklistController@verify`      |
| PUT    | `/ladder-checklist/{id}/next-check` | `ladder_checklist.next_check` | `LadderChecklistController@nextCheck`   |
| GET    | `/ladder-checklist/pdf/{id}`        | `ladder_checklist.pdf`        | `LadderChecklistController@generatePDF` |

### Two-Stage Inspection Workflow

```
First Inspection (date = done_check)
  ├── Inspected by: First technician
  ├── Verified by: Safety officer/Authorized user (emp_id = 16)
  ↓
Second Inspection (date = next_check)
  ├── Inspected by: Second technician (different from verifier)
  ├── Verified by: Safety officer/Authorized user (emp_id = 16)
  ↓
PDF Available (both verifications complete)
```

**Important Rules:**

- The verifier (emp_id = 16) **cannot** be the second inspector
- First verification must happen before second inspection can begin
- Checklist items are organized by `ladder_type` with configurable criteria per item

### Data Structure

```json
{
    "sections": [
        {
            "ladder_type": "A-Frame Ladder",
            "rows": [
                {
                    "item": "Rungs condition",
                    "criteriaList": ["Cracked", "Bent", "Missing"],
                    "first_yes": true,
                    "first_no": false,
                    "first_criteria": "Good",
                    "second_yes": true,
                    "second_no": false,
                    "second_criteria": "Good"
                }
            ]
        }
    ]
}
```

### Frontend

- **File:** `resources/js/Pages/Ladder/LadderChecklist.jsx`
- **PDF View:** `resources/views/pdf/ladder_checklist.blade.php`
- **Dynamic Forms:** Checklist items loaded from `ladder_checklist_items` table with per-item criteria

---

## 7. Computer Repair Reports

**Purpose:** Track and document computer troubleshooting and repair activities.

### Routes

| Method | URI                          | Name                     | Controller                       |
| ------ | ---------------------------- | ------------------------ | -------------------------------- |
| GET    | `/computer-repairs/index`    | `computer_repairs.index` | `ComputerRepairController@index` |
| POST   | `/computer-repairs/store`    | `computer_repairs.store` | `ComputerRepairController@store` |
| GET    | `/computer-repairs/{id}/pdf` | `computer_repairs.pdf`   | `ComputerRepairController@pdf`   |

### Report Number Format

```
MISPM-{YEAR}-{RANDOM4CHARS}-{SEQUENCE}
Example: MISPM-2025-X7K2-001
```

### Form Sections

1. **Technician Info** (auto-filled from session)
2. **Unit Details** (fetched from hardware inventory via Select)
3. **Computer Issues** (13 checkboxes: Viruses, Slow, No Power, etc.)
4. **Items Checked In** (8 checkboxes: Keyboard, Mouse, Monitor, etc.)
5. **Summary of Repairs** (21 checkboxes: Reloaded OS, RAM Install, etc.)
6. **Attachments** (multiple image uploads, stored in `storage/app/public/attachments/`)
7. **Technician Notes** (free text)
8. **Recommended Parts** (free text for parts ordering)

### Frontend

- **File:** `resources/js/Pages/Reports/ComputerRepair.jsx`
- **Layout:** Ant Design Drawer (slide-in panel)
- **Image Preview:** Click to view full-size in preview drawer

---

## 8. Hardware Reports

**Purpose:** View comprehensive hardware inventory reports including parts and software details.

### Routes

| Method | URI                 | Name                     | Controller                       |
| ------ | ------------------- | ------------------------ | -------------------------------- |
| GET    | `/hardware-reports` | `hardware_reports.index` | `HardwareReportController@index` |

### Data Joins

The controller joins data from:

- `hardware` table (MIS database)
- `hardware_parts` → JSON arrays for RAM, Storage, Monitor, PSU, Casing, Keyboard, Mouse, Battery
- `hardware_software` + `software_inventory` → JSON arrays for OS, Antivirus, Office

---

## 9. Inventory (API)

**Purpose:** Provide hardware details API consumed by frontend components.

### Routes

| Method | URI                          | Name                    | Controller                                   |
| ------ | ---------------------------- | ----------------------- | -------------------------------------------- |
| GET    | `/{hardwareId}/full-details` | `hardware.full.details` | `InventoryController@getFullHardwareDetails` |
| GET    | `/hostnames`                 | `hardware.hostnames`    | `InventoryController@getHostNames`           |

**Note:** These routes have **no authentication middleware**, making them publicly accessible within the network.

---

## 10. Export Module

**Purpose:** Export checklist data to Excel or CSV format for reporting and analysis.

### Routes

| Method | URI                | Name              | Controller                  |
| ------ | ------------------ | ----------------- | --------------------------- |
| GET    | `/export`          | `export.index`    | `ExportController@index`    |
| GET    | `/export/preview`  | `export.preview`  | `ExportController@preview`  |
| POST   | `/export/generate` | `export.generate` | `ExportController@generate` |

### Configuration

Exportable tables are defined in `config/export_tables.php` (if exists).

### Formats

- **Excel (.xlsx)**: Using `maatwebsite/laravel-excel`
- **CSV (.csv)**: Using `maatwebsite/laravel-excel`

---

## 11. Admin / User Management

**Purpose:** Manage system administrators and their roles.

### Routes

| Method | URI                  | Name              | Controller Method                 |
| ------ | -------------------- | ----------------- | --------------------------------- |
| GET    | `/admin`             | `admin`           | `AdminController@index`           |
| GET    | `/new-admin`         | `index_addAdmin`  | `AdminController@index_addAdmin`  |
| POST   | `/add-admin`         | `addAdmin`        | `AdminController@addAdmin`        |
| POST   | `/remove-admin`      | `removeAdmin`     | `AdminController@removeAdmin`     |
| PATCH  | `/change-admin-role` | `changeAdminRole` | `AdminController@changeAdminRole` |

### Admin Table Structure

```sql
admin_id INT AUTO_INCREMENT PRIMARY KEY,
emp_id INT NOT NULL UNIQUE,
emp_name VARCHAR(255) NOT NULL,
emp_role VARCHAR(255) NOT NULL,
created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
last_updated_by VARCHAR(255),
deleted_at TIMESTAMP NULL DEFAULT NULL
```

### Roles

| Role          | Description                                                  |
| ------------- | ------------------------------------------------------------ |
| `superadmin`  | Full system access, can toggle maintenance mode, export data |
| `admin`       | Can manage users and checklist items                         |
| `supporttech` | Can create/view checklists                                   |
| `networktech` | Can create/view checklists                                   |
| `boxing`      | Limited to boxing printer checklist only (acknowledge role)  |

---

## 12. System Status (Maintenance Mode)

**Purpose:** Allow superadmins to toggle the system between online and maintenance mode.

### Routes

| Method | URI                          | Name                        | Controller Method                       |
| ------ | ---------------------------- | --------------------------- | --------------------------------------- |
| POST   | `/system-status/online`      | `system-status.online`      | `SystemStatusController@setOnline`      |
| POST   | `/system-status/maintenance` | `system-status.maintenance` | `SystemStatusController@setMaintenance` |

### Behavior

- When in maintenance mode, all routes (except logout and status toggles) render the **Maintenance page**
- Non-admin users see a countdown timer to auto-redirect to logout
- Superadmins see a "Set System Online" button
- Maintenance message can be customized (max 500 chars)

### Frontend

- **File:** `resources/js/Pages/Maintenance.jsx`
- **Features:** Animated construction scene with hard-hat workers, crane, and caution tape (CSS animations)

---

## 13. Profile & Password Management

**Purpose:** View account information and change password.

### Routes

| Method | URI                | Name             | Controller Method                  |
| ------ | ------------------ | ---------------- | ---------------------------------- |
| GET    | `/profile`         | `profile.index`  | `ProfileController@index`          |
| POST   | `/change-password` | `changePassword` | `ProfileController@changePassword` |

### Password Change

- Requires current password verification against `employee_masterlist.PASSWRD`
- New password must be confirmed
- On success, user is logged out of all sessions

---

_Next: [Security & RBAC](/docs/security.md)_
