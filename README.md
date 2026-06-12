# Role-Based Ticket Management System (RBTM)

A full-stack MERN support ticket system with role-based access control, built with React, Redux Toolkit, Node.js, Express, and MongoDB. Features JWT authentication, real-time attachment uploads via Cloudinary, audit logging, and a clean glassmorphism UI.

## Live Demo

| | URL |
|---|---|
| **Frontend** | https://role-based-ticket-management-rbtm.vercel.app |
| **Backend API** | https://role-based-ticket-management-rbtm-production.up.railway.app |

## Test Credentials

| Role  | Email             | Password    |
|-------|-------------------|-------------|
| Admin | admin@rbtm.com    | admin123    |
| Agent | agent@rbtm.com    | Agent@123   |
| User  | user@rbtm.com     | user123     |

> No local setup required. Open the frontend URL, log in with any of the credentials above, and explore the system.

---

## Features

### Role-Based Access
- **Admin** — full dashboard with system statistics, manage all tickets, assign tickets to agents, manage users (view, activate/deactivate, change role), delete tickets
- **Agent** — dedicated workspace for assigned tickets, update ticket status, add comments, upload attachments
- **User** — create tickets, view own tickets, add comments, upload attachments

### Ticket Management
- Auto-generated ticket numbers (`TKT-0001`, `TKT-0002`, ...)
- Categories: Bug, Feature Request, Technical Issue, Payment Issue, Account Issue, Other
- Priority levels: Low, Medium, High, Urgent
- Status workflow: Open → In Progress → Resolved → Closed
- Full status history with notes and timestamps
- Comments thread on every ticket
- File attachments via Cloudinary with real-time SSE status updates

### Dashboard
- Ticket count cards (total, open, in progress, resolved, closed)
- Status distribution pie chart and priority bar chart
- Admin extras: tickets created today, this week, unassigned open tickets, overdue tickets, recent activity feed

### Other
- Debounced search, multi-field filters (status, priority, category), sortable columns, pagination
- Audit log for every action (ticket created, updated, assigned, commented, deleted)
- Rate limiting on auth and general API endpoints
- MongoDB query sanitisation, Helmet security headers

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Redux Toolkit, Axios, React Router, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| File storage | Cloudinary |
| Deployment | Vercel (frontend), Railway (backend) |

---

## Local Setup

### Prerequisites
- Node.js 18+
- A MongoDB Atlas connection string
- A Cloudinary account (for file attachments)

### Step 1 — Clone the repository

```bash
git clone https://github.com/Chagana-Balachandran-05/Role-Based-Ticket-Management-RBTM.git
cd Role-Based-Ticket-Management-RBTM
```

### Step 2 — Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Cloudinary (required for file attachments)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 3 — Configure frontend environment

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### Step 4 — Install dependencies and seed the database

```bash
# Backend
cd ../backend
npm install
npm run seed

# Frontend
cd ../frontend
npm install
```

### Step 5 — Run the applications

```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

---

## Running Tests

```bash
cd backend
npm test
```

Integration tests use Jest and `mongodb-memory-server`. Covers the full auth lifecycle and ticket CRUD operations.

---

## API Summary

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register a new user (role defaults to User) |
| POST | `/login` | Public | Log in and receive a JWT |
| GET | `/me` | Protected | Get current user profile |

### Tickets — `/api/tickets`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | All roles | List tickets (scoped by role) with search, filter, sort, pagination |
| POST | `/` | Admin, User | Create a new ticket (supports file attachments) |
| GET | `/:id` | All roles | Get a single ticket with comments, status history, attachments |
| PUT | `/:id` | Admin, Agent | Update ticket fields |
| DELETE | `/:id` | Admin | Delete a ticket |
| PATCH | `/:id/status` | Admin, Agent | Update ticket status with a note |
| PATCH | `/:id/assign` | Admin | Assign ticket to an agent |
| POST | `/:id/comments` | All roles | Add a comment |
| POST | `/:id/attachments` | All roles | Upload file attachments |
| DELETE | `/:id/attachments/:attachmentId` | All roles | Delete an attachment |

### Users — `/api/users`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Admin | List all users with pagination |
| GET | `/agents` | Admin | List users with Agent role |
| GET | `/:id` | Admin | Get a user by ID |
| PUT | `/:id` | Admin | Update user details |
| DELETE | `/:id` | Admin | Delete a user |
| PATCH | `/:id/role` | Admin | Change a user's role |
| PATCH | `/:id/status` | Admin | Activate or deactivate a user |
| PATCH | `/me/profile` | Protected | Update own profile |
| PATCH | `/me/password` | Protected | Change own password |

### Dashboard — `/api/dashboard`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/stats` | Protected | Ticket statistics scoped to the logged-in user's role |

### Audit Logs — `/api/audit-logs`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Admin | Paginated audit log of all system actions |

---

## Deployment Configuration

### Backend (Railway)
- `railway.toml` is included at `backend/railway.toml`
- Set all environment variables in Railway project settings
- `FRONTEND_URL` must be set to your Vercel URL for CORS to work

### Frontend (Vercel)
- `vercel.json` handles SPA routing rewrites
- Set `VITE_API_URL` to your Railway backend URL in Vercel project settings

---

## Known Limitations

- **No refresh tokens** — JWT expires after 7 days. The user must log in again after expiry.
- **Stateless sessions** — tokens are stored in `localStorage` and cannot be invalidated server-side before expiry.
- **No email notifications** — ticket assignment and status update events do not send emails.