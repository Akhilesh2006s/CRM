import pandas as pd
import numpy as np
from datetime import datetime, timezone, timedelta
import os
import joblib
from utils.feature_engineering import extract_customer_features

def load_model(model_name):
    """Load trained model or return None if not available"""
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', model_name)
    if os.path.exists(model_path):
        return joblib.load(model_path)
    return None

def calculate_engagement_score(customer):
    """Calculate customer engagement score (0-1)"""
    score = 0.0
    max_score = 0.0
    
    # Order frequency (weight: 30%)
    total_orders = customer.get('total_orders', 0)
    if total_orders >= 5:
        score += 0.3
    elif total_orders >= 3:
        score += 0.2
    elif total_orders >= 1:
        score += 0.1
    max_score += 0.3
    
    # Recent activity (weight: 25%)
    days_since_order = customer.get('days_since_last_order', 999)
    if days_since_order <= 30:
        score += 0.25
    elif days_since_order <= 60:
        score += 0.15
    elif days_since_order <= 90:
        score += 0.05
    max_score += 0.25
    
    # Training/service engagement (weight: 20%)
    training_count = customer.get('training_count', 0)
    service_count = customer.get('service_count', 0)
    if training_count + service_count >= 3:
        score += 0.2
    elif training_count + service_count >= 1:
        score += 0.1
    max_score += 0.2
    
    # Query/interaction frequency (weight: 15%)
    interaction_count = customer.get('interaction_count', 0)
    if interaction_count >= 5:
        score += 0.15
    elif interaction_count >= 2:
        score += 0.08
    max_score += 0.15
    
    # Payment reliability (weight: 10%)
    avg_payment_delay = customer.get('avg_payment_delay', 0)
    if avg_payment_delay <= 7:
        score += 0.1
    elif avg_payment_delay <= 15:
        score += 0.05
    max_score += 0.1
    
    return score / max_score if max_score > 0 else 0.0

def calculate_trend_score(customer):
    """Calculate trend score - is customer engagement improving or declining?"""
    # Compare recent 3 months vs previous 3 months
    recent_orders = customer.get('recent_orders_3m', 0)
    previous_orders = customer.get('previous_orders_3m', 0)
    
    if previous_orders == 0:
        return 0.5  # Neutral if no historical data
    
    trend_ratio = recent_orders / previous_orders if previous_orders > 0 else 0
    
    if trend_ratio >= 1.2:
        return 0.2  # Improving (lower churn risk)
    elif trend_ratio >= 0.8:
        return 0.5  # Stable
    elif trend_ratio >= 0.5:
        return 0.7  # Declining
    else:
        return 0.9  # Rapidly declining

def calculate_clv_score(customer):
    """Calculate Customer Lifetime Value score"""
    total_revenue = customer.get('total_revenue', 0)
    
    # High-value customers are less likely to churn
    if total_revenue > 500000:
        return 0.1  # Very low churn risk
    elif total_revenue > 200000:
        return 0.2
    elif total_revenue > 100000:
        return 0.3
    elif total_revenue > 50000:
        return 0.4
    else:
        return 0.5  # Neutral

