import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone
import os
import joblib

def load_model(model_name):
    """Load trained model or return None if not available"""
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', model_name)
    if os.path.exists(model_path):
        return joblib.load(model_path)
    return None

def calculate_revenue_at_risk(data):
    """
    Calculate revenue at risk from invoices/deals data
    Input: {
        'invoices': [...],
        'deals': [...],
        'payments': [...]
    }
    """
    invoices = data.get('invoices', [])
    deals = data.get('deals', [])
    payments = data.get('payments', [])
    
    now = datetime.now(timezone.utc)
    revenue_at_risk = 0
    high_risk_items = []
    
    # Process deals
    for deal in deals:
        deal_amount = deal.get('total_amount', 0) or deal.get('totalAmount', 0) or 0
        if deal_amount == 0:
            continue
        
        status = deal.get('status', '').lower()
        priority = deal.get('priority', '').lower()
        
        # Calculate risk probability (rule-based for now)
        risk_prob = 0.0
        
        # Status-based risk
        if status == 'pending':
            risk_prob = 0.6
        elif status == 'processing':
            risk_prob = 0.4
        elif status == 'hold':
            risk_prob = 0.8
        
        # Age-based risk
        created_at = deal.get('createdAt') or deal.get('created_at')
        if created_at:
            created_dt = pd.to_datetime(created_at)
            if created_dt.tz is None:
                created_dt = created_dt.tz_localize('UTC')
            days_old = (now - created_dt).days
            if days_old > 90:
                risk_prob = min(risk_prob + 0.3, 1.0)
            elif days_old > 60:
                risk_prob = min(risk_prob + 0.2, 1.0)
            elif days_old > 30:
                risk_prob = min(risk_prob + 0.1, 1.0)
        
        # Follow-up delay risk
        follow_up = deal.get('follow_up_date')
        if follow_up:
            follow_up_dt = pd.to_datetime(follow_up)
            if follow_up_dt.tz is None:
                follow_up_dt = follow_up_dt.tz_localize('UTC')
            days_overdue = (now - follow_up_dt).days
            if days_overdue > 0:
                risk_prob = min(risk_prob + 0.2, 1.0)
        
        # Priority adjustment
        if priority == 'hot':
            risk_prob = min(risk_prob + 0.1, 1.0)
        
        risk_amount = deal_amount * risk_prob
        revenue_at_risk += risk_amount
        
        if risk_prob > 0.6:
            high_risk_items.append({
                'id': deal.get('_id') or deal.get('id'),
                'type': 'deal',
                'name': deal.get('school_name') or deal.get('customerName', 'Unknown'),
                'amount': deal_amount,
                'risk_probability': round(risk_prob, 2),
                'risk_amount': round(risk_amount, 2),
                'status': deal.get('status'),
                'priority': deal.get('priority')
            })
    
    # Process pending payments
    for payment in payments:
        if payment.get('status', '').lower() != 'pending':
            continue
        
        amount = payment.get('amount', 0)
        payment_date = payment.get('paymentDate') or payment.get('payment_date')
        
        risk_prob = 0.3
        if payment_date:
            payment_dt = pd.to_datetime(payment_date)
            if payment_dt.tz is None:
                payment_dt = payment_dt.tz_localize('UTC')
            days_delayed = (now - payment_dt).days
            if days_delayed > 30:
                risk_prob = 0.8
            elif days_delayed > 15:
                risk_prob = 0.5
        
        risk_amount = amount * risk_prob
        revenue_at_risk += risk_amount
        
        if risk_prob > 0.6:
            high_risk_items.append({
                'id': payment.get('_id') or payment.get('id'),
                'type': 'payment',
                'name': payment.get('customerName', 'Unknown'),
                'amount': amount,
                'risk_probability': round(risk_prob, 2),
                'risk_amount': round(risk_amount, 2),
                'status': payment.get('status')
            })
    
    # Risk breakdown
    risk_breakdown = {
        'high_risk': sum(1 for item in high_risk_items if item['risk_probability'] > 0.7),
        'medium_risk': sum(1 for item in high_risk_items if 0.4 < item['risk_probability'] <= 0.7),
        'low_risk': len(high_risk_items) - sum(1 for item in high_risk_items if item['risk_probability'] > 0.4)
    }
    
    return {
        'total_revenue_at_risk': round(revenue_at_risk, 2),
        'high_risk_items': sorted(high_risk_items, key=lambda x: x['risk_amount'], reverse=True)[:20],
        'risk_breakdown': risk_breakdown,
        'total_items_analyzed': len(deals) + len(payments),
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
