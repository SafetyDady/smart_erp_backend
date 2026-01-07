# SMART ERP — SESSION HANDOFF (Phase 12.1 → Phase 12.2)
**Purpose:** ย้าย Session แบบละเอียดเพื่อให้ GPT/Claude/Manus รับช่วงต่อได้ทันที โดยไม่หลงบริบท และไม่ทำงานออกนอก "UI Constitution"

---

## 0) สถานะปัจจุบัน (Current Status)
- โปรเจกต์: **Smart ERP (Frontend)**
- โฟกัสปัจจุบัน: **UI/UX Dashboard + Role-based visibility**
- **Phase 12.1 (Foundation Setup)**: ✅ "ผ่าน" แล้วในเชิงโครงสร้าง/รันได้
- Dev server ล่าสุดที่ผู้ใช้เปิดดู: `http://localhost:5175` (เห็นหน้า Dashboard + Sidebar + TopBar ตามภาพ)
- UI direction ล่าสุด: **Clean Corporate / Glass-light (ไม่ blur หนัก)**, เน้นอ่านง่ายจริงแบบ ERP

> สรุป: ระบบ "ไม่พัง", Layout "ไม่ทับกัน", แต่ "Dashboard ยังโล่ง" ต้องเติม density/เนื้อหาใน Phase 12.2

---

## 1) Hard Constraints (ห้ามฝ่าฝืน)
อ้างอิงจาก `UI_SYSTEM_PROMPT.md` และข้อตกลงร่วม:
1. **Production-grade ERP UI** ไม่ใช่ demo/creative showcase
2. **Clarity > Beauty** อ่านง่ายสำคัญสุด
3. Layout fixed: **Sidebar (ซ้าย) + TopBar + Main content**
4. **1366×768 compatible** (จอ laptop office) ต้องใช้งานได้ ไม่ต้อง scroll เพื่อ "เข้าใจภาพรวม"
5. Tech stack UI: **React + Tailwind** (Chart ใช้ Recharts ได้)
6. **No flashy animations** (ห้าม effect รบกวนงาน)
7. **No business logic ใน UI components**
8. Role-based security: **UI visibility + Data filtering** ต้องคงไว้
9. **ห้ามรื้อโครง Phase 12.1** ถ้าไม่มีเหตุจำเป็น (Phase 12.2 คือ "เติมเนื้อ" ไม่ใช่ "รื้อโครง")

---

## 2) โครงสร้าง Frontend ที่ใช้อยู่ (ยืนยัน baseline)
> โครงสร้างนี้สำคัญเพื่อกัน Claude/Manus ไปสร้างไฟล์ใหม่มั่ว ๆ

`frontend/src/`
- `App.jsx`, `main.jsx`
- `components/`
  - `common/` (`ErrorBoundary.jsx`, `LoadingState.jsx`)
  - `dashboard/` (`KPISection.jsx`, `ChartsSection.jsx`, `TransactionSection.jsx`)
  - `guards/` (`RoleContext.jsx`, `RoleGuard.jsx`)
  - `layout/` (`AppLayout.jsx`, `Sidebar.jsx`, `TopBar.jsx`)
- `config/api.js`
- `pages/DashboardPage.jsx`
- `services/`
  - `roleService.js`
  - `dashboard/shapeKpisByRole.js`
  - `dashboard/shapeChartsByRole.js`
  - `dashboard/shapeTransactionsByRole.js`
- `styles/globals.css`
- `types/roles.js`

**หมายเหตุ:** ตอนแรกมีความเสี่ยงเรื่อง `Layout.tsx` ไฟล์รวม (TypeScript) แต่สถานะล่าสุดคือแยกไฟล์แล้วเป็น JS ตาม contract (layout folder)

---

## 3) ผลการ Audit จากภาพล่าสุด (localhost:5175)
### ผ่านแล้ว (PASS)
- Layout integrity: Sidebar/TopBar ไม่ทับ main
- ไม่มี horizontal scroll / responsive ใช้ได้
- 1366×768: ภาพรวมเห็นครบ (แม้ยังโล่ง)
- Corporate tone: เบา อ่านง่าย ไม่ glass หนัก

### ยังไม่ผ่านเต็ม (NEEDS IMPROVEMENT)
- Dashboard "โล่งเกินไป" สำหรับ ERP จริง
- KPI/Charts/Transactions ยังเป็นหัวข้อ + placeholder มากไป
- Information hierarchy ยังไม่ชัด (KPI ควรเด่น, Table ควรเป็นพื้นที่ควบคุมงาน)

**สรุปคำตัดสิน:**  
- **Phase 12.1 = ปิดได้** ✅  
- เข้าสู่ **Phase 12.2 = เพิ่ม "Business Density + Visual Hierarchy"** ทันที

---

## 4) เป้าหมาย Phase 12.2 (Definition)
ทำให้ Dashboard "ดูและใช้งานเหมือน ERP จริง" โดย:
- ยังไม่แตะ backend integration (ทำได้ด้วย mock data/placeholder แบบมีโครงสร้าง)
- เน้น **density**, **component completeness**, **table usability**, **role visibility**

### Outcome ที่ต้องการ:
Owner/Manager/Staff เข้า dashboard แล้ว "เข้าใจสถานการณ์" ได้ใน 10 วินาที
- Owner: เห็น KPI+Charts+Transactions ครบ
- Manager: เห็น operational + revenue (limited)
- Staff: เห็น task/assigned เท่านั้น + inventory status แบบไม่ sensitive

