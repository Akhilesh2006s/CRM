import pandas as pd
import numpy as np
from datetime import datetime, timezone
import os
import joblib
from utils.feature_engineering import extract_deal_features

def load_model(model_name):
    """Load trained model or return None if not available"""
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', model_name)
    if os.path.exists(model_path):
        return joblib.load(model_path)
    return None

def score_deal_risk(data):
    """
    Score deal and renewal risk
    Input: {
        'deals': [...]
    }
    """
    deals = data.get('deals', [])
    
    # Try to load trained model
    model = load_model('deal_risk_model.pkl')
    
    results = []
    now = datetime.now(timezone.utc)
    
    def normalize_datetime(dt):
        """Normalize datetime to timezone-aware UTC"""
        if dt is None:
            return None
        dt = pd.to_datetime(dt)
        if dt.tz is None:
            dt = dt.tz_localize('UTC')
        else:
            dt = dt.tz_convert('UTC')
        return dt
    
    for deal in deals:
        # Rule-based scoring (fallback if no model)
        risk_score = 0.0
        
        # Status-based risk
        status = deal.get('status', '').lower()
        if status == 'pending':
            risk_score = 0.5
        elif status == 'processing':
            risk_score = 0.3
        elif status == 'hold':
            risk_score = 0.8
        
        # Age-based risk
        created_at = deal.get('createdAt') or deal.get('created_at')
        if created_at:
            created_dt = normalize_datetime(created_at)
            days_old = (now - created_dt).days
            if days_old > 90:
                risk_score = min(risk_score + 0.4, 1.0)
            elif days_old > 60:
                risk_score = min(risk_score + 0.3, 1.0)
            elif days_old > 30:
                risk_score = min(risk_score + 0.2, 1.0)
        
        # Follow-up delay
        follow_up = deal.get('follow_up_date')
        if follow_up:
            follow_up_dt = normalize_datetime(follow_up)
            days_overdue = (now - follow_up_dt).days
            if days_overdue > 0:
                risk_score = min(risk_score + 0.2, 1.0)
        
        # Priority adjustment
        priority = deal.get('priority', '').lower()
        if priority == 'hot':
            risk_score = min(risk_score + 0.1, 1.0)
        elif priority == 'cold':
            risk_score = min(risk_score + 0.1, 1.0)
        
        # Payment status risk
        payment_status = deal.get('paymentStatus', '').lower()
        if payment_status == 'overdue':
            risk_score = min(risk_score + 0.3, 1.0)
        elif payment_status == 'pending':
            risk_score = min(risk_score + 0.1, 1.0)
        
        # If model exists, use it for more accurate prediction
        if model:
            try:
                features_df = extract_deal_features([deal])
                if not features_df.empty:
                    ml_score = model.predict_proba(features_df)[0][1]
                    risk_score = (risk_score * 0.3) + (ml_score * 0.7)  # Blend rule-based and ML
            except:
                pass  # Fallback to rule-based
        
        risk_level = 'High' if risk_score > 0.7 else 'Medium' if risk_score > 0.4 else 'Low'
        
        results.append({
            'deal_id': deal.get('_id') or deal.get('id'),
            'deal_name': deal.get('school_name') or deal.get('customerName', 'Unknown'),
            'risk_score': round(risk_score, 3),
            'risk_level': risk_level,
            'status': deal.get('status'),
            'priority': deal.get('priority'),
            'amount': deal.get('total_amount') or deal.get('totalAmount', 0),
            'recommendations': get_recommendations(deal, risk_score)
        })
    
    # Sort by risk score (highest first)
    results.sort(key=lambda x: x['risk_score'], reverse=True)
    
    return {
        'deal_risks': results,
        'high_risk_count': sum(1 for r in results if r['risk_level'] == 'High'),
        'medium_risk_count': sum(1 for r in results if r['risk_level'] == 'Medium'),
        'low_risk_count': sum(1 for r in results if r['risk_level'] == 'Low'),
        'timestamp': datetime.now(timezone.utc).isoformat()
    }

def get_recommendations(deal, risk_score):
    """Get recommendations based on deal risk"""
    recommendations = []
    
    if risk_score > 0.7:
        recommendations.append('Immediate follow-up required')
        recommendations.append('Escalate to senior management')
    elif risk_score > 0.4:
        recommendations.append('Schedule follow-up within 24 hours')
        recommendations.append('Review payment terms')
    
    if deal.get('status', '').lower() == 'pending':
        recommendations.append('Expedite approval process')
    
    follow_up = deal.get('follow_up_date')
    if follow_up:
        from datetime import datetime, timezone
        follow_up_dt = pd.to_datetime(follow_up)
        if follow_up_dt.tz is None:
            follow_up_dt = follow_up_dt.tz_localize('UTC')
        days_overdue = (datetime.now(timezone.utc) - follow_up_dt).days
        if days_overdue > 0:
            recommendations.append(f'Follow-up overdue by {days_overdue} days')
    
    return recommendations if recommendations else ['Continue monitoring']
