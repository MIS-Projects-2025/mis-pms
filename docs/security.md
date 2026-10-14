# Security & Role-Based Access Control (RBAC)

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Role-Based Access Control](#role-based-access-control)
3. [Middleware Chain](#middleware-chain)
4. [Sidebar Visibility](#sidebar-visibility)
5. [Route Protection](#route-protection)
6. [Security Considerations](#security-considerations)

---

## Authentication Flow

The system uses **external Single Sign-On (SSO)** via the corporate **Authify** system rather than Laravel's built-in authentication.

### Login Flow

```
User visits protected URL
  ↓
AuthMiddleware checks for token:
  1. Query parameter (?key=...)
  2. Cookie (sso_token)
  3. Session (emp_data.token)
  ↓
NO TOKEN FOUND?
  ↓ Redirect to Authify login:
     http://192.168.20.21:8200/login?redirect={current_url}
  ↓
User logs in at Authify
  ↓
Authify redirects back with ?key={token}
  ↓
AuthMiddleware validates token against authify_sessions table
  ↓
Session created with employee data
  ↓
If emp_system_role not in [admin, superadmin, boxing, supporttech, networktech]
  ↓ Redirect to /unauthorized (403)
```

### Logout Flow

```
User clicks Logout
  ↓
AuthMiddleware:
  1. Clears Laravel session
  2. Invalidates session
  3. Regenerates CSRF token
  4. Redirects to Authify logout:
     http://192.168.20.21:8200/logout?token={token}&redirect={dashboard_url}
  ↓
Authify handles its own session cleanup
  ↓
Redirected back to dashboard → triggers new login
```

### Token Resolution Priority

The middleware resolves the authentication token in this order:

1. **Query string** (`?key=...`) - Used during SSO redirect callback
2. **Cookie** (`sso_token`) - Persists authentication across browser sessions (7-day expiry)
3. **Session** (`emp_data.token`) - Tied to server-side session

### Session Data Structure

```php
session(['emp_data' => [
    'token'         => '...',          // Authify session token
    'emp_id'        => 1234,           // Employee ID
    'emp_name'      => 'Doe, John',    // Full name
    'emp_firstname' => 'John',         // First name
    'emp_jobtitle'  => 'MIS Technician',
    'emp_dept'      => 'MIS',
    'emp_prodline'  => 'Production',
    'emp_station'   => 'Support',
    'emp_position'  => 'Technician',
    'generated_at'  => '2025-01-15 10:00:00',
    'emp_system_role' => 'supporttech', // From admin table (nullable)
]]);
```

---

## Role-Based Access Control

### Available Roles

| Role          | Level | Description                                                    |
| ------------- | ----- | -------------------------------------------------------------- |
| `superadmin`  | 5     | Full system access, maintenance mode, data export, all modules |
| `admin`       | 4     | User management, checklist item management, verification       |
| `supporttech` | 3     | Create/view/edit checklists, perform maintenance tasks         |
| `networktech` | 3     | Create/view/edit checklists, perform maintenance tasks         |
| `boxing`      | 2     | Limited to boxing printer checklists (acknowledge only)        |
| _(null)_      | 0     | No access → redirected to /unauthorized                        |

### Role Assignment

Roles are managed through the **admin** table in the `checklist` database. The `emp_role` column determines the user's system role.

**Managing Roles (Admin UI):**

- Superadmins and admins can access `/admin` to view current admins
- `superadmin` users can assign any role
- `admin` users have limited role assignment capabilities

---

## Middleware Chain

### Full Middleware Stack

```
Request
  ↓
\App\Http\Middleware\HandleInertiaRequests
  (Shares global data with Inertia views: auth, app name, system status)
  ↓
\App\Http\Middleware\AuthMiddleware
  (SSO authentication, session management, maintenance check)
  ↓
\App\Http\Middleware\AdminMiddleware
  (Admin table verification for protected routes)
  ↓
Controller
```

### AuthMiddleware Bypass

Internal service-to-service calls are allowed by passing the `X-Internal-Key` header matching `config('services.internal.key')`.

### Maintenance Mode Bypass

The following routes bypass the maintenance check:

- `logout` - Always accessible
- `system-status.online` - Always accessible
- `system-status.maintenance` - Always accessible

### AdminMiddleware Logic

```php
public function handle(Request $request, Closure $next): Response
{
    if (session('emp_data')) {
        $checkIfExists = DB::connection('checklist')
            ->table('admin')
            ->where('emp_id', session('emp_data')['emp_id'])
            ->exists();

        if (!$checkIfExists) {
            return redirect()->route('dashboard');
        }
    }

    return $next($request);
}
```

This middleware does **not** check the specific role value—it only verifies that the user exists in the `admin` table. The actual role-based restrictions are enforced at the **frontend** (sidebar visibility) and **controller** level (for sensitive operations like maintenance mode toggle).

---

## Sidebar Visibility

The sidebar navigation items are conditionally rendered based on the user's `emp_system_role`:

```jsx
// Navigation.jsx

// Visible to: superadmin, admin, supporttech, networktech
["superadmin", "admin", "networktech", "supporttech"].includes(role) &&
    (
        <>
            <ComputerChecklist />
            <PrinterChecklist />
            <BoxingPrinterChecklist />
            <ComputerRepairChecklist />
            <CCTVChecklist />
            <LadderChecklist />
        </>
    )[
        // Visible to: superadmin, admin
        ("superadmin", "admin")
    ].includes(role) &&
    (
        <>
            <UserManagement />
            <PMChecklistItemsDropdown />
            {role === "superadmin" && <ExportData />}
        </>
    )[
        // Visible to: boxing (only)
        "boxing"
    ].includes(role) && <BoxingPrinterChecklist />;
```

---

## Route Protection

### Route Groups by Role

```
/{prefix}/ → AuthMiddleware
  ├── / → Dashboard (all authenticated users)
  ├── /profile → Profile (all authenticated users)
  │
  ├── AdminMiddleware group:
  │   ├── /computer-checklist → Computer CRUD
  │   ├── /printer-checklist → Printer CRUD
  │   ├── /boxing/printer-checklist → Boxing Printer CRUD
  │   ├── /computer-repairs → Computer Repair CRUD
  │   ├── /cctv-index → CCTV CRUD
  │   ├── /ladder-checklist-index → Ladder CRUD
  │   ├── /admin → User management
  │   ├── /export → Data export
  │   └── /system-status/* → Maintenance toggle
  │
  ├── /inventory/* → No middleware (public API)
```

### Controller-Level Role Checks

Some operations perform additional role checks at the controller level:

```php
// SystemStatusController - Only superadmin can toggle maintenance
public function setOnline(Request $request)
{
    $empRole = session('emp_data.emp_system_role');
    if ($empRole != "superadmin") {
        abort(403, 'Unauthorized');
    }
    // ...
}
```

Frontend also enforces some restrictions, e.g., only `emp_id === "1268"` can verify checklists, and only `emp_id === "16"` can verify ladder inspections.

---

## Security Considerations

### 1. SSO Token Handling

- Tokens are transmitted via URL query parameters during redirect (`?key=...`)
- The middleware immediately strips the query parameter after first use and redirects to clean URL
- Tokens are stored in server-side session (not localStorage by default)

### 2. Cookie Security

- `sso_token` cookie is set with 7-day expiry
- The application should configure `secure`, `httponly`, and `samesite` attributes in production

### 3. Internal Service Communication

- Internal requests use `X-Internal-Key` header for bypassing SSO
- The key is configured via `config('services.internal.key')`

### 4. Unauthenticated Endpoints

- Inventory routes (`/hostnames`, `/{id}/full-details`) have **no authentication middleware**
- These should be restricted in production if they contain sensitive data

### 5. Role Verification

- Role checks happen at multiple layers:
    - Middleware (AuthMiddleware validates role presence)
    - Sidebar (frontend role-based rendering)
    - Controller (role-specific operation checks)
- However, there is no dedicated middleware for specific role verification beyond the admin table check

### 6. Password Storage

- Passwords are stored in **plaintext** in the `employee_masterlist.PASSWRD` column
- This is a known security limitation inherited from the legacy masterlist system

---

_Next: [Common Patterns & Data Flow](/docs/patterns.md)_
