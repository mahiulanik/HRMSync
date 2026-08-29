# HRMSync

> A production-oriented full-stack Human Resource Management System (HRMS) for managing employees, attendance, leave, shifts, payroll, payslips, public holidays, profiles, and day-to-day HR operations through role-based Admin and Employee portals.

## Overview

HRMSync is a full-stack HR management application built with a React/Vite frontend and an Express/MongoDB backend.

The application provides two role-based experiences:

- **ADMIN** — manages employees, attendance, leave approvals, shifts, payroll, payslips, public holidays, and profile/settings.
- **EMPLOYEE** — manages personal attendance, leave requests, assigned shifts, payslips, and profile/settings.

The frontend communicates with the backend through a REST API under `/api`.

### Architecture

```text
┌──────────────────────┐
│   React + Vite App   │
│   Tailwind CSS       │
│   React Router       │
└──────────┬───────────┘
           │ Axios / REST API
           ▼
┌──────────────────────┐
│     Express API      │
│ Auth / Validation    │
│ Controllers          │
│ Services             │
│ Business Rules       │
└──────────┬───────────┘
           │
      ┌────┴─────┐
      ▼          ▼
┌──────────┐  ┌──────────────────┐
│ MongoDB  │  │ External Services │
│ Mongoose │  │ Cloudinary        │
└──────────┘  │ Resend Email      │
              └──────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | UI |
| Vite | Development/build tooling |
| React Router DOM 7 | Client-side routing |
| Tailwind CSS 4 | Styling |
| Axios | REST API client |
| Lucide React | Icons |
| Recharts | Dashboard charts |
| Oxlint | Linting |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express 5 | REST API framework |
| MongoDB | Database |
| Mongoose 9 | ODM |
| JSON Web Token | Authentication |
| bcrypt | Password hashing |
| express-validator | Request validation |
| Nodemailer / Resend | Email infrastructure |
| Resend | Password-reset email delivery |
| Multer | File upload handling |
| Cloudinary | Image storage |
| Helmet | Security headers |
| HPP | HTTP Parameter Pollution protection |
| express-rate-limit | Rate limiting |
| CORS | Cross-origin access |
| cookie-parser | Cookie parsing |
| dotenv | Environment configuration |

---

## Key Features

### Authentication & Security

- Separate Admin and Employee login flows
- JWT access-token authentication
- JWT refresh-token mechanism
- Access token expiry: **15 minutes**
- Refresh token expiry: **7 days**
- Session validation
- Logout and refresh-token invalidation
- Password change
- Forgot-password flow using OTP
- OTP verification and password reset
- Password hashing with bcrypt
- Role-based authorization
- Protected frontend routes
- Backend authentication/admin middleware
- Request validation with `express-validator`
- Global rate limiting
- Authentication-specific rate limiting
- Helmet security headers
- HTTP Parameter Pollution protection with HPP
- CORS configuration
- Cookie parsing
- Mongoose validation and unique indexes
- Centralized application error handling

### Employee Management

Administrators can:

- Add employees
- View employee lists
- View individual employee profiles
- Update employee information
- Activate/deactivate employee records
- Filter employees by department
- Manage salary and employment status information
- Upload/manage employee profile pictures

### Attendance Management

Employees can:

- Clock in
- Clock out
- View their monthly attendance
- Review check-in/check-out and working-time information

Administrators can:

- View company attendance
- Filter attendance by month/year
- Filter by department
- Filter by employee
- Review attendance statistics

Attendance records can contain:

- Employee
- Shift
- Date
- Check-in
- Check-out
- Status
- Late minutes
- Early-leave minutes
- Overtime minutes
- Working hours
- Day type

A unique `(employeeId, date)` constraint prevents duplicate attendance records.

#### Attendance day rules

The application recognizes:

- `PRESENT`
- `LATE`
- `ABSENT`
- `WEEKEND`
- `HOLIDAY`
- `ON_LEAVE`
- `NOT_JOINED`

The current company weekend is **Friday and Saturday**.

Public holidays are merged into employee attendance/calendar views so that a declared holiday is displayed as `HOLIDAY` instead of `ABSENT`.

### Leave Management

Employees can:

- Submit leave requests
- View their leave requests
- Edit eligible leave requests
- Delete eligible leave requests

Administrators can:

- Review leave requests
- Approve leave
- Reject leave

Current leave types:

```text
SICK
CASUAL
EARNED
```

Current leave statuses:

```text
PENDING
APPROVED
REJECTED
```

### Shift Management

Administrators can:

- Create shifts
- View shifts
- Update shifts
- Activate/deactivate shifts
- Assign shifts to employees by date
- Assign shifts for a full month
- Update shift assignments
- Delete shift assignments
- Review employee rosters

Employees can:

- View their assigned shifts
- View their current shift information

Shift configuration supports:

- Shift name
- Start time
- End time
- Grace period
- Weekend configuration

### Public Holiday Management

Administrators can:

- Create public holidays
- Edit public holidays
- Delete public holidays
- Define single-day or date-range holidays

Employees can see public holidays in relevant attendance/calendar information.

Public holidays are also considered by the dashboard attendance logic so holiday dates are not treated as normal absence days.

### Payroll & Payslips

Administrators can:

- Generate monthly payroll
- View company payroll
- View department payroll
- View employee payroll
- Create payslips
- Update payslips
- Review employee salary records

Employees can:

- View their payslips
- Open individual payslips
- Use the payslip/print view

Current payroll rules include:

- Friday and Saturday are excluded from working days
- Present and late attendance count as worked days
- Approved paid leave is counted separately
- Paid leave types are `CASUAL`, `SICK`, and `EARNED`
- Unpaid absence deductions are calculated from basic salary
- Overtime is calculated from overtime minutes
- Overtime uses a **1.5× multiplier**
- Salary allowances and deductions are included
- Monthly payroll totals are aggregated
- Payslips are generated as part of payroll processing
- Payroll generation uses a MongoDB transaction

### Role-Specific Dashboards

#### Admin Dashboard

The Admin dashboard provides:

- Total employees
- Active/inactive employee counts
- Today's present count
- Today's late count
- Today's absent count
- Today's leave count
- Attendance rate
- Overtime information
- Current-month payroll summary
- Leave request summary
- Department attendance overview
- Employee growth information
- Recent employees
- Upcoming public holidays
- 7-day attendance overview
- 30-day attendance overview

#### Employee Dashboard

The Employee dashboard provides:

- Employee profile summary
- Current attendance percentage
- Pending leave count
- Latest net salary
- Today's shift
- Clock-in status
- Worked time
- Monthly attendance calendar
- Present/late/absent/leave/holiday/weekend indicators
- Salary history
- Leave balance
- Next public holiday

### Profile & File Management

Authenticated users can:

- View their profile
- Update profile information
- Change password
- Upload a profile picture

Profile pictures use:

- **Multer** for upload handling
- **Cloudinary** for image storage

Accepted image formats:

```text
JPEG
PNG
WebP
GIF
```

Current profile-picture size limit:

```text
300 KB
```

### Password Recovery Email

The password-reset flow uses:

- Resend API
- OTP generation
- Hashed OTP storage
- OTP verification
- Five-minute OTP expiry

---

## User Roles & Permissions

The application currently implements two roles.

| Role | Access |
|---|---|
| `ADMIN` | Employee management, administrative attendance, leave approval, shifts, payroll, payslips, public holidays, dashboard, profile/settings |
| `EMPLOYEE` | Personal dashboard, attendance, leave, shifts, personal payslips, profile/settings |

There is currently **no separate HR role**.

---


## System Architecture

The backend follows a layered structure:

```text
Routes
  ↓
