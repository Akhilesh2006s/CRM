# Quick Start: AI Service

## The Error You're Seeing

If you're getting **500 Internal Server Error**, it means the **Python AI service is not running**.

## Solution: Start the AI Service

### Step 1: Install Python Dependencies

```bash
cd ai-service
pip install -r requirements.txt
```

### Step 2: Start the AI Service

**On Windows:**
```bash
cd ai-service
python app.py
```

**Or use the batch file:**
```bash
cd ai-service
start.bat
```

**On Mac/Linux:**
```bash
cd ai-service
python app.py
```

**Or use the shell script:**
```bash
cd ai-service
chmod +x start.sh
./start.sh
```

### Step 3: Verify It's Running

You should see:
```
 * Running on http://0.0.0.0:5001
```

### Step 4: Test the Connection

Open a new terminal and test:
```bash
curl http://localhost:5001/health
```

You should get:
```json
{"status":"OK","message":"AI Service is running"}
```

## Troubleshooting

### Error: "Module not found"
- Make sure you installed dependencies: `pip install -r requirements.txt`

### Error: "Port 5001 already in use"
- Another process is using port 5001
- Change the port in `ai-service/.env`: `AI_SERVICE_PORT=5002`
- Update `backend/.env`: `AI_SERVICE_URL=http://localhost:5002`

### Error: "Python not found"
- Install Python 3.8+ from https://www.python.org/
- Make sure Python is in your PATH

## Required Services

For the AI features to work, you need **3 services running**:

1. **MongoDB** - Database (usually running)
2. **Backend** (Node.js) - Port 5000
   ```bash
   cd backend
   npm run dev
   ```
3. **AI Service** (Python) - Port 5001
   ```bash
   cd ai-service
   python app.py
   ```

## Quick Check

Run all three in separate terminals:
- Terminal 1: `cd backend && npm run dev`
- Terminal 2: `cd ai-service && python app.py`
- Terminal 3: `cd navbar-landing && npm run dev`

Then access: http://localhost:3001/dashboard/ai
