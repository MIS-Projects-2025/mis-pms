# System Architecture

## Table of Contents

1. [Backend Architecture](#backend-architecture)
2. [Frontend Architecture](#frontend-architecture)
3. [Routing Structure](#routing-structure)
4. [Request Lifecycle](#request-lifecycle)
5. [Database Schema](#database-schema)

---

## Backend Architecture

### Directory Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── AuthenticationController.php    # SSO session & logout
│   │   ├── DashboardController.php         # Dashboard analytics
│   │   ├── SystemStatusController.php      # Maintenance mode toggle
│   │   ├── InventoryController.php         # Hardware details API
│   │   ├── ExportController.php            # Data export (Excel/CSV)
│   │   ├── Cctv/                           # CCTV checklist module
│   │   ├── Computer/                       # Computer checklist module
│   │   ├── General/                        # Admin & Profile management
│   │   ├── Ladder/                         # Ladder inspection module
│   │   ├── Printer/                        # Printer & Boxing printer modules
│   │   └── Reports/                        # Computer repair & hardware reports
│   ├── Middleware/
│   │   ├── AuthMiddleware.php              # SSO authentication & maintenance check
│   │   ├── AdminMiddleware.php             # Admin role verification
│   │   └── HandleInertiaRequests.php       # Inertia shared data
│   └── Requests/                           # Form request validation
├── Models/
│   ├── User.php                            # Laravel default user model (unused)
│   └── SystemStatus.php                    # Maintenance status model
├── Repositories/
│   └── SystemStatusRepository.php          # Data access for system status
├── Services/
│   ├── DataTableService.php                # Reusable datatable CRUD + CSV export
│   ├── SystemStatusService.php             # Business logic for maintenance mode
│   └── ...                                 # (copies of services)
└── Providers/
    └── AppServiceProvider.php              # Vite prefetch configuration
```

### Design Patterns

**1. Service Layer Pattern**

- Business logic is encapsulated in Service classes under `app/Services/`
- Controllers delegate to services for complex operations
- Example: `SystemStatusService` handles maintenance mode logic

**2. Repository Pattern**

- `SystemStatusRepository` abstracts database queries for SystemStatus model
- Enables easy testing and future database changes

**3. DataTableService** (Custom Generic CRUD)

- A reusable service that handles:
    - Paginated datatable queries
    - Search across configurable columns
    - Date range filtering
    - Column sorting
    - CSV export
    - Custom join conditions
- Used by all checklist controllers

### Middleware Stack

```
Request → HandleInertiaRequests → AuthMiddleware → AdminMiddleware → Controller
                                    ↓ (if maintenance)
                              Maintenance Page (503)
```

**AuthMiddleware** handles:

1. Internal service bypass (X-Internal-Key header)
2. SSO token resolution (query → cookie → session)
3. User session creation from Authify database
4. Role-based access restriction
5. Maintenance mode check (with bypass for logout & status routes)
6. Cookie management (sso_token)

**AdminMiddleware** handles:

- Verifies user is in the `admin` table
- Redirects non-admin users to dashboard

---

## Frontend Architecture

### Directory Structure

```
resources/js/
├── app.jsx                        # Inertia app bootstrap & theme provider
├── bootstrap.js                   # Bootstrap JavaScript
├── Components/
│   ├── ui/                        # shadcn/ui components (button, card, input, etc.)
│   ├── sidebar/
│   │   ├── SideBar.jsx            # Main sidebar with collapse, mobile overlay
│   │   ├── Navigation.jsx         # Nav links with role-based visibility
│   │   ├── SidebarLink.jsx        # Single navigation link component
│   │   ├── DropDown.jsx           # Collapsible dropdown navigation
│   │   └── ...                    # ThemeToggler
│   ├── DataTable.jsx              # Reusable datatable (search, sort, paginate, filter)
│   ├── Modal.jsx                  # Generic modal component
│   ├── NavBar.jsx                 # Top navigation bar with user menu
│   ├── ThemeContext.jsx           # Dark/light theme context provider
│   └── ...                        # InputError, InputLabel, TextInput, etc.
├── Layouts/
│   ├── AuthenticatedLayout.jsx    # Main layout (Sidebar + NavBar + Footer)
│   └── GuestLayout.jsx            # Guest layout (unused)
├── Pages/
│   ├── Dashboard.jsx              # Analytics dashboard
│   ├── Profile.jsx                # User profile & password change
│   ├── Maintenance.jsx            # Maintenance mode page (animated)
│   ├── ExportPage.jsx             # Data export page
│   ├── 404.jsx                    # Not found page
│   ├── Unauthorized.jsx           # Access denied page
│   ├── Admin/                     # User management pages
│   ├── Cctv/                      # CCTV checklist page
│   ├── Computer/                  # Computer checklist pages
│   ├── Ladder/                    # Ladder checklist pages
│   ├── Printer/                   # Printer & Boxing printer pages
│   └── Reports/                   # Computer repair & hardware reports
└── lib/
    └── utils.js                   # Utility functions (cn, etc.)
```

### Key Frontend Patterns

**1. Inertia.js (No API Calls)**

- All data is passed from server to client via Inertia props
- Form submissions use `router.post()`, `router.put()`, `router.delete()`
- No Axios/fetch API calls for CRUD operations

**2. React State Management**

- Local `useState` for component-level state
- `zustand` available for global state (minimally used)
- Context API for theme management (`ThemeContext`)

**3. UI Component Libraries**

- **shadcn/ui**: Core UI primitives (Button, Card, Dialog, Input, Select, Table, Tabs, etc.)
- **Radix UI**: Underlying accessibility primitives for shadcn
- **Ant Design**: Select dropdowns (in Printer & CCTV checklists)
- **MUI Icons**: Icon usage in Computer Repair page
- **Lucide React**: Icon set used throughout

**4. DataTable Component**

- Reusable table component with:
    - Column sorting (▲/▼ indicators)
    - Search input
    - Date range filtering
    - Per-page selector
    - Pagination with page numbers
    - Tab-based status filtering
    - Optional row selection (checkboxes)
    - CSV export trigger
    - Dropdown column filters

---

## Routing Structure

### Route Registration

Route files are organized by module under `routes/`:

```
routes/
├── web.php            # Main entry point, requires all module routes
├── auth.php           # Authentication routes (logout, unauthorized)
├── general.php        # Dashboard, profile, admin management
├── computer.php       # Computer checklist CRUD
├── printer.php        # Printer & Boxing printer checklist CRUD
├── reports.php        # Computer repair & hardware reports
├── cctv.php           # CCTV checklist CRUD
├── inventory.php      # Hardware details API (no auth)
├── ladder.php         # Ladder checklist CRUD
├── export.php         # Data export
└── console.php        # Artisan commands
```

All routes use an `APP_NAME` prefix (from `.env`).

### Route Prefix Pattern

```php
Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {
    Route::middleware(AdminMiddleware::class)->group(function () {
        // Admin-only routes
    });

    // Authenticated user routes
});
```

### Named Routes Convention

Routes follow the pattern: `{module}.{action}`

- `computer-checklist.index`, `computer-checklist.store`, `computer-checklist.destroy`
- `printer-checklist.verify`, `cctk.viewPdf`

---

## Request Lifecycle

```
1. User visits URL (e.g., /app/computer-checklist)
2. Laravel routing → applies prefix + middleware
3. AuthMiddleware:
   a. Gets token from query → cookie → session
   b. If no token → redirect to Authify SSO login
   c. If valid token → fetch/create session from authify DB
   d. Check admin table for role
   e. If maintenance mode → render Maintenance page (503)
   f. If unauthorized role → render Unauthorized page (403)
4. AdminMiddleware: Verify user is in admin table
5. Controller: Process request, query database, prepare Inertia response
6. Inertia renders React page with server-side props
7. User interacts with React UI → submits forms via Inertia
8. Controller handles form submission → redirect back with flash message
```

---

## Database Schema

### Core Tables (checklist database)

| Table                            | Description                              |
| -------------------------------- | ---------------------------------------- |
| `admin`                          | System administrators with roles         |
| `computer_checklists`            | Computer PM checklists                   |
| `computers_checklist_items`      | Computer checklist item templates        |
| `printer_checklists`             | Printer PM checklists                    |
| `printer_checklist_items`        | Printer checklist item templates         |
| `boxing_printer_checklists`      | Boxing printer startup checklists        |
| `boxing_printer_checklist_items` | Boxing printer checklist item templates  |
| `cctv_checklists`                | CCTV PM checklists                       |
| `ladder_checklist`               | Ladder inspection checklists (two-stage) |
| `ladder_checklist_items`         | Ladder inspection item templates         |
| `computer_repair_tbl`            | Computer troubleshooting reports         |
| `hardware_reports`               | Hardware inventory reports               |
| `system_status`                  | Maintenance mode status (single row)     |

### External Database References

| Database     | Tables Used                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| `authify`    | `authify_sessions` (SSO sessions)                                                                                  |
| `mis`        | `hardware`, `printer`, `cctv_lists`, `hardware_parts`, `hardware_software`, `software_inventory`, `hardware_users` |
| `masterlist` | `employee_masterlist`                                                                                              |
| `server25`   | `location_list`                                                                                                    |

---

_Next: [Modules Documentation](/docs/modules.md)_