Middlewares
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
React Frontend → Axios → Express API → Services → MongoDB
                         │
                         └── Resend Email API
```

### Backend responsibilities

- **Routes** — define API endpoints and attach middleware.
- **Middlewares** — authentication, authorization, validation, rate limiting, and error handling.
- **Controllers** — receive requests and return API responses.
- **Services** — contain business logic and database operations.
- **Models** — define MongoDB/Mongoose schemas and indexes.
- **Config** — database, token, email, upload, and Cloudinary configuration.
- **Validators** — validate incoming request data.
- **Utils/Constants** — shared application rules and helper functions.

### Frontend responsibilities

The frontend is organized around:

- React Router
- AuthContext
- ProtectedRoute
- AdminLayout
- EmployeeLayout
- Reusable UI components
- Role-specific pages
- Central Axios API client
- API error utilities

---

## Project Structure

```text
HRMSync-main/
├── backend/
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   ├── seedAdmin.js
│   ├── fixAttendanceIndexes.js
│   │
│   ├── config/
│   │   ├── cloudinary.js
│   │   ├── db.js
│   │   ├── multer.js
│   │   ├── sendEmail.js
│   │   └── token.js
│   │
│   ├── constants/
│   │   ├── departments.js
│   │   └── payroll.js
│   │
│   ├── controllers/
│   ├── middlewares/
│   │   ├── asyncHandler.js
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   ├── rateLimiter.js
│   │   └── validate.js
│   │
│   ├── models/
│   ├── routes/
│   │   └── api.js
│   ├── services/
│   ├── utils/
│   └── validators/
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json
│   ├── public/
│   │
│   └── src/
│       ├── api/
│       │   └── axios.js
│       ├── components/
│       ├── context/
│       ├── layouts/
│       ├── pages/
│       │   ├── admin/
│       │   └── employee/
│       ├── utils/
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## Frontend Routes

