# AI Service for CRM

Python-based AI service providing 10 AI capabilities for the CRM system.

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables in `.env`:
```
AI_SERVICE_HOST=0.0.0.0
AI_SERVICE_PORT=5001
```

3. Run the service:
```bash
python app.py
```

The service will start on port 5001 by default.

## API Endpoints

All endpoints accept POST requests with JSON data:

- `/api/revenue-at-risk` - Calculate revenue at risk
- `/api/executive-dashboard` - Get executive dashboard data
- `/api/priority-engine` - Calculate priority scores
- `/api/deal-risk-scoring` - Score deal risks
- `/api/performance-risk` - Detect performance anomalies
- `/api/fraud-detection` - Detect fraud and anomalies
- `/api/cashflow-analyzer` - Analyze cashflow blockages
- `/api/delay-cost-calculator` - Calculate delay costs
- `/api/churn-predictor` - Predict customer churn
- `/api/narrative-bi` - Generate narrative business intelligence

## Health Check

- `GET /health` - Check if service is running

## Model Training

Models are stored in `models/` directory. To train new models:

1. Extract data from MongoDB
2. Run training scripts (to be created)
3. Save models as `.pkl` files in `models/` directory

## Integration

The Node.js backend connects to this service via HTTP. Set `AI_SERVICE_URL` in backend `.env`:

```
AI_SERVICE_URL=http://localhost:5001
```
