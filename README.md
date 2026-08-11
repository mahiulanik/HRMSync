# HRMS — Human Resource Management System

> A production-oriented HRMS web application for managing employees, attendance, leave, shifts, payroll, payslips, and day-to-day HR operations through role-based administrative and employee portals.

## Overview

HRMS is a full-stack web application with separate experiences for administrators and employees. The React/Vite frontend communicates with an Express/MongoDB backend through a REST API.

Implemented business areas include:

- Employee management
- Attendance and working-time tracking
- Leave applications and approval
- Shift management and shift assignment
- Monthly payroll generation
- Payslip management
- Public holiday management
- Employee profile management
- Password change and password recovery
- Role-specific dashboards

```text
React Web App
     │
     │ Axios / REST API
     ▼
Express API
     │
     ├── Authentication / Authorization
     ├── Controllers
     ├── Services
     ├── Business Rules
     └── File & Email Services
     │
     ▼
MongoDB / External Services
```

## Key Features

### Authentication & Security

- Admin login
- Employee login
- JWT access-token authentication
- JWT refresh-token mechanism
- Session validation
- Logout
- Password change
- Password-reset OTP request, verification, and reset
- bcrypt password hashing
- Role-based authorization
- Protected frontend routes
- Backend authentication and admin authorization middleware
- Rate limiting
- Helmet security headers
- HTTP Parameter Pollution protection
- CORS

### Employee Management

Administrators can:

- Add employees
- List employees
- View an individual employee
- Update employee information
- Soft-delete/deactivate employee records
- Filter employees by department
- Manage employee salary/status information
- Manage profile pictures

### Attendance

Employees can:

- Clock in/out
- View personal monthly attendance
- Review working-time information

Administrators can:

- View administrative attendance
- Filter by month/year, department, and employee
- Review attendance statistics

Attendance tracks employee, shift, date, check-in, check-out, status, late minutes, early-leave minutes, overtime minutes, working hours, and day type.

A unique employee/date constraint prevents duplicate attendance records.

### Leave Management

Employees can submit and view leave requests.

Administrators can review, approve, and reject requests.

Current leave types:

```text
SICK
CASUAL
EARNED
```

Current statuses:

```text
PENDING
APPROVED
REJECTED
```

### Payroll & Payslips

Administrators can:

- Generate monthly payroll
- View company payroll
- View department payroll
- View employee payroll
- Create and review payslips

Employees can:

- View their payslips
- Open an individual payslip
- Use the payslip print page

The payroll implementation excludes Friday and Saturday from working days, calculates present/paid-leave/unpaid-leave days, applies unpaid-leave deductions and overtime, incorporates allowances/deductions, generates payslips, and aggregates monthly totals.

Payroll generation uses a MongoDB transaction.

### Shift Management

Administrators can:

- Create, view, update, deactivate, and activate shifts
- Assign shifts by date
- Assign shifts for a whole month
- Update/delete assignments
- Review employee rosters

Employees can view their assigned shifts.

### Dashboard

The admin dashboard includes employee, department, attendance, pending-leave, and recent-employee information.

The employee dashboard includes employee information, current-month attendance, pending leave, and latest payslip information.

### Profile & File Management

Authenticated users can:

- View/update their profile
- Change password
- Upload a profile picture

Profile pictures use Multer and Cloudinary. Current accepted formats are JPEG, PNG, WebP, and GIF, with a 100 KB limit.

### Email

SMTP/Nodemailer is used to deliver password-reset OTPs. OTPs are hashed before storage and expire after five minutes.

No separate in-app notification system was verified in the repository.

## User Roles & Permissions

The application currently implements two roles:

| Role | Access |
|---|---|
| `ADMIN` | Employee management, administrative attendance, leave approval, shifts, payroll, payslips, public holidays, dashboard, settings/profile |
| `EMPLOYEE` | Personal dashboard, attendance, leave, shifts, personal payslips, settings/profile |

There is no separate `HR` role in the current implementation.

## Technology Stack

### Frontend

