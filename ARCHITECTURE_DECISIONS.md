# Architecture Decisions Log (ADL)

This document records significant architectural decisions, their context, and the reasoning behind them.

---

## ADR-001: Dashboard Logic Centralization
**Date:** Jan 07, 2026
**Status:** Accepted

### Context
The Dashboard needs to display sensitive financial data (Revenue, Profit) which must be strictly filtered based on user roles (Owner/Manager/Staff).

### Decision
We decided to centralize all dashboard data shaping logic in dedicated service files:
- `src/services/dashboard/shapeKpisByRole.js`
- `src/services/dashboard/shapeChartsByRole.js`
- `src/services/dashboard/shapeTransactionsByRole.js`

### Reasoning
1.  **Security**: Ensures sensitive fields are removed *before* reaching the UI component.
2.  **Maintainability**: Business logic is separated from presentation logic.
3.  **Testability**: Pure functions in service layer are easier to unit test than React components.

---

## ADR-002: Skeleton-First Approach for New Modules
**Date:** Jan 07, 2026
**Status:** Accepted

### Context
The project scope expanded to include new modules (Purchasing, Tools, Work Orders) during Phase 12.2, which was primarily focused on the Dashboard.

### Decision
We implemented these new modules as **UI Skeletons** (Mock Data Only) without complex business logic or CRUD operations.

### Reasoning
1.  **Scope Control**: Prevents "Scope Creep" by establishing the Information Architecture (IA) without getting bogged down in implementation details.
2.  **Focus**: Allows the team to focus on perfecting the Dashboard (Core Requirement) while still showing progress on the broader system.
3.  **Safety**: Reduces the risk of introducing bugs in the core system by keeping new modules isolated and simple.

---

## ADR-003: Role-Based Access Control (RBAC) via Context
**Date:** Jan 07, 2026
**Status:** Accepted

### Context
The application requires dynamic permission checking across multiple components (Sidebar, Routes, Widgets).

### Decision
We implemented a `RoleContext` and `RoleGuard` component to manage user roles and permissions globally.

### Reasoning
1.  **DX**: Provides a simple hook (`useRole`) for components to access current role state.
2.  **Flexibility**: Allows for easy switching of roles during development/testing.
3.  **Scalability**: Can be easily integrated with a real Authentication Provider (JWT) in the future.
