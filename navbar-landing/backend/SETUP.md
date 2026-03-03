# CRM Backend Setup Guide

## Prerequisites

1. **Node.js** (v14 or higher recommended)
   - Check if installed: `node --version`
   - Download from: https://nodejs.org/

2. **MongoDB Database**
   - Option A: Local MongoDB installation
   - Option B: MongoDB Atlas (cloud) - recommended for development

## Quick Start

### 1. Navigate to Backend Directory
```bash
cd /Users/anupamvarma/Desktop/CRM/backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# MongoDB Connection
MONGO_URI=mongodb://127.0.0.1:27017/crm_system
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/CRM?retryWrites=true&w=majority

# Server Port (optional, defaults to 5000)
PORT=5000

# JWT Secret for authentication (generate a random string)
JWT_SECRET=your-secret-key-here
```

**Important:** Replace the placeholder values with your actual:
- MongoDB connection string
- JWT secret (use a strong random string for production)

### 4. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### 5. Verify Server is Running

The server should start on port 5000 (or your configured PORT). You should see:
```
✅ Database connection established. Starting server...
Server running on port 5000
```

Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

Or visit in browser: `http://localhost:5000/api/health`

## MongoDB Setup Options

### Option A: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service:
   ```bash
   # macOS (using Homebrew)
   brew services start mongodb-community
   
   # Or run manually
   mongod
   ```
3. Use connection string: `mongodb://127.0.0.1:27017/crm_system`

### Option B: MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string from Atlas dashboard
4. Add your IP address to Network Access whitelist
5. Use the connection string in your `.env` file

## Available Scripts

- `npm start` - Start server in production mode
- `npm run dev` - Start server in development mode with nodemon (auto-reload)
- `npm run seed:saved-dc` - Seed saved DC data
- `npm run seed:closed-sales` - Seed closed sales data

## Troubleshooting

### Port Already in Use
If you see `Port 5000 is already in use`:
- Find the process: `lsof -i :5000`
- Kill the process: `kill -9 <PID>`
- Or change PORT in `.env` file

### Database Connection Issues
- Verify MongoDB is running (if local)
- Check connection string in `.env`
- For Atlas: Ensure your IP is whitelisted
- Check internet connection (for Atlas)

### Missing Dependencies
If you see module errors:
```bash
rm -rf node_modules package-lock.json
npm install
```

## API Endpoints

Once running, the API will be available at:
- Base URL: `http://localhost:5000`
- Health Check: `http://localhost:5000/api/health`
- Auth: `http://localhost:5000/api/auth/*`
- Leads: `http://localhost:5000/api/leads/*`
- Sales: `http://localhost:5000/api/sales/*`
- And many more... (see server.js for all routes)

## Next Steps

After the backend is running, you can:
1. Test API endpoints using Postman or curl
2. Connect your frontend application to this backend
3. Check the routes folder for available endpoints