| Layer | Technology |
|---|---|
| UI | React 19 |
| Build | Vite |
| Routing | React Router DOM |
| Styling | Tailwind CSS 4 |
| API Client | Axios |
| Icons | Lucide React |
| Linting | Oxlint |

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JSON Web Token |
| Password Hashing | bcrypt |
| Email | Nodemailer / SMTP |
| File Upload | Multer |
| Image Storage | Cloudinary |
| Security Headers | Helmet |
| HPP Protection | HPP |
| Rate Limiting | express-rate-limit |
| CORS | cors |
| Validation | validator |
| Configuration | dotenv |

## System Architecture

The backend follows:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Mongoose Models
  ↓
MongoDB
```

External integrations:

```text
                    ┌── Cloudinary
                    │
Frontend → API → Services → MongoDB
                    │
                    └── SMTP / Nodemailer
```

The frontend uses React Router, AuthContext, ProtectedRoute, role-specific layouts, reusable components, page components, and a central Axios client.

## Project Structure

```text
HRMS full/
├── backend/
│   ├── app.js
│   ├── package.json
│   ├── config/
│   │   ├── cloudinary.js
│   │   ├── db.js
│   │   ├── multer.js
│   │   ├── sendEmail.js
│   │   └── token.js
│   ├── constants/
│   │   ├── departments.js
│   │   └── payroll.js
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── layouts/
│       ├── pages/
│       │   ├── admin/
│       │   └── employee/
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
│
└── README.md
```


## Frontend Routes

### Public

| Route | Description |
|---|---|
| `/` | Landing page |
| `/admin/login` | Admin login |
| `/employee/login` | Employee login |

### Admin

| Route | Description |
|---|---|
| `/admin/dashboard` | Dashboard |
| `/admin/employees` | Employee management |
| `/admin/employees/:id` | Employee profile |
| `/admin/attendance` | Attendance |
| `/admin/leave` | Leave management |
| `/admin/shift` | Shift management |
| `/admin/payroll` | Payroll |
| `/admin/payslips` | Payslips |
| `/admin/settings` | Settings/profile |

### Employee

| Route | Description |
|---|---|
| `/employee/dashboard` | Dashboard |
| `/employee/attendance` | Attendance |
| `/employee/leave` | Leave |
| `/employee/shift` | Shift roster |
| `/employee/payslips` | Payslips |
| `/employee/payslips/:id` | Payslip/print view |
| `/employee/settings` | Settings/profile |

## API Documentation

All API routes are mounted under `/api`.

### Authentication

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/login` | No | — | Login |
| GET | `/session` | Yes | Any | Current session |
| POST | `/change-password` | Yes | Any | Change password |
| POST | `/logout` | Yes | Any | Logout |
| POST | `/refresh-token` | No | — | Refresh tokens |
| POST | `/forgot-password` | No | — | Send OTP |
| POST | `/verify-reset-otp` | No | — | Verify OTP |
| POST | `/reset-password` | No | — | Reset password |

### Employee Management

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/register` | Yes | ADMIN | Create employee |
| GET | `/employees` | Yes | ADMIN | List employees |
| GET | `/employees/:id` | Yes | ADMIN | Get employee |
| PUT | `/employees/:id` | Yes | ADMIN | Update employee |
| DELETE | `/employees/:id` | Yes | ADMIN | Delete/deactivate employee |

### Profile

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/profile` | Yes | Any | Get profile |
| POST | `/profile` | Yes | Any | Update profile |
| POST | `/profile/pic` | Yes | Any | Upload profile picture |

### Attendance

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/attendance` | Yes | Any | Clock in/out |
| GET | `/attendance` | Yes | Any | Personal attendance |
| GET | `/admin/attendance` | Yes | ADMIN | Administrative attendance |

### Leave

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/create-leave` | Yes | Any | Create leave |
| GET | `/get-leaves` | Yes | Any | Get leaves |
| PATCH | `/update-leave/:id` | Yes | ADMIN | Update leave status |

