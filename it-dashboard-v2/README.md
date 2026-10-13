# IT Operations Dashboard v2 🚀

A modern, full-stack IT Management & Asset Control System migrated from MERN to:
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Backend API:** Express.js, TypeScript, RESTful Architecture, JWT Authentication
- **Database ORM:** Prisma ORM with PostgreSQL
- **Design:** Modern dark/light glassmorphic UI, responsive telemetry cards

---

## 📁 Project Architecture

```
it-dashboard-v2/
├── client/                     # Next.js App Router (TypeScript + Tailwind CSS)
│   ├── src/
│   │   ├── app/                # Pages (Dashboard, Employees, Computers, Servers, Slips, Reports, Settings, Login)
│   │   ├── components/         # Layout components (Sidebar, Header, ThemeProvider, DashboardShell)
│   │   ├── context/            # AuthContext (JWT session management)
│   │   └── lib/                # API client (Axios) & utility helpers
│   ├── next.config.mjs         # Automatic API proxy to backend (:5000)
│   ├── tailwind.config.ts
│   └── package.json
│
├── server/                     # Express.js API Server (TypeScript + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma       # Full PostgreSQL database schema & enums
│   │   └── seed.ts             # Initial seeding script (Super Admin, IT team, servers, assets)
│   ├── src/
│   │   ├── controllers/        # Modular business logic controllers
│   │   ├── routes/             # Express API routes
│   │   ├── middleware/         # JWT authentication & role-based access control
│   │   └── lib/prisma.ts       # Prisma Client singleton
│   ├── tsconfig.json
│   └── package.json
│
└── package.json                # Root orchestration scripts to run both servers concurrently
```

---

## ⚡ Quick Start Guide

### 1. Configure PostgreSQL Connection
Open `server/.env` and update `DATABASE_URL` with your PostgreSQL database URL (e.g. from Neon, Supabase, Render, or a local PostgreSQL instance):

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME?sslmode=require"
JWT_SECRET="your-secure-jwt-secret"
PORT=5000
```

### 2. Install Dependencies
In the `it-dashboard-v2` directory:
```bash
# Install root orchestrator dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Generate Prisma Client & Push Database Schema
From the `server` directory:
```bash
# Generate the Prisma client
npx prisma generate

# Push the schema to your PostgreSQL database
npx prisma db push

# (Optional) Seed the database with default Super Admin and initial assets
npm run seed
```

### 4. Run Both Client & Server Concurrently
From the root `it-dashboard-v2` folder:
```bash
npm run dev
```

- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Default Login Credentials

After running `npm run seed`:
- **Username:** `omith.hasan`
- **Password:** `Welcome@123`
- **Role:** Super Admin
