import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone

def extract_deal_features(deals):
    """Extract features for deal risk scoring"""
    features = []
    now = datetime.now(timezone.utc)
    
    def normalize_dt(dt):
        if dt is None:
            return None
        dt = pd.to_datetime(dt)
        if dt.tz is None:
            dt = dt.tz_localize('UTC')
        else:
            dt = dt.tz_convert('UTC')
        return dt
    
    for deal in deals:
        created_at = deal.get('createdAt') or datetime.now(timezone.utc)
        created_dt = normalize_dt(created_at)
        deal_age = (now - created_dt).days
        
        days_since_followup = None
        if deal.get('follow_up_date'):
            follow_up_dt = normalize_dt(deal['follow_up_date'])
            days_since_followup = (now - follow_up_dt).days
        
        features.append({
            'deal_age': deal_age,
            'days_since_followup': days_since_followup or deal_age,
            'total_amount': deal.get('total_amount', 0) or deal.get('totalAmount', 0) or 0,
            'priority_score': 1 if deal.get('priority') == 'Hot' else 0.5 if deal.get('priority') == 'Warm' else 0,
            'status_score': 1 if deal.get('status') == 'Closed' else 0.5 if deal.get('status') == 'Processing' else 0,
            'product_count': len(deal.get('products', [])) or 0,
            'has_po': 1 if deal.get('po_number') or deal.get('poDocument') else 0,
        })
    return pd.DataFrame(features)

def extract_customer_features(customers):
    """Extract features for churn prediction"""
    features = []
    for customer in customers:
        last_interaction = customer.get('last_interaction_date')
        days_since_interaction = None
        if last_interaction:
            days_since_interaction = (datetime.now() - pd.to_datetime(last_interaction)).days
        
        features.append({
            'total_orders': customer.get('total_orders', 0),
            'total_revenue': customer.get('total_revenue', 0),
            'avg_order_value': customer.get('avg_order_value', 0),
            'days_since_last_order': customer.get('days_since_last_order', 0),
            'days_since_interaction': days_since_interaction or 999,
            'payment_delay_avg': customer.get('avg_payment_delay', 0),
            'complaint_count': customer.get('complaint_count', 0),
            'renewal_count': customer.get('renewal_count', 0),
        })
    return pd.DataFrame(features)

def extract_performance_features(performance_data):
    """Extract features for performance risk detection"""
    features = []
    for data in performance_data:
        metrics = data.get('metrics', {})
        features.append({
            'conversion_rate': metrics.get('conversion_rate', 0),
            'avg_deal_size': metrics.get('avg_deal_size', 0),
            'payment_delay_avg': metrics.get('avg_payment_delay', 0),
            'dc_completion_rate': metrics.get('dc_completion_rate', 0),
            'lead_count': metrics.get('lead_count', 0),
            'closed_deals': metrics.get('closed_deals', 0),
        })
    return pd.DataFrame(features)

def extract_transaction_features(transactions):
    """Extract features for fraud detection"""
    features = []
    now = datetime.now(timezone.utc)
    for txn in transactions:
        txn_date = txn.get('date') or now
        txn_dt = pd.to_datetime(txn_date)
        # Normalize to timezone-aware if needed
        if txn_dt.tz is None:
            txn_dt = txn_dt.tz_localize('UTC')
        else:
            txn_dt = txn_dt.tz_convert('UTC')
        
        features.append({
            'amount': txn.get('amount', 0),
            'amount_log': np.log1p(txn.get('amount', 0)),
            'is_weekend': 1 if txn_dt.weekday() >= 5 else 0,
            'is_after_hours': 1 if txn_dt.hour > 18 else 0,
            'frequency_score': txn.get('frequency_score', 0),
        })
    return pd.DataFrame(features)

def calculate_urgency(task):
    """Calculate urgency score for priority engine"""
    now = datetime.now(timezone.utc)
    due_date = task.get('due_date') or task.get('follow_up_date')
    if not due_date:
        return 0.5
    
    due = pd.to_datetime(due_date)
    # Normalize to timezone-aware UTC
    if due.tz is None:
        due = due.tz_localize('UTC')
    else:
        due = due.tz_convert('UTC')
    
    days_until_due = (due - now).days
    
    if days_until_due < 0:
        return 1.0  # Overdue
    elif days_until_due <= 1:
        return 0.9
    elif days_until_due <= 3:
        return 0.7
    elif days_until_due <= 7:
        return 0.5
    else:
        return 0.3

def calculate_business_impact(task):
    """Calculate business impact score"""
    amount = task.get('amount') or task.get('total_amount') or task.get('totalAmount') or 0
    if amount > 100000:
        return 1.0
    elif amount > 50000:
        return 0.8
    elif amount > 20000:
        return 0.6
    elif amount > 10000:
        return 0.4
    else:
        return 0.2

def calculate_risk(task):
    """Calculate risk score"""
    status = task.get('status', '').lower()
    priority = task.get('priority', '').lower()
    
    risk = 0.5
    if status in ['pending', 'hold']:
        risk += 0.3
    if priority == 'hot':
        risk += 0.2
    
    return min(risk, 1.0)
