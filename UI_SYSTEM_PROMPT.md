# Smart ERP – Frontend UI System Prompt (Final Lock)

## Purpose
This document defines **non-negotiable UI/UX principles, structure, and constraints**
for the Smart ERP frontend system.

Any AI (Claude), developer, or contributor must follow this document strictly.
The goal is to build a **production-grade ERP UI**, not a demo or Dribbble-style mockup.

---

## Product Context
- System Type: **Enterprise / SME ERP**
- Usage Pattern: **Long-session usage (6–8+ hours/day)**
- Users:
  - Admin / Owner
  - Accounting
  - Inventory / Purchasing
  - Operations / Staff

The UI must prioritize **clarity, speed, and reliability** over visual effects.

---

## Design Philosophy (Must Follow)
- Enterprise-grade
- Clean, professional, modern
- Subtle glassmorphism (if used)
- Card-based layout
- High readability
- No flashy or distracting animations

❌ This is NOT a marketing website  
❌ This is NOT a creative portfolio UI  

---

## Layout Rules (Locked)
1. **Collapsible Sidebar (Left)**
   - Dashboard
   - Inventory
   - Sales
   - Purchasing
   - Accounting
   - HR
   - Settings

2. **Top Bar**
   - Global search
   - Notifications
   - User profile

3. **Main Content Area**
   - KPI cards (top)
   - Charts / analytics (middle)
   - Tables / transactions (bottom)

---

## Dashboard Structure (Required)
### KPI Cards
- Total Revenue
- Net Profit
- Active Orders
- New Customers

Rules:
- Must map to **realistic backend data**
- No fake or placeholder business logic
- Clear units and trends only

---

### Charts
- Sales Revenue (line or bar)
- Inventory Levels (bar)
- Time range selector (future-ready)

Rules:
- Simple, readable
- No over-layered datasets
- Optimized for business insight, not aesthetics

---

### Tables
- Recent Transactions
- Clear status indicators
- Pagination-ready
- Column-first clarity (Date, Type, Amount, Status)

---

## Technical Stack (Locked)
- Framework: **React**
- Styling: **Tailwind CSS**
- Charts: **Recharts**
- Icons: Heroicons / Lucide
- State management: simple (context or hooks)

---

## Critical UX Constraints (Must Follow)
- Prioritize usability over visual effects
- Glassmorphism must be subtle (background only)
- Dashboard must be usable on **1366x768 resolution**
- Avoid animations that slow down workflows
- Design for long-term daily usage
- Consistent spacing, typography, and color scale

---

## Backend Awareness (Important)
- UI must assume **real API integration**
- No hardcoded fake KPIs
- Components must be ready for async data loading
- Loading / empty states must be clean and minimal

---

## Component Generation Order (For AI / Claude)
1. App Layout (Shell)
2. Sidebar
3. Top Bar
4. Dashboard Page
5. KPI Card Component
6. Chart Components
7. Table Components

Do NOT jump ahead to advanced pages before Dashboard is solid.

---

## Success Criteria
A UI is considered successful if:
- A business owner understands system status in < 10 seconds
- An accounting user can work all day without visual fatigue
- New modules can be added without redesigning layout
- UI matches backend structure cleanly

---

## Final Reminder
This UI is the **foundation** of Smart ERP.
Bad UI decisions here will multiply costs later.

When in doubt:
➡️ Choose clarity over beauty  
➡️ Choose structure over creativity  
➡️ Choose business reality over mock data