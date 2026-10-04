# ASHWA Movie Property Rentals - Enterprise ERP Platform

South Asia’s premier cinematic prop rental platform managing 200,000+ movie props across two 30,000 sq.ft warehouse floors with real-time picking, serialized asset tracking, and live estimation billing.

---

## 🏛️ System Architecture & Core Modules

### 1. 📦 Warehouse Logistics & Serialized Inventory
- **2-Floor Godown & Rack Hierarchy**: Godown $\to$ Floor $\to$ Zone $\to$ Rack $\to$ Shelf tracking with visual heatmaps and tree navigation.
- **Serialized Asset Tracking**: Individual QR code identification for every physical prop unit with live condition logging (`PRISTINE`, `GOOD`, `MINOR_WEAR`, `DAMAGED`, `REPAIR_REQUIRED`).
- **Bulk QR Tag Generation**: Vector-grade QR sticker printing sheets with high-contrast cinema branding for thermal printers.

### 2. 🎬 Order Lifecycle & Live Walk-in Picking
- **Real-Time State Machine**: Guided progression across `DRAFT` $\to$ `CONFIRMED` $\to$ `PICKING` $\to$ `PACKED` $\to$ `DISPATCHED` $\to$ `RETURN_INSPECTION` $\to$ `SETTLED`.
- **In-Order Live QR Scanner**: Multi-executive simultaneous picking with sound effects, line-item rate estimation, and instant cart reconciliation.
- **Documents & Paperwork**: Automated 1-click generation of Tax Invoices, Delivery Challans, Gate Passes, and Loading Sheets.

### 3. 👥 Crew Hub & Field Operations
- **Field Deployments**: Real-time assignment of staff and technicians to shooting sets and external locations.
- **Attendance & Field Logs**: GPS & timestamped muster logs for daily operational tracking.
- **Labor Sheets & Wage Vouchers**: Dynamic labor expense settlement with approval workflows.
- **Incident & Damage Ticketing**: Instant photographic damage capture during set return inspections.

### 4. 🔒 Enterprise RBAC & Security Console
- **Role Clearance Boundaries**:
  - `super_admin`: Full system control, workforce identity management, session termination.
  - `admin`: Operations, inventory analytics, and order oversight.
  - `billing_manager` / `billing`: Invoices, deposits, financial settlements, and walk-in carts.
  - `rental_sales_exec`: Assigned order picking, prop rate lookup, and rack audits.
  - `crew_member`: Task checklists, deployment schedules, and damage logging.
  - `client`: External film studio portal for browsing catalog and submitting RFQs.
- **User Management Console (`/admin/users`)**: Direct credential provisioning, password resets, account suspension with immediate session invalidation, and audit-safe deletion protocols.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router + React 19)
- **Styling**: Tailwind CSS 4 with custom dark mode, glassmorphism, and gold accent tokens
- **Database & Auth**: [Supabase](https://supabase.com/) PostgreSQL with Row-Level Security (RLS) & Edge Functions
- **Hardware Integrations**: In-browser camera QR scanner via `html5-qrcode` & thermal QR label generators

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.x or 20.x
- npm or pnpm

### 2. Installation
```bash
git clone https://github.com/navyaa518-ctrl/vista.git
cd vista
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local` and add your Supabase credentials:
```bash
cp .env.example .env.local
```

### 4. Database Setup
Execute the migration scripts located in `supabase/migrations/` in chronological order against your Supabase project.

### 5. Running the Application
```bash
# Start local development server with Fast Refresh
npm run dev

# Or build for production
npm run build
npm start
```
Access the application at [http://localhost:3000](http://localhost:3000).

---

## 📄 License
Proprietary and Confidential. Copyright &copy; 2026 ASHWA Movie Property Rentals Ltd. All rights reserved.
