# Smart ERP Frontend

Enterprise Resource Planning system frontend built with React, Tailwind CSS, and comprehensive role-based access control.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **Backend API** running at configured URL

### Installation
```bash
cd frontend
npm install
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
VITE_API_BASE_URL=http://localhost:8000         # Your backend URL
VITE_DEV_ROLE_OVERRIDE=owner                   # Development role override
```

### Development Server
```bash
npm run dev
```
**Default URL**: http://localhost:5173 (Vite default)

### Production Build
```bash
npm run build      # Build for production
npm run preview    # Preview production build locally
```

## 🏗️ Architecture

### Role-Based Dashboard System
- **Owner/Executive**: Complete access - all KPIs, charts, financial data, and transactions
- **Manager/Operations**: Operational focus - limited financial access, no profit margins
- **Staff/Daily**: Task-specific - only assigned orders, inventory status, no financial data

### Data Security Implementation
**Two-Layer Security Model:**
1. **Visibility Layer** - `RoleGuard` components control what UI elements render
2. **Data Layer** - Service functions (`shapeKpisByRole`, etc.) filter sensitive data

### Key Security Features
- **Financial Data Protection**: Profit margins, costs, internal notes removed for non-owners
- **Transaction Filtering**: Staff sees only assigned transactions, managers see operational subset
- **Field-Level Security**: Sensitive fields systematically removed based on role permissions

## 🛡️ Role-Based Examples

### Owner Dashboard
```javascript
// KPIs: All financial metrics with detailed breakdowns
{ revenue: { value: 125000, trend: 8.2, breakdown: {...}, projection: 140000 } }

// Transactions: Complete data including profit margins and internal notes  
{ id: 1, amount: 2500, profitMargin: 0.25, internalNotes: "VIP customer" }
```

### Manager Dashboard  
```javascript
// KPIs: Limited revenue view, no profit data
{ revenue: { value: 125000, trend: 8.2, showDetailed: false } }

// Transactions: Operational data without sensitive financial details
{ id: 1, amount: 2500, customer: "ABC Corp", priority: "high" }
```

### Staff Dashboard
```javascript  
// KPIs: Only assigned task counts
{ orders: { value: 12, scope: "assigned", priority: "high" } }

// Transactions: Task-focused, no financial amounts
{ id: 1, customer: "ABC Corp", status: "processing", assignedTo: "staff123" }
```

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/          # AppLayout, Sidebar, TopBar
│   ├── guards/          # RoleGuard for conditional rendering
│   ├── common/          # LoadingState, ErrorBoundary
│   └── dashboard/       # KPI, Charts, Transaction sections
├── pages/               # Page components (DashboardPage)  
├── services/            # Data shaping and security layer
│   └── dashboard/       # Role-based data filtering functions
├── types/               # Role definitions and permissions matrix
└── config/              # API configuration
```

## 🔧 Tech Stack
- **React 18** - Component framework  
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Enterprise chart components
- **Lucide React** - Consistent icon library
- **Vite** - Fast build tool and dev server

## 👨‍💻 Development Features

### Role Testing
The development environment includes a **Role Override System**:
- **Environment Variable**: `VITE_DEV_ROLE_OVERRIDE=owner|manager|staff`
- **UI Switcher**: Yellow dev panel for quick role switching (DEV mode only)
- **Real-time Updates**: Instantly see how dashboard changes for different roles

### Data Shaping Verification
Test role-based data filtering:
```javascript
// Check what each role actually receives
console.log('Owner KPIs:', shapeKpisByRole(rawData, 'owner'))
console.log('Manager KPIs:', shapeKpisByRole(rawData, 'manager'))  
console.log('Staff KPIs:', shapeKpisByRole(rawData, 'staff'))
```

## 🌐 API Integration

### Backend Requirements
The frontend expects these endpoints:
- `GET /health` - System health check
- `GET /` - API root with system information
- Future: `GET /api/dashboard/*` - Role-aware dashboard data

### API Configuration
```javascript
// src/config/api.js
export const apiConfig = {
  baseUrl: 'http://localhost:8000',
  endpoints: {
    health: '/health',
    dashboard: '/api/dashboard'
  }
}
```

## 🚀 Production Deployment

### Environment Variables (Required)
```bash
# Production Backend URL
VITE_API_BASE_URL=https://your-production-api.com

# Remove dev overrides
# VITE_DEV_ROLE_OVERRIDE=  # Comment out or remove
```

### Deployment Platforms
**Vercel (Recommended)**:
```bash
# Set environment variables in Vercel dashboard
VITE_API_BASE_URL=https://smarterpbackend-production.up.railway.app
```

**Netlify**:
```bash
# netlify.toml
[build.environment]
  VITE_API_BASE_URL = "https://your-backend-url.com"
```

## 🔐 Security Considerations

### Production Checklist
- ✅ Remove `VITE_DEV_ROLE_OVERRIDE` from production
- ✅ Verify API endpoints use HTTPS in production
- ✅ Test role-based data filtering with real user accounts
- ✅ Ensure sensitive fields are never sent to unauthorized roles
- ✅ Implement proper authentication/authorization on backend

### Data Flow Security
1. **Backend** filters data by user role before sending to frontend
2. **Frontend** shapes data again as additional security layer  
3. **UI Components** use RoleGuard for visibility control
4. **No sensitive business logic** exists in frontend code

## 🧪 Testing Role Behavior

### Manual Testing Steps
1. Start dev server: `npm run dev`
2. Open browser to http://localhost:5173
3. Use role switcher to test Owner → Manager → Staff
4. Verify:
   - KPI cards appear/disappear correctly
   - Chart data shows appropriate level of detail
   - Transaction table filters sensitive information
   - Navigation menu items change based on permissions

### Expected Behavior
- **Owner**: Sees all 4 KPI cards, 2 charts, all transactions with amounts
- **Manager**: Sees 3 KPI cards (no profit), 2 charts, transactions without margins  
- **Staff**: Sees 1 KPI card (orders), 1 chart (inventory), assigned transactions only

## 📋 Next Development Steps
1. **Authentication**: Implement real user login/logout
2. **API Integration**: Connect to live backend endpoints
3. **Module Expansion**: Build Inventory, Sales, HR modules  
4. **Advanced Permissions**: Granular field-level permissions
5. **Audit Trail**: Log user actions for compliance
6. **Performance**: Implement data caching and lazy loading

## 🆘 Troubleshooting

### Common Issues
**Role switcher not working**: Check `VITE_DEV_ROLE_OVERRIDE` in .env file  
**API connection errors**: Verify `VITE_API_BASE_URL` and backend health  
**Missing KPI cards**: Check browser console for role permission errors  
**Build failures**: Ensure all environment variables are properly set  

### Getting Help
This frontend follows the **UI System Prompt** and **Component Contract** specifications strictly. Any modifications must maintain:
- Enterprise UX principles (clarity over visual effects)
- Role-based security model (data + visibility layers)
- Production-grade architecture (no business logic in UI)

For issues, check console errors and verify role permissions in `src/types/roles.js`.