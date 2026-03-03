# Revenue at Risk Test Data Generator

This script generates massive test data to showcase the Revenue at Risk dashboard with impressive numbers and visualizations.

## What it does

The script creates:
- **500 Leads** with various risk levels (Pending, Processing, Hold)
- **300 Sales** with different statuses (Pending, Confirmed, In Progress)
- **400 Payments** with various delays (0-90 days)

All data is designed to generate significant revenue at risk numbers that will display beautifully on the dashboard.

## How to Run

1. **Make sure your MongoDB is running** and your `.env` file has the correct `MONGODB_URI`

2. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

3. **Run the script:**
   ```bash
   node scripts/generateRevenueAtRiskTestData.js
   ```

4. **Wait for completion** - The script will:
   - Connect to MongoDB
   - Generate all test data
   - Display a summary
   - Close the connection

5. **Refresh the Revenue at Risk dashboard** in your browser to see the epic numbers!

## Expected Results

After running the script, you should see:
- **Total Revenue at Risk**: ₹50+ Crores (depending on generated amounts)
- **High Risk Items**: 100+ items
- **Beautiful charts and visualizations** showing:
  - Risk distribution (pie chart)
  - Risk trend over time (area chart)
  - Risk by status (bar chart)
  - Risk by type (bar chart)
  - Detailed high risk items list

## Notes

- The script requires at least one Super Admin user to exist in the database
- All generated data will be associated with the first Super Admin user found
- The script generates realistic Indian school names, locations, and contact details
- Amounts range from ₹50K to ₹5 Crores per item

## Clean Up

If you want to remove the test data later, you can:
1. Use the `clearAllData.js` script (but this removes everything except Super Admin)
2. Or manually delete the generated Leads, Sales, and Payments from MongoDB
