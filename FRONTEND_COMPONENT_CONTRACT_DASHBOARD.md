# FRONTEND_COMPONENT_CONTRACT_DASHBOARD.md
Smart ERP — Frontend Component Contract (Dashboard)
Status: **Authoritative / Do-not-drift**
Owner: Project Lead (P Hot)
Applies to: React + Tailwind + Recharts + Lucide/Heroicons

---

## 0) Non-Negotiable Rules (Hard Constraints)
1. **No business logic in UI components.**
   - UI components render only.
   - All role-based decisions must be done via:
     - `RoleGuard` (visibility) and/or
     - `data access layer / selectors` (data shaping)
2. **Every dashboard component must support role-based behavior.**
   - Always receive `userRole` (directly or through context).
3. **No hardcoded demo data.**
   - All dashboard widgets must accept data via props from API layer.
4. **Dashboard is Overview only.**
   - No complex forms, no catalogs, no full lists.
5. **Enterprise clarity > visual flair.**
   - Minimal motion, minimal color noise, fixed layout priorities.
6. **Data security principle**
   - Sensitive financial data: Owner only.
   - Staff: task-only + assigned-only data.

---

## 1) Role Model (UI-Level Expectations)
- **Owner/Executive**: Strategic + Operational + Financial (full access)
- **Manager/Operations**: Operational + Limited financial context
- **Staff/Daily**: Task-only, assigned-only

Role permission must be enforced at:
- **Visibility layer** (component show/hide) AND
- **Data layer** (filter fields + filter rows)

---

## 2) Core Layout Components (Reusable)
### 2.1 AppLayout (HIGH reuse)
**Responsibility:** Main layout shell (sidebar + topbar + content)
- Props: `userRole`, `currentPage`, `children`
- Children: `Sidebar`, `TopBar`, `<main/>`
- Notes:
  - Must be stable across roles (layout does not shift unpredictably)

### 2.2 Sidebar (HIGH reuse)
**Responsibility:** Navigation menu (collapsible)
- Props: `userRole`, `currentPage`, `menuItems[]`
- Role behavior:
  - Menu items vary by role, but sidebar component is shared.

### 2.3 TopBar (HIGH reuse)
**Responsibility:** Search + Notifications + User Profile
- Props: `userRole`, `userName`, `notifications[]`
- Notes:
  - Search is optional (feature-flag ready), but layout slot remains.

---

## 3) Dashboard Page Orchestrator
### 3.1 DashboardPage (SPECIFIC)
**Responsibility:** Orchestrate dashboard sections by role.
- Props: `userRole`
- Children:
  - `KPISection`
  - `ChartsSection`
  - `TransactionSection`
- Must NOT:
  - compute KPI values
  - compute chart series
  - compute row-level permission logic

✅ Allowed: choose *which* blocks appear for each role (via `RoleGuard`).

---

## 4) Dashboard Sections (Reusable Containers)
### 4.1 KPISection (MEDIUM reuse)
**Responsibility:** Layout container for KPI cards.
- Props:
  - `userRole`
  - `kpiData` (already shaped by role)
  - `cardsConfig[]` (optional)

### 4.2 ChartsSection (MEDIUM reuse)
**Responsibility:** Layout container for charts.
- Props:
  - `userRole`
  - `chartsData` (already shaped)
  - `chartsConfig[]`

### 4.3 TransactionSection (MEDIUM reuse)
**Responsibility:** Layout container for recent transactions.
- Props:
  - `userRole`
  - `transactions` (already role-filtered)

---

## 5) KPI Cards (Widget Components)
### 5.1 KPICard (Base) (HIGH reuse)
**Responsibility:** Generic KPI presentation.
- Props:
  - `title`
  - `value`
  - `trend` (optional)
  - `unit` (optional)
  - `status` (optional: good/warn/bad for UX)
  - `onClick` (optional: link to details page)
- Must NOT:
  - fetch data
  - filter by role
  - compute trend

### 5.2 RevenueCard (LOW–MED reuse)
**Responsibility:** Total Revenue KPI wrapper around `KPICard`.
- Visibility:
  - Owner ✅
  - Manager ✅ (limited context is a data-layer decision)
  - Staff ❌
- Props:
  - `data` (already role-shaped)

### 5.3 ProfitCard (SPECIFIC)
**Responsibility:** Net Profit KPI wrapper around `KPICard`.
- Visibility:
  - Owner ✅
  - Manager ❌
  - Staff ❌
