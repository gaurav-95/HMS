# GSS-HMS v2 — Workflow & Architecture Reference

> Last updated after codebase cleanup (dead pages/routes/types removed).
> Use this document as the canonical reference whenever making changes.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite, TanStack React Query |
| UI Components | shadcn/ui (Radix UI primitives), Lucide icons, Recharts |
| CSS | Tailwind CSS v4 (`@theme {}` block, class-based dark mode via `.dark`) |
| Toasts | sonner |
| Backend | Express.js (port 3001), TypeScript (dev: tsx, prod: esbuild bundle) |
| ORM | Drizzle ORM + better-sqlite3 |
| Database | SQLite (WAL mode, single file: `data/gss-hms.db`) |
| Auth | JWT (secret: `gss-hms-standalone-secret-2026`, 24h expiry) + bcryptjs |
| Deployment | Standalone — frontend served as static files from the same Express server |

---

## 2. Project Structure

```
GSS-HMS-v2/
├── src/                    # React frontend
│   ├── App.tsx             # Routes + providers
│   ├── main.tsx            # Entry point
│   ├── index.css           # Tailwind + dark mode CSS vars
│   ├── components/         # Shared UI components
│   ├── context/            # AuthContext
│   ├── hooks/queries.ts    # All React Query hooks
│   ├── pages/              # Route-level page components
│   ├── services/api.ts     # Axios instance + API call functions
│   ├── types/index.ts      # All TypeScript types/interfaces
│   └── lib/                # Utilities (export, utils)
├── src-server/             # Express backend
│   ├── index.ts            # Server entry, route registration
│   ├── db/
│   │   ├── schema.ts       # Drizzle table definitions
│   │   ├── index.ts        # DB init, setupDatabase(), clearAllData()
│   │   └── seed.ts         # Demo data seeding
│   ├── middleware/auth.ts  # JWT requireAuth middleware
│   └── routes/             # Express route handlers
├── dist-server/index.cjs   # Production bundle (esbuild output)
├── data/                   # Runtime data (gitignored)
│   ├── gss-hms.db          # SQLite database
│   └── uploads/            # Uploaded files (staff docs, certs, licenses)
└── WORKFLOW.md             # This file
```

---

## 3. Authentication & Role System

### Login Flow

```
POST /api/auth/login
  → validate email + password (bcrypt.compare)
  → return JWT { id, name, email, role, department }
  → frontend stores token in localStorage ("token")
  → AuthContext decodes token, loads permissions from ROLE_PERMISSIONS
```

### Role Hierarchy

```
SUPER_ADMIN  (level 0)  — full access including DB reset, mode switch
     │
   ADMIN     (level 1)  — staff management, payroll view, user management
     │
  LEADER     (level 2)  — department-scoped: approve leave, view attendance/payroll
     │
  STAFF      (level 3)  — self-service: apply leave, view attendance/payroll, settings
```

### Permission Map

| Permission | SUPER_ADMIN | ADMIN | LEADER | STAFF |
|---|:---:|:---:|:---:|:---:|
| `dashboard:view` | ✓ | ✓ | ✓ | ✓ |
| `staff:read` | ✓ | ✓ | ✓ | — |
| `staff:write` | ✓ | ✓ | — | — |
| `staff:delete` | ✓ | — | — | — |
| `payroll:read` | ✓ | ✓ | ✓ | ✓ |
| `payroll:write` | ✓ | — | — | — |
| `payroll:approve` | ✓ | — | — | — |
| `users:read` | ✓ | ✓ | — | — |
| `users:write` | ✓ | ✓ | — | — |
| `users:delete` | ✓ | — | — | — |
| `leave:apply` | ✓ | ✓ | ✓ | ✓ |
| `leave:approve` | ✓ | ✓ | ✓ | — |
| `leave:manage-types` | ✓ | — | — | — |
| `attendance:read` | ✓ | ✓ | ✓ | ✓ |
| `attendance:write` | ✓ | ✓ | ✓ | — |
| `settings:read` | ✓ | ✓ | ✓ | ✓ |
| `settings:write` | ✓ | — | — | — |

---

## 4. Frontend Route Tree