### Public Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/admin/login` | Admin login |
| `/employee/login` | Employee login |

### Admin Routes

| Route | Description |
|---|---|
| `/admin` | Redirects to dashboard |
| `/admin/dashboard` | Admin dashboard |
| `/admin/employees` | Employee management |
| `/admin/employees/:id` | Employee profile |
| `/admin/attendance` | Administrative attendance |
| `/admin/leave` | Leave management |
| `/admin/shift` | Shift and public holiday management |
| `/admin/payroll` | Payroll management |
| `/admin/payslips` | Payslip management |
| `/admin/settings` | Admin profile/settings |

### Employee Routes

| Route | Description |
|---|---|
| `/employee` | Redirects to dashboard |
| `/employee/dashboard` | Employee dashboard |
| `/employee/attendance` | Personal attendance |
| `/employee/leave` | Leave management |
| `/employee/shift` | Shift roster |
| `/employee/payslips` | Payslip list |
| `/employee/payslips/:id` | Payslip/print view |
| `/employee/settings` | Employee profile/settings |

---

## API Documentation

All backend endpoints are mounted under:

```text
/api
```

### Authentication

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/login` | No | — | Login |
| GET | `/session` | Yes | Any | Get current session |
| POST | `/change-password` | Yes | Any | Change password |
| POST | `/logout` | Yes | Any | Logout |
| POST | `/refresh-token` | No | — | Refresh access token |
| POST | `/forgot-password` | No | — | Send password-reset OTP |
| POST | `/verify-reset-otp` | No | — | Verify password-reset OTP |
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
| GET | `/attendance` | Yes | Any | Get personal attendance |
| GET | `/admin/attendance` | Yes | ADMIN | Get administrative attendance |

### Leave

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/create-leave` | Yes | Any | Create leave |
| GET | `/get-leaves` | Yes | Any | Get leaves |
| PATCH | `/update-leave/:id` | Yes | ADMIN | Approve/reject/update leave status |
| PUT | `/edit-leave/:id` | Yes | Any | Edit leave |
| DELETE | `/delete-leave/:id` | Yes | Any | Delete leave |

### Payslips

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/create-payslip` | Yes | ADMIN | Create payslip |
| GET | `/get-payslips` | Yes | Any | Get payslips |
| GET | `/get-payslip-by-id/:id` | Yes | Any | Get individual payslip |
| PUT | `/update-payslip/:id` | Yes | ADMIN | Update payslip |

### Dashboard

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/dashboard` | Yes | Any | Get role-specific dashboard data |

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
| POST | `/assign-shift-month` | Yes | ADMIN | Assign shift for a month |
| GET | `/my-shifts` | Yes | Any | Get current employee shifts |
| GET | `/employee-roster/:id` | Yes | Any | Get employee roster |
| GET | `/shift/:id/date` | Yes | Any | Get shift assignment by date |
| PATCH | `/update-shift-assignment/:id` | Yes | ADMIN | Update assignment |
| DELETE | `/delete-shift-assignment/:id` | Yes | ADMIN | Delete assignment |