- Props:
  - `data` (owner-only)

### 5.4 OrdersCard (LOW–MED reuse)
**Responsibility:** Active Orders KPI wrapper.
- Visibility: all roles ✅
- Props:
  - `data` (role-shaped; staff sees assigned subset)

### 5.5 CustomersCard (LOW–MED reuse)
**Responsibility:** New Customers KPI wrapper.
- Visibility:
  - Owner ✅
  - Manager ✅
  - Staff ❌

---

## 6) Charts (Widget Components)
### 6.1 SalesRevenueChart (LOW reuse)
**Responsibility:** Trend visualization.
- Visibility:
  - Owner ✅
  - Manager ✅
  - Staff ❌
- Props:
  - `series[]` (precomputed)
  - `timeRange` (optional)
- Notes:
  - Any time-range selector must be simple (no multi-complex filters).

### 6.2 InventoryChart (LOW–MED reuse)
**Responsibility:** Inventory status overview.
- Visibility: all roles ✅
- Props:
  - `series[]` (precomputed)
- Role shaping examples:
  - Staff: show only relevant categories (near-out/available), not valuation.

---

## 7) Transactions (Widget Components)
### 7.1 TransactionTable (MEDIUM reuse)
**Responsibility:** Table for "Recent Business Transactions".
- Props:
  - `rows[]` (already role-filtered)
  - `columnsConfig[]`
  - `onRowClick` (link to detail)
- Visibility:
  - Owner ✅ all transactions
  - Manager ✅ operational transactions
  - Staff ✅ assigned only
- Must NOT:
  - perform permission filtering (done upstream)

---

## 8) Permission & Data Access Infrastructure (MANDATORY)
### 8.1 RoleGuard (HIGH reuse)
**Responsibility:** Conditional rendering by role (visibility layer).
- Props:
  - `userRole`
  - `allowedRoles[]`
  - `children`
- Behavior:
  - Render children only if role allowed.
  - No side effects.

### 8.2 Data Shaping (Replace "DataFilter" component with a Data Layer)
**Hard Rule:** Do NOT implement permission filtering as a UI component.
Instead implement:
- `selectors/` or `services/` functions, e.g.
  - `shapeDashboardKpisByRole(raw, role)`
  - `shapeDashboardChartsByRole(raw, role)`
  - `shapeTransactionsByRole(raw, role)`

Reason:
- Role-based filtering is business/security logic.
- Must be testable, reusable, and not tied to rendering.

✅ UI receives **already shaped** props.

---

## 9) Async & Resilience
### 9.1 LoadingState (MEDIUM reuse)
**Responsibility:** Skeleton/placeholder
- Props: `variant`, `count`, `isLoading`

### 9.2 ErrorBoundary (HIGH reuse)
**Responsibility:** UI-safe failure mode
- Props: `fallback`, `error`

---

## 10) Role-to-Widget Matrix (Source of Truth)
### Owner/Executive
- KPI: Revenue ✅ Profit ✅ Active Orders ✅ New Customers ✅
- Charts: Sales Trend ✅ Inventory Overview ✅
- Table: Recent Transactions ✅ (all)

### Manager/Operations
- KPI: Active Orders ✅ New Customers ✅ Revenue ✅ (limited) Profit ❌
- Charts: Sales Trend ✅ Inventory Overview ✅
- Table: Recent Transactions ✅ (operational only)

### Staff/Daily
- KPI: Active Orders ✅ only
- Charts: Inventory Overview ✅ only
- Table: Recent Transactions ✅ (assigned only)

---

## 11) Implementation Notes (Guardrails)
- Dashboard layout order is fixed:
  1) KPI (top)
  2) Charts (middle)
  3) Transactions (bottom)
- Avoid adding new widgets unless:
  - Business rationale is explicit
  - Role matrix is updated
  - API contract exists
- Any "new widget request" must answer:
  - Which role?
  - Which decision does it improve?
  - Why is it on Dashboard vs module page?

---

## 12) What Claude Must Do Next
1. Create file/folder structure for components:
   - `components/layout/`
   - `components/dashboard/`
   - `components/widgets/`
   - `services/dashboard/` (data shaping)
2. Implement **DashboardPage** that renders based on RoleGuard.
3. Implement shaping functions in `services/dashboard/` and unit-test them.
4. Keep UI minimal and production-grade.

End.