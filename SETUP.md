# CRM System Management Forge - Setup Guide

## Quick Start

This project consists of two main parts:
1. **Backend** - Node.js + Express + MongoDB API
2. **Frontend** - Expo React Native mobile application

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory (copy from `.env.example`):
```env
MONGO_URI=mongodb+srv://amenityforge_db_user:qcTX55G2K6ct36Ij@cluster0.ibp4qe2.mongodb.net/CRM?appName=Cluster0
JWT_SECRET=your_jwt_secret_key_here_change_in_production
PORT=5000
NODE_ENV=development
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update the API URL in `src/utils/api.js`:
```javascript
const API_URL = 'http://YOUR_BACKEND_URL/api';
// For local development: 'http://localhost:5000/api'
// For production: 'https://your-backend-domain.com/api'
```

4. Start the Expo development server:
```bash
npm start
```

5. Run on your device:
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal
   - Or press `a` for Android emulator / `i` for iOS simulator

## Project Structure

```
CRM-FORGE/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── leadController.js
│   │   ├── salesController.js
│   │   └── ...
│   ├── models/
│   │   ├── User.js
│   │   ├── Lead.js
│   │   ├── Sale.js
│   │   └── ...
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── leadRoutes.js
│   │   └── ...
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── screens/
    │   │   ├── LoginScreen.js
    │   │   ├── DashboardScreen.js
    │   │   ├── DCScreen.js
    │   │   └── ...
    │   ├── redux/
    │   │   ├── store.js
    │   │   └── slices/
    │   ├── utils/
    │   │   └── api.js
    │   └── components/
    ├── App.js
    └── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Leads
- `GET /api/leads` - Get all leads
- `POST /api/leads/create` - Create new lead
- `PUT /api/leads/:id` - Update lead

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales/create` - Create new sale

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees/create` - Create employee

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments/create` - Create payment
- `PUT /api/payments/:id/approve` - Approve payment

### Warehouse
- `GET /api/warehouse` - Get warehouse items
- `POST /api/warehouse/stock` - Update stock

### Reports
- `GET /api/reports/sales` - Get sales analytics
- `POST /api/reports/generate` - Generate custom report

## Default Credentials

After setting up the database, create a super admin user:

```javascript
// Use MongoDB shell or MongoDB Compass
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  password: "$2a$10$...", // Use bcrypt hash
  role: "Super Admin",
  isActive: true
})
```

Or register via API:
```bash
POST /api/auth/register
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "password123",
  "role": "Super Admin"
}
```

## Troubleshooting

### Backend Issues
- Ensure MongoDB connection string is correct
- Check if port 5000 is available
- Verify all environment variables are set

### Frontend Issues
- Ensure backend is running before starting frontend
- Update API_URL in `src/utils/api.js` to match your backend URL
- Clear Expo cache: `expo start --clear`
- Reset Metro bundler: `npm start -- --reset-cache`

### Database Issues
- Verify MongoDB Atlas connection
- Check network access in MongoDB Atlas
- Ensure database name matches in connection string

## Next Steps

1. Configure Firebase for authentication (optional)
2. Set up Cloudinary for file uploads
3. Configure push notifications with FCM
4. Deploy backend to production (Render/Railway/AWS)
5. Build production mobile apps with Expo

## Support

For issues or questions, refer to the main README.md documentation.