### Payroll

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/generate-payroll` | Yes | ADMIN | Generate monthly payroll |
| GET | `/company-payroll` | Yes | ADMIN | Get company payroll |
| GET | `/department-payroll/:department` | Yes | ADMIN | Get department payroll |
| GET | `/employee-payroll/:employeeId` | Yes | ADMIN | Get employee payroll |

### Public Holidays

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/public-holidays` | Yes | ADMIN | Create public holiday |
| GET | `/public-holidays` | Yes | Any | List public holidays |
| GET | `/public-holidays/:id` | Yes | Any | Get public holiday |
| PATCH | `/public-holidays/:id` | Yes | ADMIN | Update public holiday |
| DELETE | `/public-holidays/:id` | Yes | ADMIN | Delete public holiday |

---

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
localStorage / authenticated session
  ↓
AuthContext
  ↓
GET /api/session
  ↓
ProtectedRoute
  ├── ADMIN    → AdminLayout
  └── EMPLOYEE → EmployeeLayout
```

The central Axios client:

1. Reads the `accessToken`.
2. Sends it as a Bearer token.
3. Detects expired/invalid access-token responses.
4. Requests a new access token through `/refresh-token`.
5. Retries the original request after a successful refresh.
6. Clears the access token and redirects to `/` if refresh fails.

---

## Database Models

| Model | Purpose |
|---|---|
| `User` | Authentication, roles, refresh-token state |
| `Employee` | Employee HR information |
| `Attendance` | Daily attendance and working-time records |
| `Leave` | Employee leave requests |
| `Payroll` | Monthly company payroll totals |
| `Payslip` | Employee monthly salary records |
| `Shift` | Shift definitions |
| `ShiftAssignment` | Employee/date shift assignments |
| `PublicHoliday` | Public holiday date ranges |

### Important Unique Constraints

```text
Attendance
(employeeId, date)

ShiftAssignment
(employeeId, date)

Payslip
(employeeId, month, year)

Payroll
(month, year)
```

---

## Departments

The current department constants include:

```text
Administration
Human Resources
Finance & Accounts
Sales
Marketing
Customer Support
Operations
Supply Chain
Procurement
Information Technology
Software Development
Legal
Internal Audit
Design
Business Intelligence
```

---

## Environment Variables

Create a `.env` file inside the `backend` directory.

```env
PORT=3000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_verified_sender@example.com