### Payslips

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/create-payslip` | Yes | ADMIN | Create payslip |
| GET | `/get-payslips` | Yes | Any | Get payslips |
| GET | `/get-payslip-by-id/:id` | Yes | Any | Get payslip |

### Dashboard

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/dashboard` | Yes | Any | Role-specific dashboard |

### Shifts

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/create-shift` | Yes | ADMIN | Create shift |
| GET | `/shifts` | Yes | Any | List shifts |
| GET | `/shift/:id` | Yes | Any | Get shift |
| PATCH | `/update-shift/:id` | Yes | ADMIN | Update shift |
| DELETE | `/delete-shift/:id` | Yes | ADMIN | Deactivate shift |
| PATCH | `/shift/:id/activate` | Yes | ADMIN | Activate shift |

### Shift Assignments

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/assign-shift` | Yes | ADMIN | Assign shift |
| POST | `/assign-shift-month` | Yes | ADMIN | Monthly assignment |
| GET | `/my-shifts` | Yes | Any | Current employee shifts |
| GET | `/employee-roster/:id` | Yes | Any | Employee roster |
| GET | `/shift/:id/date` | Yes | Any | Shift by date |
| PATCH | `/update-shift-assignment/:id` | Yes | ADMIN | Update assignment |
| DELETE | `/delete-shift-assignment/:id` | Yes | ADMIN | Delete assignment |

### Payroll

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/generate-payroll` | Yes | ADMIN | Generate monthly payroll |
| GET | `/company-payroll` | Yes | ADMIN | Company payroll |
| GET | `/department-payroll/:department` | Yes | ADMIN | Department payroll |
| GET | `/employee-payroll/:employeeId` | Yes | ADMIN | Employee payroll |

### Public Holidays

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/public-holidays` | Yes | ADMIN | Create holiday |
| GET | `/public-holidays` | Yes | Any | List holidays |
| GET | `/public-holidays/:id` | Yes | Any | Get holiday |
| PATCH | `/public-holidays/:id` | Yes | ADMIN | Update holiday |
| DELETE | `/public-holidays/:id` | Yes | ADMIN | Delete holiday |

## Authentication Flow

```text
User
 ↓
Login Page
 ↓
POST /api/login
 ↓
Credential Validation
 ↓
Access Token + Refresh Token
 ↓
localStorage
 ↓
AuthContext
 ↓
GET /api/session
 ↓
ProtectedRoute
 ├── ADMIN → AdminLayout
 └── EMPLOYEE → EmployeeLayout
```

The Axios client reads `accessToken` from localStorage and sends it as a Bearer token.

On a `401` response, the frontend attempts `/api/refresh-token` with the stored refresh token. If refresh succeeds, the original request is retried. If refresh fails, stored tokens are removed and the user is redirected to `/`.

## Security

Implemented security mechanisms include:

- bcrypt password hashing
- JWT authentication
- Separate access/refresh token secrets
- Role-based authorization
- Protected frontend routes
- Global rate limiting
- Helmet
- HPP
- CORS
- Email validation for password-reset flow
- Hashed password-reset OTPs
- OTP expiry
- Profile-picture MIME validation
- Profile-picture size restriction
- Mongoose validation and unique indexes
- Custom application errors
- Refresh-token invalidation on logout/password reset

The current access token expires after 15 minutes and the refresh token after 7 days.

A five-requests/15-minutes authentication limiter is defined in the backend, but the current routes do not attach that limiter to authentication endpoints.

## Database

MongoDB is accessed through Mongoose.

| Model | Purpose |
|---|---|
| User | Authentication, roles, token state |
| Employee | Employee HR information |
| Attendance | Daily attendance/work time |
| Leave | Leave requests |
| Payroll | Monthly payroll totals |
| Payslip | Employee monthly salary records |
| Shift | Shift definitions |
| ShiftAssignment | Employee/date assignments |
| PublicHoliday | Holiday date ranges |

Important uniqueness constraints include:

```text
Attendance:
(employeeId, date)

ShiftAssignment:
(employeeId, date)

Payslip:
(employeeId, month, year)

Payroll:
(month, year)


## License

This project is licensed under the ISC License.

See the [LICENSE](LICENSE) file for details.