---

## 5) Work Packages (WP) — Phase 12.2
> ให้ทำตามลำดับ ห้ามข้าม

### WP2.1 — KPI Cards (HIGH)
**Goal:** ทำ KPISection ให้มี "การ์ดจริง" (ไม่ใช่ text-only)
- ใช้ layout 4 cards สำหรับ Owner, 3 cards Manager, 1 card Staff
- ใช้ข้อมูล mock แต่ต้องสื่อค่า: `value`, `trend`, `label`, `status`
- ห้ามเอา profit ไปแสดงใน Manager/Staff

**DoD:**
- Owner เห็น 4 cards: Revenue, Profit, Active Orders, New Customers
- Manager เห็น 3 cards: Revenue (limited), Active Orders, New Customers
- Staff เห็น 1 card: Active Orders (assigned)
- Card spacing compact สำหรับ 1366×768

---

### WP2.2 — Charts Panels (MEDIUM)
**Goal:** ChartsSection ต้องมี panel จริง 1–2 อัน ตาม role
- Owner/Manager: Sales trend (line) + Inventory status (bar)
- Staff: Inventory status เท่านั้น (count/status)

**DoD:**
- Chart ไม่ overflow
- มี axis/label ที่อ่านออก
- ไม่มี animation หนัก

---

### WP2.3 — Transactions Table (CRITICAL)
**Goal:** TransactionSection ต้องเป็นตาราง ERP จริง (compact)
- Columns ขั้นต่ำ: Date | Type | Party | Amount | Status | Action
- Staff ต้อง filter เฉพาะ assigned เท่านั้น + อาจไม่โชว์ amount หากเป็น sensitive (ขึ้นกับ policy ที่ set ไว้)

**DoD:**
- ตารางแสดง 10–15 แถว mock
- มี status badge (Completed/Pending/etc)
- Row height compact (ไม่โล่ง)
- มี "View" action (ยังไม่ต้องทำ routing จริง แค่ button/placeholder)

---

### WP2.4 — Visual Hierarchy & Density Pass (FINAL)
**Goal:** ปรับ spacing/padding ให้เป็น ERP (ลดช่องว่าง)
- KPI section ต้องเด่นสุด
- Transactions ต้องดูเป็นพื้นที่ควบคุมงาน

**DoD:**
- บน 1366×768 เห็น: KPI cards + อย่างน้อย 1 chart + table header โดยไม่ scroll มาก
- UI ดู "พร้อมใช้งานองค์กร" ไม่เหมือน skeleton

---

## 6) ข้อห้าม (Anti-scope creep)
- ห้ามเพิ่มหน้าใหม่ (Customers/Products/Orders) ใน Phase 12.2
- ห้าม refactor โครงสร้างไฟล์ใหม่ถ้าไม่จำเป็น
- ห้ามย้ายไป TypeScript ทั้งระบบตอนนี้
- ห้ามเพิ่ม auth จริง / backend integration ใน Phase 12.2
- ห้ามทำ theme/animation ใหม่ที่ขัด UI Constitution

---

## 7) คำสั่งสำหรับสั่ง Manus/Claude (COPY-PASTE)
### Prompt: Start Phase 12.2
**Instruction to AI:**
1) Do not refactor Phase 12.1 structure. Keep file paths under `src/components/layout`, `src/components/dashboard`, `src/services/dashboard`.
2) Implement WP2.1 → WP2.4 in order.
3) Use mock data but enforce role-based data shaping in `shape*ByRole.js` (not in UI).
4) Ensure 1366×768 density: compact paddings, no wasted whitespace.
5) No heavy glass blur; keep clean corporate.

**Deliverables required:**
- Updated `KPISection.jsx` with real cards (and optional `KPICard.jsx` if already in contract; if not, keep inside KPISection but still clean)
- Updated `ChartsSection.jsx` with real chart panels (Recharts)
- Updated `TransactionSection.jsx` with compact table + badges + actions
- Updated shaping services to match role policy
- Screenshot-ready layout at 1366×768, and confirm Owner/Manager/Staff views

**Definition of Done:**
- Owner: 4 KPI + 2 charts + full transaction table
- Manager: 3 KPI + 2 charts + operational transactions
- Staff: 1 KPI + 1 chart + assigned-only table (restricted fields)

---

## 8) คำถามที่ "ไม่ต้องถามผู้ใช้" (ต้อง assume ตามข้อตกลง)
- Role policy ใช้ชุด: `owner`, `manager`, `staff`
- Dev role selector มีไว้ทดสอบเท่านั้น (DEV only)
- Dashboard = Overview + Quick access (ไม่ใส่ฟอร์มหนัก)

---

## 9) สิ่งที่ผู้ใช้ต้องการจาก AI ใน Session ใหม่
- วางแผน Phase 12.2 แบบ "รัดกุม + audit ได้"
- ไม่ตอบลอย ๆ ต้องออกมาเป็น checklist + DoD + constraints
- ทำงานเป็น step-by-step (WP2.1 → WP2.4)
- โฟกัสที่ UI ให้ "ใช้งานจริง" ก่อน ไม่ใช่สวยอย่างเดียว

---

## 10) Next Action (เริ่มทันที)
เริ่มทำ **WP2.1 KPI Cards** ก่อน
แล้วส่งผล: ภาพรวม Owner/Manager/Staff บน 1366×768 (ยืนยัน density)

---
END OF HANDOFF