```
/login                          → LoginPage          (public)
/dashboard                      → DashboardPage      (any auth)
/staff                          → StaffDirectoryPage (staff:read)
/attendance                     → AttendancePage     (attendance:read)
/leave                          → LeavePage          (leave:apply)
/payroll                        → PayrollPage        (payroll:read)
/licenses                       → LicensesPage       (staff:read)
/users                          → UserManagementPage (users:read)
/settings                       → SettingsPage       (any auth)
/* (catch-all)                  → redirect /dashboard
```

### Key Component Relationships

```
App.tsx
  └── AuthProvider (context/AuthContext.tsx)
        └── AppLayout (components/AppLayout.tsx)
              ├── Sidebar (components/Sidebar.tsx)
              ├── Header  (components/Header.tsx)
              └── <Outlet /> → page components
```

---

## 5. Backend API Tree

### Auth  `/api/auth`
| Method | Path | Description | Tables |
|---|---|---|---|
| POST | `/login` | Authenticate, return JWT | `users` |
| GET | `/me` | Get current user (requireAuth) | `users`, `staff` |
| POST | `/change-password` | Change own password (requireAuth) | `users` |

### Staff  `/api/staff`
| Method | Path | Description | Tables |
|---|---|---|---|
| GET | `/` | List all staff | `staff`, `certifications`, `kpis` |
| POST | `/` | Create staff member | `staff` |
| GET | `/:id` | Get single staff | `staff`, `certifications`, `kpis` |
| PUT | `/:id` | Update staff | `staff` |
| DELETE | `/:id` | Soft-delete (set isActive=false) | `staff` |
| POST | `/:id/certifications` | Add certification | `certifications` |
| PUT | `/:id/certifications/:cid` | Update certification | `certifications` |
| DELETE | `/:id/certifications/:cid` | Delete certification | `certifications` |
| GET | `/:id/documents` | List staff documents | `staffDocuments` |
| POST | `/:id/documents` | Upload staff document (multipart) | `staffDocuments` |
| DELETE | `/:id/documents/:did` | Delete staff document | `staffDocuments` |

### Attendance  `/api/attendance`
| Method | Path | Description | Tables |
|---|---|---|---|
| GET | `/` | List records (filter by date/staff) | `attendanceRecords`, `staff` |
| POST | `/` | Create/upsert attendance record | `attendanceRecords` |
| PUT | `/:id` | Update record | `attendanceRecords` |
| DELETE | `/:id` | Delete record | `attendanceRecords` |
| POST | `/bulk` | Bulk upsert (all staff for a date) | `attendanceRecords`, `staff` |

### Leave  `/api/leave`
| Method | Path | Description | Tables |
|---|---|---|---|
| GET | `/` | List leave requests | `leaveRequests` |
| POST | `/` | Apply for leave | `leaveRequests` |
| PATCH | `/:id/approve` | Approve → auto-creates OnLeave attendance | `leaveRequests`, `attendanceRecords` |
| PATCH | `/:id/reject` | Reject leave request | `leaveRequests` |
| PATCH | `/:id/cancel` | Cancel pending leave | `leaveRequests` |
| GET | `/types` | List leave types | `leaveTypes` |
| POST | `/types` | Create leave type (SUPER_ADMIN) | `leaveTypes` |
| PUT | `/types/:id` | Update leave type (SUPER_ADMIN) | `leaveTypes` |
| DELETE | `/types/:id` | Delete leave type (SUPER_ADMIN) | `leaveTypes` |

### Payroll  `/api/payroll`
| Method | Path | Description | Tables |
|---|---|---|---|
| GET | `/` | List payroll records | `payrollRecords` |
| POST | `/generate` | Generate payroll for month/year | `payrollRecords`, `staff`, `attendanceRecords` |
| PUT | `/:id` | Update payroll record | `payrollRecords` |
| PATCH | `/:id/approve` | Approve payroll | `payrollRecords` |
| PATCH | `/:id/mark-paid` | Mark as paid | `payrollRecords` |
| DELETE | `/:id` | Delete record | `payrollRecords` |

### Users  `/api/users`
| Method | Path | Description | Tables |
|---|---|---|---|
| GET | `/` | List system users | `users` |
| POST | `/` | Create user account | `users` |
| PUT | `/:id` | Update user | `users` |
| PATCH | `/:id/toggle` | Toggle active/inactive | `users` |
| DELETE | `/:id` | Delete user | `users` |
| POST | `/:id/reset-password` | Reset password | `users` |

