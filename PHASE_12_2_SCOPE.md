# Phase 12.2 Scope Definition (Expanded)

**Status:** CLOSED / AUDITED
**Date:** Jan 07, 2026

---

## ✅ Completed Scope (Production Grade)
The following components meet the Definition of Done (DoD) for Phase 12.2:

### 1. Dashboard Module (Core)
- **WP2.1 KPI Cards**: Role-based visibility (Owner/Manager/Staff) with proper data shaping.
- **WP2.2 Charts Panels**: Role-based charts (Sales/Inventory) with sensitive data filtering.
- **WP2.3 Transactions Table**: Compact table with role-based row/column filtering.
- **WP2.4 Visual Hierarchy**: Optimized for 1366x768 resolution.
- **Service Layer**: Logic contained in `src/services/dashboard/shape*ByRole.js`.

---

## 🚧 Skeleton Scope (Mock Only)
The following modules were added as **UI Skeletons** to establish Information Architecture (IA). They contain **NO** real business logic or backend integration.

### 1. Products Module
- **Status**: Mock Data Display
- **Features**: Type Badges (Product/Material/Consumable), Basic Filter
- **Excluded**: CRUD operations, Real Stock Management

### 2. Work Orders Module
- **Status**: Mock Data Display
- **Features**: List View (Production/Service), Mock Items
- **Excluded**: Material Issuance Logic, Status Workflow

### 3. Tools Room Module
- **Status**: Mock Data Display
- **Features**: Table View, Mock Asset Tracking
- **Excluded**: Check-in/Check-out Logic, Depreciation Calculation (Real-time)

### 4. Purchasing Module
- **Status**: Mock Data Display
- **Features**: PO List View
- **Excluded**: PO Creation, Approval Workflow, Goods Receipt Logic

---

## 🚫 Explicit Exclusions (Scope Creep Guard)
The following are **STRICTLY PROHIBITED** in this phase and deferred to Phase 13.x:
1.  **Backend Integration**: No API calls to real database.
2.  **Complex Business Logic**: No inventory deduction, no financial calculations outside Dashboard.
3.  **CRUD Operations**: No Create/Update/Delete functionality for any module.
4.  **Authentication**: No real JWT auth (Mock Role Selector only).

---

## ⏭️ Next Phase: Phase 13.x (Module Implementation)
- **13.1**: Implement Work Order Logic (Material Issuance)
- **13.2**: Implement Purchasing Workflow (PO -> GR)
- **13.3**: Implement Tools Tracking Logic (Check-in/out)
