# Frontend Environment Configuration Examples

## For Vercel (.env.local)
```bash
# Development
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Production (replace with your actual Railway URL)
NEXT_PUBLIC_API_BASE_URL=https://smarterpbackend-production.up.railway.app
```

## Usage in Frontend (Next.js example)
```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// API calls
const response = await fetch(`${API_BASE_URL}/health`);
const data = await response.json();
```

## Vercel Deployment
1. Add environment variable in Vercel dashboard:
   - Key: `NEXT_PUBLIC_API_BASE_URL`
   - Value: `https://smarterpbackend-production.up.railway.app`

2. Or use vercel.json:
```json
{
  "env": {
    "NEXT_PUBLIC_API_BASE_URL": "https://smarterpbackend-production.up.railway.app"
  }
}
```