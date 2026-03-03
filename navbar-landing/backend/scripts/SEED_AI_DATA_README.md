# AI Test Data Seeding - Comprehensive Test Suite

This enhanced seed script generates **2,500+ test records** including base data and targeted test cases for all AI tools.

## What It Seeds

### Base Data (2,100 records)
- **500 Leads** - Standard lead data with various statuses
- **500 Sales** - Sales with different payment statuses
- **500 Payments** - Payments across different statuses
- **500 DC Orders** - Delivery challan orders
- **100 DCs** - Delivery challans linked to sales/orders
- **500 Expenses** - Expense records for fraud detection
- **20 Managers/Executives** - User accounts for testing

### Targeted AI Test Cases (400+ records)

#### 🔴 Revenue at Risk Engine (75 scenarios)
- **30 High-Risk Scenarios**: Very old pending sales (60+ days) with overdue payments
- **25 Medium-Risk Scenarios**: Large deals stuck in "In Progress" status
- **20 High-Risk Scenarios**: Confirmed sales with overdue payment status

#### 🛡️ Fraud Detection (40 scenarios)
- **15 Suspicious Transactions**: Unusually high amounts (₹5L-₹20L) processed after business hours
- **20 Round Number Patterns**: Payments with exact round numbers (₹10K, ₹50K, ₹1L, etc.) - potential red flags
- **5 Rapid Expense Sequences**: Multiple expenses from same user in short timeframes

#### 👥 Churn Predictor (55 scenarios)
- **30 Inactive Customers**: No activity for 90+ days (high churn risk)
- **25 Declining Customers**: Customers with lower order frequency and partial payments

#### ⚡ Priority Engine (70 scenarios)
- **40 Overdue Follow-up Leads**: Leads with past-due follow-up dates and high-value products
- **30 High-Value Pending Payments**: Large payments requiring approval

#### 📊 Performance Risk Index (150 scenarios)
- **10 Poor Performer Managers**: Managers with low conversion rates
- **150 Low Performance Sales**: Many pending/cancelled sales assigned to poor performers

#### ⏰ Delay Cost Calculator (30 scenarios)
- **30 Delayed DCs**: Delivery challans with 30+ day delays, showing significant operational delays

#### 💰 Cashflow Blockage Analyzer (45 scenarios)
- **25 Blocked Payments**: Payments stuck in "Hold" status for 20-60 days
- **20 Large Pending Payments**: High-value payments (₹2L-₹10L) stuck in pending

## How to Run

```bash
cd backend
npm run seed:ai-data
```

Or directly:

```bash
cd backend
node scripts/seedAITestData.js
```

## Test Case Characteristics

### Revenue at Risk Test Cases
- Old pending sales (60-90 days old)
- Large stuck deals (₹5L-₹30L)
- Overdue payment statuses
- High-value transactions at risk

### Fraud Detection Test Cases
- **High Amounts**: 3-10x average transaction amounts
- **After-Hours**: Transactions between 6 PM - 11:59 PM
- **Round Numbers**: Exact amounts like ₹10,000, ₹50,000, ₹1,00,000
- **Rapid Sequences**: Multiple expenses from same user within days

### Churn Predictor Test Cases
- **Inactive**: 90-150 days since last activity
- **Declining**: Lower quantities, partial payments, older transactions
- **Pattern Recognition**: Customers showing disengagement patterns

### Priority Engine Test Cases
- **Overdue Follow-ups**: Past-due follow-up dates
- **High-Value Deals**: Large amounts needing attention
- **Approval Required**: Payments waiting for approval

### Performance Risk Test Cases
- **Low Conversion**: Many pending/cancelled sales
- **Poor Metrics**: Managers with declining performance
- **Zone Issues**: Geographic areas with low performance

### Delay Cost Test Cases
- **Extended Delays**: 30-60 day delays in DC completion
- **Operational Impact**: Calculable financial losses from delays

