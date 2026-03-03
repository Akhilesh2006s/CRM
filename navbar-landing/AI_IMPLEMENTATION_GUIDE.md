# AI Implementation Guide

## Overview

All 10 AI capabilities have been implemented in your CRM system:

1. **Revenue at Risk Engine** - Identifies revenue likely to get stuck or lost
2. **Executive War-Room Dashboard** - High-level view of revenue trends and critical issues
3. **Smart Priority Engine** - Automatically ranks daily actions by business impact
4. **Deal & Renewal Risk Scoring** - Identifies deals at high risk of failing
5. **Manager & Zone Performance Risk Index** - Highlights managers showing performance drops
6. **Fraud & Anomaly Detection System** - Detects unusual patterns in expenses and transactions
7. **Cashflow Blockage Analyzer** - Identifies payment delays and cashflow bottlenecks
8. **Operational Delay Cost Calculator** - Calculates financial loss from operational delays
9. **Churn & Non-Renewal Predictor** - Identifies customers likely to churn
10. **Narrative Business Intelligence Generator** - Converts data into simple business summaries

## Setup Instructions

### 1. Python AI Service Setup

```bash
cd ai-service
pip install -r requirements.txt
```

Create `.env` file in `ai-service/`:
```
AI_SERVICE_HOST=0.0.0.0
AI_SERVICE_PORT=5001
```

Start the AI service:
```bash
python app.py
```

### 2. Backend Setup

Install axios dependency:
```bash
cd backend
npm install axios
```

Add to `backend/.env`:
```
AI_SERVICE_URL=http://localhost:5001
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Access

The AI dashboard is accessible via:
- Main Dashboard: `/dashboard` → Click "AI Mode" tab
- Executive Manager Dashboard: `/dashboard/executive-managers/[id]/dashboard` → Click "AI Mode" tab
- Direct Access: `/dashboard/ai`

## Architecture

### Python AI Service (`ai-service/`)
- Flask-based REST API
- 10 AI service modules in `services/`
- Feature engineering utilities in `utils/`
- Models stored in `models/` (can be trained later)

### Backend Integration (`backend/`)
- Routes: `routes/aiRoutes.js`
- Controllers: `controllers/aiController.js`
- Service Client: `services/aiService.js`
- Endpoints: `/api/ai/*`

### Frontend (`navbar-landing/`)
- Main AI Dashboard: `app/dashboard/ai/page.tsx`
- AI Mode tabs added to:
  - Main dashboard (`app/dashboard/page.tsx`)
  - Executive manager dashboard (`app/dashboard/executive-managers/[managerId]/dashboard/page.tsx`)

## API Endpoints

All AI endpoints require authentication:

- `GET /api/ai/revenue-at-risk` - Get revenue at risk analysis
- `GET /api/ai/executive-dashboard` - Get executive dashboard data
- `GET /api/ai/priority-engine` - Get prioritized tasks
- `GET /api/ai/deal-risk-scoring` - Get deal risk scores
- `GET /api/ai/performance-risk` - Get performance risk analysis
- `GET /api/ai/fraud-detection` - Get fraud detection alerts
- `GET /api/ai/cashflow-analyzer` - Get cashflow analysis
- `GET /api/ai/delay-cost-calculator` - Get delay cost calculations
- `GET /api/ai/churn-predictor` - Get churn predictions
- `GET /api/ai/narrative-bi` - Get narrative business intelligence

## Current Implementation Status

✅ **Completed:**
- All 10 AI service modules (Python)
- Backend routes and controllers
- Frontend AI dashboard
- AI Mode tabs in dashboards
- HTTP client integration

⏳ **Future Enhancements:**
- Model training scripts (when sufficient data available)
- Real-time updates via WebSockets
- Email/SMS alerts for high-risk items
- Model retraining automation
- Advanced ML models (currently using rule-based + basic ML)

## Usage

1. **Start AI Service**: `cd ai-service && python app.py`
2. **Start Backend**: `cd backend && npm run dev`
3. **Start Frontend**: `cd navbar-landing && npm run dev`
4. **Access AI Dashboard**: Navigate to any dashboard and click "AI Mode" tab

## Notes

- The AI services currently use rule-based algorithms with optional ML model support
- ML models can be trained and added to `ai-service/models/` directory
- All services are designed to work with minimal data (rule-based fallback)
- Performance improves as more historical data becomes available