def predict_churn(data):
    """
    Enhanced churn prediction with multiple factors
    """
    customers = data.get('customers', [])
    model = load_model('churn_model.pkl')
    results = []
    now = datetime.now(timezone.utc)
    
    for customer in customers:
        # Initialize risk factors
        risk_factors = []
        churn_prob = 0.0
        
        # Factor 1: Days since last order (Weight: 25%)
        last_order = customer.get('last_order_date') or customer.get('lastOrderDate')
        days_since_order = 999
        if last_order:
            last_order_dt = pd.to_datetime(last_order)
            if last_order_dt.tz is None:
                last_order_dt = last_order_dt.tz_localize('UTC')
            days_since_order = (now - last_order_dt).days
            
            if days_since_order > 180:
                churn_prob += 0.25 * 0.9
                risk_factors.append({'factor': 'No order for 180+ days', 'impact': 'High'})
            elif days_since_order > 120:
                churn_prob += 0.25 * 0.7
                risk_factors.append({'factor': 'No order for 120+ days', 'impact': 'High'})
            elif days_since_order > 90:
                churn_prob += 0.25 * 0.6
                risk_factors.append({'factor': 'No order for 90+ days', 'impact': 'Medium'})
            elif days_since_order > 60:
                churn_prob += 0.25 * 0.4
                risk_factors.append({'factor': 'No order for 60+ days', 'impact': 'Medium'})
            elif days_since_order > 30:
                churn_prob += 0.25 * 0.2
                risk_factors.append({'factor': 'No order for 30+ days', 'impact': 'Low'})
        
        customer['days_since_last_order'] = days_since_order
        
        # Factor 2: Engagement Score (Weight: 20%)
        engagement_score = calculate_engagement_score(customer)
        engagement_risk = (1 - engagement_score) * 0.2
        churn_prob += engagement_risk
        if engagement_score < 0.3:
            risk_factors.append({'factor': 'Low engagement score', 'impact': 'High'})
        elif engagement_score < 0.5:
            risk_factors.append({'factor': 'Moderate engagement', 'impact': 'Medium'})
        
        # Factor 3: Payment Delays (Weight: 15%)
        avg_payment_delay = customer.get('avg_payment_delay', 0) or customer.get('avgPaymentDelay', 0)
        if avg_payment_delay > 45:
            churn_prob += 0.15 * 0.8
            risk_factors.append({'factor': f'Payment delays: {avg_payment_delay:.0f} days', 'impact': 'High'})
        elif avg_payment_delay > 30:
            churn_prob += 0.15 * 0.6
            risk_factors.append({'factor': f'Payment delays: {avg_payment_delay:.0f} days', 'impact': 'Medium'})
        elif avg_payment_delay > 15:
            churn_prob += 0.15 * 0.3
            risk_factors.append({'factor': f'Payment delays: {avg_payment_delay:.0f} days', 'impact': 'Low'})
        
        # Factor 4: Order Frequency (Weight: 15%)
        total_orders = customer.get('total_orders', 0) or customer.get('totalOrders', 0)
        customer_age_days = customer.get('customer_age_days', 365)
        orders_per_year = (total_orders / customer_age_days) * 365 if customer_age_days > 0 else 0
        
        if total_orders == 0:
            churn_prob += 0.15 * 0.9
            risk_factors.append({'factor': 'No orders placed', 'impact': 'Critical'})
        elif total_orders == 1 and days_since_order > 60:
            churn_prob += 0.15 * 0.7
            risk_factors.append({'factor': 'Single order, no recent activity', 'impact': 'High'})
        elif orders_per_year < 1:
            churn_prob += 0.15 * 0.5
            risk_factors.append({'factor': 'Low order frequency', 'impact': 'Medium'})
        
        # Factor 5: Trend Analysis (Weight: 10%)
        trend_score = calculate_trend_score(customer)
        churn_prob += trend_score * 0.1
        if trend_score > 0.7:
            risk_factors.append({'factor': 'Declining order trend', 'impact': 'High'})
        
        # Factor 6: CLV Adjustment (Weight: 5% - reduces risk for high-value customers)
        clv_score = calculate_clv_score(customer)
        churn_prob = churn_prob * (0.95 + clv_score * 0.05)  # Slight reduction for high CLV
        
        # Factor 7: Complaints/Issues (Weight: 5%)
        complaint_count = customer.get('complaint_count', 0) or customer.get('complaintCount', 0)
        unresolved_queries = customer.get('unresolved_queries', 0)
        if complaint_count + unresolved_queries > 3:
            churn_prob += 0.05 * 0.8
            risk_factors.append({'factor': f'{complaint_count + unresolved_queries} unresolved issues', 'impact': 'High'})
        elif complaint_count + unresolved_queries > 1:
            churn_prob += 0.05 * 0.4
            risk_factors.append({'factor': f'{complaint_count + unresolved_queries} unresolved issues', 'impact': 'Medium'})
        
        # Factor 8: No Training/Service Engagement (Weight: 5%)
        training_count = customer.get('training_count', 0)
        service_count = customer.get('service_count', 0)
        if total_orders > 2 and training_count == 0 and service_count == 0:
            churn_prob += 0.05 * 0.3
            risk_factors.append({'factor': 'No training/service engagement', 'impact': 'Low'})
        
        # Cap at 1.0
        churn_prob = min(churn_prob, 1.0)
        
        # ML Model Blending (if available)
        if model:
            try:
                features_df = extract_customer_features([customer])
                if not features_df.empty:
                    ml_prob = model.predict_proba(features_df)[0][1]
                    churn_prob = (churn_prob * 0.3) + (ml_prob * 0.7)
            except:
                pass
        
        # Calculate churn timeframe
        if churn_prob > 0.7:
            churn_timeframe = "30 days"
        elif churn_prob > 0.5:
            churn_timeframe = "60 days"
        elif churn_prob > 0.3:
            churn_timeframe = "90 days"
        else:
            churn_timeframe = "Low risk"
        
        # Calculate revenue at risk
        total_revenue = customer.get('total_revenue', 0) or customer.get('totalRevenue', 0)
        revenue_at_risk = total_revenue * churn_prob
        
        # Calculate retention ROI (estimated)
        avg_order_value = total_revenue / max(total_orders, 1)
        estimated_retention_cost = avg_order_value * 0.1  # 10% of order value for retention
        retention_roi = (revenue_at_risk - estimated_retention_cost) / estimated_retention_cost if estimated_retention_cost > 0 else 0
        
        # Risk level
        risk_level = 'High' if churn_prob > 0.7 else 'Medium' if churn_prob > 0.4 else 'Low'
        
        # Confidence score (based on data completeness)
        data_completeness = sum([
            1 if last_order else 0,
            1 if total_orders > 0 else 0,
            1 if avg_payment_delay > 0 else 0,
            1 if customer.get('training_count', 0) > 0 or customer.get('service_count', 0) > 0 else 0
        ]) / 4.0
        confidence = 0.5 + (data_completeness * 0.5)  # 50-100% confidence
        
        results.append({
            'customer_id': customer.get('id') or customer.get('_id'),
            'customer_name': customer.get('name') or customer.get('school_name') or customer.get('customerName', 'Unknown'),
            'churn_probability': round(churn_prob, 3),
            'risk_level': risk_level,
            'confidence': round(confidence, 2),
            'churn_timeframe': churn_timeframe,
            'total_revenue': round(total_revenue, 2),
            'revenue_at_risk': round(revenue_at_risk, 2),
            'total_orders': total_orders,
            'avg_order_value': round(avg_order_value, 2),
            'days_since_last_order': days_since_order if last_order else None,
            'engagement_score': round(engagement_score, 2),
            'risk_factors': risk_factors[:5],  # Top 5 risk factors
            'retention_roi': round(retention_roi, 2),
            'estimated_retention_cost': round(estimated_retention_cost, 2),
            'retention_recommendations': get_retention_strategies(customer, churn_prob, risk_factors)
        })
    
    # Sort by revenue at risk (highest first) - prioritize high-value customers
    results.sort(key=lambda x: x['revenue_at_risk'], reverse=True)
    
    # Calculate summary statistics
    total_revenue_at_risk = sum(r['revenue_at_risk'] for r in results)
    high_value_at_risk = sum(r['revenue_at_risk'] for r in results if r['total_revenue'] > 100000)
    
    return {
        'churn_predictions': results,
        'summary': {
            'high_risk_count': sum(1 for r in results if r['risk_level'] == 'High'),
            'medium_risk_count': sum(1 for r in results if r['risk_level'] == 'Medium'),
            'low_risk_count': sum(1 for r in results if r['risk_level'] == 'Low'),
            'total_at_risk_revenue': round(total_revenue_at_risk, 2),
            'high_value_at_risk': round(high_value_at_risk, 2),
            'total_customers': len(results),
            'avg_churn_probability': round(np.mean([r['churn_probability'] for r in results]), 3) if results else 0
        },
        'timestamp': datetime.now(timezone.utc).isoformat()
    }

