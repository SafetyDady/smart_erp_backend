# 🚀 Smart ERP - Project Handoff Documentation

**Date:** Jan 07, 2026
**Status:** Phase 1 Complete (Frontend Prototype & Logic)
**Version:** 1.0.0

---

## 📋 System Overview
Smart ERP is a comprehensive Enterprise Resource Planning system designed for SME businesses, featuring a modern glassmorphic UI and strict Role-Based Access Control (RBAC).

### 🔑 User Roles
1. **Owner**: Full access to all modules, including Financials and Salaries.
2. **Manager**: Operational access, restricted from Financials and Salary data.
3. **Staff**: Limited access to specific operational tasks (Orders, Inventory View).

---

## 🧩 Modules & Features

| Module | Icon | Description | Key Features |
| :--- | :--- | :--- | :--- |
| **Dashboard** | 📊 | Business Overview | Role-based widgets, Real-time stats |
| **Products** | 📦 | Inventory Master | Types: `Product`, `Material`, `Consumable` |
| **Orders** | 🛒 | Sales Management | Staff sees only their own orders |
| **Work Orders** | 📋 | Job Management | `Production` (Make) vs `Service` (Use) |
| **Tools Room** | 🔧 | Asset Tracking | Check-in/out, Depreciation, Status Tracking |
| **Purchasing** | 🚚 | Procurement | PO Management (Pending -> Received) |
| **Customers** | 👥 | CRM | Customer database (Staff restricted) |
| **Financial** | 💰 | Accounting | Revenue/Expense (Owner Only) |
| **HR** | 👔 | Employee Mgmt | Salary visibility control (Owner Only) |

---

## 🛠️ Technical Stack
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS (Glassmorphism Design System)
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React Context (RoleContext)
- **Routing**: Custom Switch-Case Routing (in `App.jsx`)

---

## 📂 Key File Structure
```
frontend/src/
├── components/
│   ├── guards/         # RoleGuard & RoleContext
│   ├── layout/         # Sidebar, TopBar, AppLayout
├── pages/
│   ├── DashboardPage.jsx
│   ├── ProductsPage.jsx    # Inventory with Types
│   ├── WorkOrdersPage.jsx  # Production & Service Jobs
│   ├── ToolsPage.jsx       # Asset Tracking
│   ├── PurchasingPage.jsx  # PO Management
│   ├── HRPage.jsx          # Employee Mgmt
│   └── ...
├── services/
│   ├── roles.js            # Permission Definitions
│   └── inventory/          # Data Shaping Logic
└── App.jsx                 # Main Routing Logic
```

---

## 🚀 How to Run
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

---

## 🔮 Future Roadmap (Next Steps)
1. **Backend Integration**: Connect to a real database (PostgreSQL/MongoDB).
2. **Authentication**: Replace mock role selector with real JWT Auth.
3. **Real-time Stock**: Link `Work Orders` and `Purchasing` to automatically update `Products` stock levels.
4. **Reporting**: Generate PDF reports for POs and Invoices.

---

**Note to Dev Team:**
The current system uses **Mock Data** and **Service Layer Logic** (`shapeXByRole.js`) to simulate a real ERP environment. When integrating the backend, ensure the API returns data structures consistent with the mock data to maintain UI compatibility.