NODE_ENV=development
```

Create a `.env` file inside the `frontend` directory:

```env
VITE_API_URL=http://localhost:3000/api
```

### Environment variable summary

| Variable | Application | Purpose |
|---|---|---|
| `PORT` | Backend | API server port |
| `MONGO_URI` | Backend | MongoDB connection |
| `JWT_SECRET` | Backend | Access-token signing secret |
| `JWT_REFRESH_SECRET` | Backend | Refresh-token signing secret |
| `ADMIN_EMAIL` | Backend | Seed admin email |
| `ADMIN_PASSWORD` | Backend | Seed admin password |
| `CLOUDINARY_CLOUD_NAME` | Backend | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Backend | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Backend | Cloudinary API secret |
| `RESEND_API_KEY` | Backend | Resend API key |
| `EMAIL_FROM` | Backend | Verified email sender |
| `NODE_ENV` | Backend | Runtime environment |
| `VITE_API_URL` | Frontend | Backend API base URL |

**Do not commit `.env` files or secrets to source control.**

---

## Installation & Setup

### Prerequisites

Make sure the following are installed:

- Node.js
- npm
- MongoDB database
- Cloudinary account for profile images
- Resend account/API key for password-reset emails

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd HRMSync-main
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure backend environment

Create:

```text
backend/.env
```

and add the required variables described above.

### 4. Seed the Admin account

```bash
npm run seedAdmin
```

The script reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the environment.

### 5. Start the backend

Development:

```bash
npm run dev
```

Production-style start:

```bash
npm start
```

The backend uses:

```text
http://localhost:3000
```

by default.

### 6. Install frontend dependencies

Open a second terminal:

```bash
cd frontend
npm install
```

### 7. Configure frontend environment

Create:

```text
frontend/.env
```

with:

```env
VITE_API_URL=http://localhost:3000/api
```

### 8. Start the frontend

```bash
npm run dev
```

The Vite development server normally runs at:

```text
http://localhost:5173
```

---

## Available Scripts

### Backend

Run these commands from `backend/`.

| Command | Description |
|---|---|
| `npm run dev` | Start backend with Nodemon |
| `npm start` | Start backend |
| `npm run seedAdmin` | Create the initial Admin user |
| `npm test` | Placeholder test command |

### Frontend

Run these commands from `frontend/`.

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run Oxlint |

---

## Production Deployment

The frontend contains a `vercel.json`, and the application is structured for separate frontend/backend deployment.

### Frontend

Typical deployment flow:

```bash
cd frontend
npm install
npm run build
```

Configure:

```env
VITE_API_URL=https://your-api-domain/api
```

### Backend

Configure the production environment with:

```env
NODE_ENV=production
PORT=your_port
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=your_production_access_secret
JWT_REFRESH_SECRET=your_production_refresh_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RESEND_API_KEY=...
EMAIL_FROM=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

The backend CORS configuration currently allows the local frontend and the deployed HRMSync frontend origin.

---

## Security Notes

Implemented protections include:

- bcrypt password hashing
- JWT access/refresh authentication
- Separate JWT secrets
- Role-based authorization
- Protected frontend routes
- Global rate limiting
- Authentication-specific rate limiting
- Helmet
- HPP
- CORS
- Request validation
- Email validation for password recovery
- Hashed password-reset OTPs
- Five-minute OTP expiry
- Profile-picture MIME validation
- Profile-picture size restriction
- Mongoose validation
- Unique database indexes
- Centralized application errors
- Refresh-token invalidation on logout/password reset

### Rate limiting

Authentication-related endpoints use the dedicated authentication limiter, including:

- `/login`
- `/forgot-password`
- `/verify-reset-otp`
- `/reset-password`

A global rate limiter is also applied at the application level.

---

## Business Rules

### Company Weekend

```text
Friday
Saturday
```

### Paid Leave Types

```text
CASUAL
SICK
EARNED
```

### Overtime

```text
Overtime multiplier = 1.5×
Default shift hours = 8
```

### Attendance

For employee attendance calculations:

```text
PRESENT   → Present
LATE      → Present for attendance-rate purposes
ON_LEAVE  → Present for attendance-rate purposes
HOLIDAY   → Non-working day
WEEKEND   → Non-working day
ABSENT    → Absence
NOT_JOINED → Excluded from attendance
```

Public holiday dates are recognized across the attendance calendar/dashboard logic so declared holidays are not incorrectly displayed as absent days.

---

## Error Handling

The backend uses:

- `AppError` for application-specific errors
- `asyncHandler` for asynchronous controller handling
- Centralized `errorMiddleware`
- Request validation middleware
- Frontend API error handling through `getApiError`

This keeps validation and API error responses consistent across the application.

---

## Important Notes

- The application currently has only `ADMIN` and `EMPLOYEE` roles.
- Friday and Saturday are configured as company weekends.
- Payroll generation creates a monthly payroll record and associated payslips inside a MongoDB transaction.
- Public holidays can span multiple dates.
- Public holidays are reflected in employee attendance calendars and dashboard calculations.
- Profile images are stored through Cloudinary rather than the local filesystem.
- Password-reset emails are sent through Resend.
- The repository does not include a separate automated test suite; the backend `test` script is currently a placeholder.

---

## License

This project is licensed under the **ISC License**.

See the [`LICENSE`](LICENSE) file for details.