def get_retention_strategies(customer, churn_prob, risk_factors):
    """Enhanced retention strategies based on specific risk factors"""
    strategies = []
    
    # High-risk immediate actions
    if churn_prob > 0.7:
        strategies.append({
            'priority': 'Critical',
            'action': 'Assign dedicated account manager immediately',
            'timeline': 'Within 24 hours',
            'estimated_impact': 'High'
        })
        strategies.append({
            'priority': 'Critical',
            'action': 'Schedule urgent executive-level call',
            'timeline': 'Within 48 hours',
            'estimated_impact': 'High'
        })
        strategies.append({
            'priority': 'High',
            'action': 'Offer retention discount (10-15%)',
            'timeline': 'Within 3 days',
            'estimated_impact': 'Medium-High'
        })
    
    # Factor-specific strategies
    for factor in risk_factors:
        factor_text = factor.get('factor', '')
        if 'No order for' in factor_text:
            strategies.append({
                'priority': 'High',
                'action': 'Re-engagement campaign with new product offerings',
                'timeline': 'Within 1 week',
                'estimated_impact': 'Medium'
            })
        if 'Payment delays' in factor_text:
            strategies.append({
                'priority': 'High',
                'action': 'Review payment terms and offer flexible payment options',
                'timeline': 'Within 3 days',
                'estimated_impact': 'High'
            })
        if 'Low engagement' in factor_text:
            strategies.append({
                'priority': 'Medium',
                'action': 'Increase touchpoint frequency (weekly check-ins)',
                'timeline': 'Ongoing',
                'estimated_impact': 'Medium'
            })
        if 'unresolved issues' in factor_text:
            strategies.append({
                'priority': 'Critical',
                'action': 'Resolve all pending queries/complaints immediately',
                'timeline': 'Within 24 hours',
                'estimated_impact': 'High'
            })
    
    # Default strategies if none specific
    if not strategies:
        strategies.append({
            'priority': 'Low',
            'action': 'Continue regular communication and monitoring',
            'timeline': 'Ongoing',
            'estimated_impact': 'Low'
        })
    
    return strategies[:5]  # Top 5 strategies