### Dashboard  `/api/dashboard`
| Method | Path | Description | Tables |
|---|---|---|---|
| GET | `/stats` | Aggregated stats | `staff`, `attendance`, `leave`, `payroll`, `certifications`, `hospitalLicenses` |

### Settings  `/api/settings`
| Method | Path | Description | Tables |
|---|---|---|---|
| GET | `/` | Get all settings | `appSettings` |
| PUT | `/working-days` | Update working days per month | `appSettings` |
| POST | `/mode` | Switch app mode / clear demo data (SUPER_ADMIN only) | `appSettings` + all tables |

### Hospital Licenses  `/api/hospital-licenses`
| Method | Path | Description | Tables |
|---|---|---|---|
| GET | `/` | List licenses | `hospitalLicenses` |
| POST | `/` | Create license (with optional file upload) | `hospitalLicenses` |
| PUT | `/:id` | Update license | `hospitalLicenses` |
| PATCH | `/:id/addressed` | Toggle addressed flag | `hospitalLicenses` |
| DELETE | `/:id` | Soft-delete license | `hospitalLicenses` |

---

## 6. Active Database Schema (11 tables)

```
users              — system login accounts (SUPER_ADMIN/ADMIN/LEADER/STAFF)
staff              — employee profiles (linked to users optionally)
certifications     — staff cert records with expiry tracking
kpis               — staff KPI entries (label + value + target)
attendance_records — daily attendance per staff member
leave_requests     — leave applications with approval workflow
payroll_records    — monthly payroll calculations per staff
leave_types        — configurable leave type definitions
app_settings       — key/value app configuration (workingDaysPerMonth, appMode)
hospital_licenses  — hospital license/permit tracking with expiry
staff_documents    — uploaded documents per staff member (stored as files)
```

---

## 7. Key Business Logic

### Payroll Generation
```
grossSalary = basicSalary + hra + otherAllowance
deductions  = professionalTax + epfEmployee + leaveDeductions
netSalary   = grossSalary - deductions + bonus
bonus       = 5% of basicSalary in December, else 0
shiftRate   = grossSalary / workingDaysPerMonth   (shift-based staff only)
```

### Leave → Attendance Sync
- When a leave request is **Approved** (`PATCH /leave/:id/approve`):
  - For each calendar day in `[startDate, endDate]`, an `AttendanceRecord` with `status = "OnLeave"` is upserted (insert or skip if already present).
- When a leave request is **Cancelled** (only Pending status allowed):
  - No attendance records are modified (approved leaves cannot be cancelled).

### Certification Expiry Status
- `"Valid"` — expiryDate > today + 30 days
- `"Expiring"` — expiryDate within next 30 days
- `"Expired"` — expiryDate < today

### Hospital License Status
- Computed from `expiryDate` relative to today (same thresholds as certs):
  - `"Valid"`, `"Expiring"` (≤ 30 days), `"Expired"`, `"N/A"` (no expiry date)

### Soft Delete Pattern
- `staff.isActive` — false = terminated (still visible to SUPER_ADMIN with "Show Terminated" toggle)
- `hospitalLicenses.isActive` — false = deleted

### Dark Mode
- Stored in `localStorage` key `"theme"` (`"dark"` | `"light"` | `"system"`)
- Applied by adding/removing `.dark` class on `document.documentElement`
- CSS vars defined in `src/index.css` under `.dark {}` selector
- Tailwind `dark:` variants enabled via `@custom-variant dark (&:where(.dark, .dark *))`

### Demo Data Mode
- On first launch (empty `users` table), `seedDemoData()` is called automatically
- `app_settings.appMode = "demo"` is set
- SUPER_ADMIN can switch to live mode via Settings → clears all demo data via `clearAllData()`

### JWT Auth
- Token issued on login, stored in `localStorage("token")`
- All protected routes require `Authorization: Bearer <token>` header
- Middleware: `src-server/middleware/auth.ts` → `requireAuth`
- Token payload: `{ id, name, email, role, department }`

---

## 8. Demo Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@gsshospital.com | password123 |
| Admin | admin@gsshospital.com | password123 |
| Leader (GM) | leader@gsshospital.com | password123 |
| Staff | staff@gsshospital.com | password123 |
| Leader (Surgery) | leader2@gsshospital.com | password123 |
| Staff 2 | staff2@gsshospital.com | password123 |