### Cashflow Blockage Test Cases
- **Hold Status**: Payments stuck in hold for weeks
- **Large Pending**: High-value payments awaiting processing
- **Bottleneck Identification**: Patterns showing cashflow issues

## Data Distribution

### Time Ranges
- **Base Data**: Last 6 months (realistic spread)
- **Test Cases**: Various timeframes:
  - Revenue Risk: 20-90 days old
  - Fraud: Last 30 days
  - Churn: 60-150 days old
  - Priority: 1-30 days old
  - Delays: 30-60 day delays
  - Cashflow: 15-60 days old

### Amount Ranges
- **Normal**: ₹5,000 - ₹2,00,000
- **High Risk**: ₹50,000 - ₹10,00,000
- **Fraud Cases**: ₹5,00,000 - ₹20,00,000
- **Large Pending**: ₹2,00,000 - ₹10,00,000

### Status Distribution
- **Leads**: Mix of Pending, Processing, Saved, Closed
- **Sales**: Various statuses with payment information
- **Payments**: Mix of Pending, Approved, Hold, Rejected
- **DCs**: Various stages from created to completed
- **Expenses**: Different categories and approval statuses

## What This Tests

### ✅ Revenue at Risk Engine
- Identifies old pending sales
- Detects stuck deals
- Flags overdue payments
- Calculates total revenue at risk

### ✅ Fraud Detection
- Detects unusually high amounts
- Identifies after-hours transactions
- Flags round number patterns
- Detects rapid expense sequences

### ✅ Churn Predictor
- Identifies inactive customers
- Detects declining engagement
- Predicts churn probability
- Provides retention recommendations

### ✅ Priority Engine
- Ranks overdue tasks
- Prioritizes high-value deals
- Flags approval requirements
- Calculates priority scores

### ✅ Performance Risk Index
- Identifies poor performers
- Detects low conversion rates
- Highlights zone issues
- Calculates risk indices

### ✅ Delay Cost Calculator
- Calculates delay costs
- Identifies operational bottlenecks
- Estimates financial impact
- Provides delay breakdowns

### ✅ Cashflow Blockage Analyzer
- Identifies blocked payments
- Detects large pending amounts
- Highlights bottlenecks
- Provides cashflow forecasts

## After Seeding

Once seeded, you can test all AI tools with comprehensive data:

1. **Revenue at Risk Engine** - Will show ₹9+ crores at risk
2. **Executive Dashboard** - Will display critical issues and trends
3. **Priority Engine** - Will rank 70+ high-priority tasks
4. **Deal Risk Scoring** - Will identify 75+ high-risk deals
5. **Performance Risk Index** - Will highlight 10+ poor performers
6. **Fraud Detection** - Will flag 40+ suspicious transactions
7. **Cashflow Analyzer** - Will identify 45+ blocked payments
8. **Delay Cost Calculator** - Will calculate costs for 30+ delayed DCs
9. **Churn Predictor** - Will identify 55+ at-risk customers
10. **Narrative BI** - Will generate comprehensive business summaries

## Notes

- The script will not duplicate existing managers (checks by email)
- All dates are properly formatted for timezone-aware operations
- Data is linked properly (sales linked to leads, payments linked to sales, etc.)
- Test cases are clearly labeled with prefixes (HIGH RISK, SUSPICIOUS, etc.)
- Amounts are realistic and varied for proper ML training
- Edge cases are included to test model robustness

## Troubleshooting

If you encounter issues:
1. Ensure MongoDB is running
2. Check database connection string in `.env`
3. Verify all models are properly defined
4. Check for duplicate email errors (managers)

## Next Steps

After seeding:
1. Start the Python AI service: `cd ai-service && python app.py`
2. Start the backend: `cd backend && npm run dev`
3. Start the frontend: `cd navbar-landing && npm run dev`
4. Navigate to `/dashboard/ai` to see all AI tools in action!

All tools will now have sufficient and realistic test data to provide meaningful insights! 🎉
