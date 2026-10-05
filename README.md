# Jiya Financial Services — Mutual Fund Sales & Commission Portal

A modern, production-ready, full-stack Next.js 14 web application designed for mutual fund distribution firms, managing agents, clients, investments, and commission calculations with precision and enterprise-grade security.

---

## 🚀 Key Features

- **Full-Stack Next.js 14 (App Router)**: Hybrid architecture with server-side rendered authentication gating and client-side interactive dashboards.
- **Enterprise Role-Based Access Control (RBAC)**:
  - **Admin**: Full access across all modules, including employee management (create, reset password, delete), master password changes, and complete database backup/restore.
  - **Employee**: Scoped access restricted to viewing the dashboard, registering clients/agents, and recording investments.
- **Production-Grade Security**:
  - Passwords hashed using `bcryptjs` with 10 salt rounds.
  - Stateless signed JWT session cookies (`jose`) with HS256 algorithm, HTTP-only, SameSite=lax, and 7-day expiration.
  - Server-side route handler authorization guards (`requirePermission`, `requireRole`).
- **Comprehensive Financial Commission Engine**:
  - Exact preservation of mutual fund commission mathematics across all 4 investment types:
    - **SIP** (Systematic Investment Plan)
    - **Lumpsum**
    - **Change of Broker** (COB)
    - **Switch**
  - Per-agent custom commission rate matrices with seamless single-rate legacy fallback.
  - Real-time client-to-agent mapping with instant dynamic commission computation preview.
- **Reporting & Statements**:
  - Filterable sales dashboard (by Agent, Investment Type, Year, and Month).
  - One-click CSV export of transaction tables.
  - Printable **Month-End Agent Slip** with summary cards and detailed breakdown.
  - Single-click WhatsApp summary generator for immediate agent notifications.
- **Data Persistence & Backups**:
  - Persistent MongoDB database backed by indexed Mongoose models.
  - Auto-seeding on first boot ensuring default data is immediately available.
  - Full JSON backup and restore capabilities for disaster recovery.
- **100% Strict Type Safety & Quality**:
  - Strict TypeScript mode enabled across all layers.
  - Zod runtime schema validation on every API endpoint and client form.
  - TanStack React Query for caching, automatic background invalidation, and optimistic updates.
  - Comprehensive automated test suite using **Vitest**.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 14.2 (App Router, Server & Client Components) |
| **Language** | TypeScript (Strict mode) |
| **Styling & UI** | Tailwind CSS, shadcn/ui design primitives, Lucide React icons |
| **Database** | MongoDB with Mongoose ODM (Indexes, Connections Caching) |
| **Authentication** | `jose` (JWT), `bcryptjs` (Password Hashing), HTTP-only cookies |
| **Validation** | Zod (Client forms & API route validation) |
| **State Management** | TanStack React Query v5 |
| **Testing** | Vitest with JSDOM and Node test environments |
| **Notifications** | Sonner toast notifications |

---

## 📂 Project Architecture

