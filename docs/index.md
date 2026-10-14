# MIS Preventive Maintenance System (MIS-PMS)

> **Version:** 1.0.0 | **Last Updated:** 2025

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](/docs/architecture.md)
3. [Modules Documentation](/docs/modules.md)
4. [Security & RBAC](/docs/security.md)
5. [Common Patterns & Data Flow](/docs/patterns.md)
6. [Configuration & Deployment](/docs/configuration.md)

---

## System Overview

### Purpose

The **MIS Preventive Maintenance System (MIS-PMS)** is a web-based application designed to track and manage preventive maintenance checklists for IT assets within a manufacturing/industrial facility. It enables MIS technicians to perform scheduled inspections on computers, printers, CCTV cameras, ladders, and other equipment, with a structured verification workflow.

### Key Features

| Feature                    | Description                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Digital Checklists**     | Replace paper-based PM checklists with digital forms for computers, printers (standard & boxing), CCTV, and ladders |
| **Two-Stage Verification** | Checklists go through a verify/approve workflow ensuring quality control                                            |
| **SSO Authentication**     | Integrated with corporate Single Sign-On (SSO) via Authify system                                                   |
| **Role-Based Access**      | Granular access control with 5 roles: superadmin, admin, supporttech, networktech, boxing                           |
| **Dashboard Analytics**    | Real-time monitoring dashboard with daily trends chart                                                              |
| **PDF Generation**         | Export verified checklists as PDF documents                                                                         |
| **Data Export**            | Export checklist data to Excel/CSV for reporting                                                                    |
| **Maintenance Mode**       | Admin-controlled system maintenance toggle                                                                          |
| **Inventory Integration**  | Fetches hardware data from external MIS inventory system                                                            |

### Tech Stack

| Layer                  | Technology                                                                |
| ---------------------- | ------------------------------------------------------------------------- |
| **Backend Framework**  | Laravel 12 (PHP 8.2+)                                                     |
| **Frontend Framework** | React 18 with Inertia.js 2                                                |
| **UI Components**      | shadcn/ui (Radix UI primitives), MUI, Ant Design, Tailwind CSS 4, DaisyUI |
| **Build Tool**         | Vite 6                                                                    |
| **Database**           | MySQL (multiple connections)                                              |
| **PDF Rendering**      | barryvdh/laravel-dompdf (DOMPDF)                                          |
| **Charts**             | Recharts, Chart.js 4                                                      |
| **Forms**              | React Hook Form, react-hook-form                                          |
| **State**              | Zustand                                                                   |
| **Notifications**      | Sonner (toast notifications)                                              |

### System Flow

```
[User Browser]
    ↓ HTTPS
[Authify SSO] → (authenticates user) → redirects back with token
    ↓
[Laravel Backend]
    ├── AuthMiddleware → validates SSO token, sets session
    ├── AdminMiddleware → checks admin table for elevated access
    └── Route Handler → renders React page via Inertia
        ↓
[React Frontend] (rendered on each page visit, no API calls)
    ├── AuthenticatedLayout (Sidebar + NavBar + Footer)
    └── Page Component (checklist form, datatable, etc.)
        ↓
[PDF Generation] (dompdf) for verified checklists
[CSV/Excel Export] (Laravel Excel / DataTableService)
```

### Database Architecture

The system connects to **5 MySQL databases**:

| Connection   | Purpose                                                  |
| ------------ | -------------------------------------------------------- |
| `authify`    | SSO session data from external Authify system            |
| `checklist`  | Main application data (checklists, admin users, reports) |
| `mis`        | IT asset inventory (hardware, printers, CCTV lists)      |
| `masterlist` | Employee masterlist for profile & display                |
| `server25`   | Location list reference data                             |

---

_Next: [Architecture](/docs/architecture.md)_
