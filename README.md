# Role-Based Ticket Management System

An enterprise-grade, full-stack support ticket system built with Node.js/Express/TypeScript on the backend and React/Redux Toolkit/TypeScript on the frontend. Features secure role-based access control, real-time-like updates, status history logs, and performance-optimized state management.

## Key Features
- **Strict Role Isolation**: Administrative dashboards, Agent workflows with status/comment/assignment updates, and standard User ticket submission.
- **Security Protocols**: Sanitized MongoDB queries, JSON Web Token (JWT) authorization, request rate limiters, and backend-enforced role registration validation.
- **Modern Forms & State**: Form inputs managed with `react-hook-form` and global UI toast notifications.
- **Test Suite**: Automated integration testing for authentication and ticket lifecycle with in-memory Mongo databases.

## Test Credentials
The database seeds with the following test accounts:
| Role  | Email           | Password  |
|-------|----------------|-----------|
| Admin | admin@rbtm.com | Admin@123 |
| Agent | agent@rbtm.com | Agent@123 |
| User  | user@rbtm.com  | User@123  |

## Local Setup

### Step 1: Configure Environment Files
Before running the applications, copy the `.env.example` templates to `.env` in both the backend and frontend folders.

#### Backend Configuration
Copy `backend/.env.example` to `backend/.env`:
```bash
cd backend
cp .env.example .env
```
Ensure the following variables are defined in `backend/.env`:
- `PORT`: Server port (default `5000`)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key used to sign tokens
- `JWT_EXPIRES_IN`: JWT expiration length (e.g., `7d`)
- `FRONTEND_URL`: URL of the frontend application (default `http://localhost:5173`)
- `NODE_ENV`: Application environment (`development`, `production`, or `test`)

#### Frontend Configuration
Copy `frontend/.env.example` to `frontend/.env`:
```bash
cd frontend
cp .env.example .env
```
Ensure the following variable is defined in `frontend/.env`:
- `VITE_API_URL`: URL pointing to the backend API (default `http://localhost:5000/api`)

### Step 2: Install Dependencies and Seed Database
Run the following commands to install packages and populate the database with initial users and tickets.

#### Backend
```bash
cd backend
npm install
npm run seed
```

#### Frontend
```bash
cd frontend
npm install
```

### Step 3: Run the Applications

#### Running Backend
To start the backend in development mode with hot-reloading:
```bash
cd backend
npm run dev
```
The server will run on `http://localhost:5000`.

#### Running Frontend
To start the frontend dev server:
```bash
cd frontend
npm run dev
```
The client will run on `http://localhost:5173`.

## Testing
To run the automated integration tests using Jest and `mongodb-memory-server`:
```bash
cd backend
npm test
```

## Known Limitations
- **Token Expiration & Session Flow**: The system issues a JSON Web Token (JWT) with a defined expiration (e.g., `7d`). Currently, there is no refresh token mechanism implemented. Once the access token expires, the client-side session ends, and the user must re-authenticate.
- **Single-device Sessions**: Since tokens are stateless and stored client-side in local storage, active sessions cannot be terminated or invalidated from the backend before token expiration.

## API Summary
* **POST**   `/api/auth/register` - Registers a new user (role defaults to `User`)
* **POST**   `/api/auth/login` - Authenticates a user and returns a token
* **GET**    `/api/auth/me` - Retrieves current logged-in user profile
* **GET**    `/api/tickets` - Retrieves tickets (isolated by creator for Users, filtered/assigned for Agents/Admins)
* **POST**   `/api/tickets` - Submits a new ticket
* **GET**    `/api/tickets/:id` - Details of a single ticket
* **PUT**    `/api/tickets/:id` - Updates ticket properties (restricted fields)
* **DELETE** `/api/tickets/:id` - Deletes a ticket (restricted to creator/admin)
* **PATCH**  `/api/tickets/:id/status` - Updates ticket status (restricted to Agent/Admin)
* **PATCH**  `/api/tickets/:id/assign` - Assigns ticket to an agent (restricted to Agent/Admin)
* **POST**   `/api/tickets/:id/comments` - Adds comment to a ticket
* **GET**    `/api/users` - Paginated users directory (Admin only)
* **GET**    `/api/users/:id` - Retrieves user details
* **PUT**    `/api/users/:id` - Updates user profile details
* **DELETE** `/api/users/:id` - Deletes user (Admin only)
* **GET**    `/api/dashboard/stats` - Analytics dashboard metrics (Admin only)