```
jiya-financial-service/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/login/         # Branded login page
│   │   ├── api/                  # RESTful API route handlers
│   │   │   ├── agents/           # GET, POST, PUT, DELETE agents
│   │   │   ├── auth/             # Login, logout, me, change-password
│   │   │   ├── backup/           # Backup export & restore handlers
│   │   │   ├── clients/          # GET, POST, PUT, DELETE clients
│   │   │   ├── dashboard/        # Dashboard KPIs & aggregated stats
│   │   │   ├── employees/        # Admin employee management
│   │   │   ├── investments/      # Investment transaction operations
│   │   │   └── statement/        # Agent month-end slip generator
│   │   ├── globals.css           # Tailwind + shadcn CSS variables & print styles
│   │   ├── layout.tsx            # Root layout with QueryProvider & Toaster
│   │   └── page.tsx              # Protected dashboard home page
│   ├── components/               # React UI Components
│   │   ├── agents/               # AgentsTab (Agent registration & rates)
│   │   ├── clients/              # ClientsTab (Client registration & quick invest)
│   │   ├── dashboard/            # DashboardTab, StatsCards, Filters, TxTable
│   │   ├── employees/            # EmployeesTab (Admin user management)
│   │   ├── investments/          # NewInvestmentTab (Live commission calculation)
│   │   ├── layout/               # Header, AdminPasswordDialog, UserPill
│   │   ├── statements/           # StatementTab (Printable slip & WhatsApp share)
│   │   └── ui/                   # shadcn accessible primitives (Button, Card, Dialog, etc.)
│   ├── config/                   # Site config & default rates
│   ├── lib/
│   │   ├── auth/                 # JWT session & RBAC permissions matrix
│   │   ├── db/                   # MongoDB connection & Mongoose models (User, Agent, Client, Investment)
│   │   ├── services/             # Business & database service layer
│   │   ├── validations/          # Zod validation schemas
│   │   └── commission.ts         # Pure commission calculation & aggregation engine
│   ├── test/                     # Automated test suites
│   │   ├── auth.test.ts          # Authentication, JWT, and RBAC tests
│   │   ├── commission.test.ts    # Commission formula & aggregation tests
│   │   └── setup.ts              # Test setup and matchers
│   └── types/                    # Core TypeScript domain definitions
├── .env.example                  # Environment configuration template
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18.17.0 or later
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas URI

### 2. Installation
```bash
# Clone or navigate to the repository
cd jiya-financial-service

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
MONGODB_URI=mongodb://localhost:27017/jiya_financial
MONGODB_DB=jiya_financial
AUTH_SECRET=super_secret_jwt_key_at_least_32_characters_long_for_jiya_financial_service
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Credentials & Auto-Seeding

On first startup, the application connects to MongoDB and automatically seeds default accounts and initial records if the database is empty:

### Administrator
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `Admin` (Full permissions)

### Default Employee
- **Username**: `emp1`
- **Password**: `emp123`
- **Role**: `Employee` (Restricted permissions)

---

## 🧪 Testing & Verification

The project includes strict verification scripts for code quality, type correctness, and automated testing:

```bash
# Run automated Vitest unit tests (commission math, auth, RBAC, validations)
npm test

# Run TypeScript type check with strict compiler rules
npm run typecheck

# Run Next.js and ESLint code quality checks
npm run lint

# Compile production build
npm run build
```

---

## 📊 Commission Engine Specifications

Commissions are calculated with financial rounding (`roundTo2`):
$$\text{Commission} = \frac{\text{Amount} \times \text{Rate}}{100}$$

### Default Investment Type Rates:
- **SIP**: `1.5%`
- **Lumpsum**: `1.0%`
- **Change of Broker (COB)**: `0.5%`
- **Switch**: `0.5%`

Each agent can be assigned custom rates per investment type. If an agent has a legacy single-rate record (`agent.rate`), the system automatically applies it across all transaction types as a safe fallback.

---

## 🔒 RBAC Permission Matrix

| Operation | Admin | Employee |
|---|:---:|:---:|
| View Dashboard & Analytics | ✅ | ✅ |
| Record New Investment | ✅ | ✅ |
| Register Agents & Clients | ✅ | ✅ |
| View Month-End Agent Slips | ✅ | ✅ |
| Export Filtered CSV | ✅ | ✅ |
| Manage Employees (Create/Reset/Delete) | ✅ | ❌ |
| Change Administrator Master Password | ✅ | ❌ |
| Export / Restore Database Backups | ✅ | ❌ |

---

## 📦 Deployment

The application is fully optimized for deployment on Vercel, Docker, or any Node.js hosting platform:

```bash
# Build the production bundle
npm run build

# Start the production server
npm start
```

Ensure the environment variables (`MONGODB_URI`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`) are configured in your deployment environment settings.

---

## 📄 License
ISC © Jiya Financial Services
