import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def get_executive_dashboard_data(data):
    """
    Generate executive war-room dashboard data
    Input: {
        'daily_metrics': [...],  # Daily revenue, deals, payments
        'revenue_data': [...],
        'deals_data': [...]
    }
    """
    daily_metrics = data.get('daily_metrics', [])
    revenue_data = data.get('revenue_data', [])
    deals_data = data.get('deals_data', [])
    
    # Calculate trends
    if len(daily_metrics) >= 2:
        recent_avg = np.mean([m.get('revenue', 0) for m in daily_metrics[-7:]])
        previous_avg = np.mean([m.get('revenue', 0) for m in daily_metrics[-14:-7]]) if len(daily_metrics) >= 14 else recent_avg
        revenue_trend = ((recent_avg - previous_avg) / previous_avg * 100) if previous_avg > 0 else 0
    else:
        revenue_trend = 0
    
    # Simple forecasting (moving average)
    if len(daily_metrics) >= 7:
        forecast_days = 30
        recent_revenues = [m.get('revenue', 0) for m in daily_metrics[-7:]]
        avg_revenue = np.mean(recent_revenues)
        
        forecast = []
        for i in range(forecast_days):
            forecast.append({
                'date': (datetime.now() + timedelta(days=i+1)).isoformat(),
                'forecasted_revenue': round(avg_revenue, 2),
                'lower_bound': round(avg_revenue * 0.8, 2),
                'upper_bound': round(avg_revenue * 1.2, 2)
            })
    else:
        forecast = []
    
    # Key metrics
    total_revenue = sum(m.get('revenue', 0) for m in daily_metrics)
    total_deals = sum(m.get('deals', 0) for m in daily_metrics)
    total_payments = sum(m.get('payments', 0) for m in daily_metrics)
    
    # Critical issues
    critical_issues = []
    
    # High-risk deals
    high_risk_deals = [d for d in deals_data if d.get('risk_score', 0) > 0.7]
    if high_risk_deals:
        critical_issues.append({
            'type': 'high_risk_deals',
            'count': len(high_risk_deals),
            'message': f'{len(high_risk_deals)} deals at high risk of failure'
        })
    
    # Revenue decline
    if revenue_trend < -10:
        critical_issues.append({
            'type': 'revenue_decline',
            'severity': 'high',
            'message': f'Revenue declining by {abs(revenue_trend):.1f}%'
        })
    
    # Pending approvals
    pending_approvals = sum(1 for d in deals_data if d.get('status', '').lower() == 'pending')
    if pending_approvals > 10:
        critical_issues.append({
            'type': 'pending_approvals',
            'count': pending_approvals,
            'message': f'{pending_approvals} deals pending approval'
        })
    
    return {
        'key_metrics': {
            'total_revenue': round(total_revenue, 2),
            'total_deals': total_deals,
            'total_payments': total_payments,
            'revenue_trend': round(revenue_trend, 2),
            'avg_daily_revenue': round(np.mean([m.get('revenue', 0) for m in daily_metrics[-7:]]), 2) if daily_metrics else 0
        },
        'forecast': forecast,
        'trend': 'increasing' if revenue_trend > 0 else 'decreasing',
        'critical_issues': critical_issues,
        'alerts': generate_alerts(daily_metrics, deals_data),
        'timestamp': datetime.now().isoformat()
    }

def generate_alerts(daily_metrics, deals_data):
    """Generate alerts for executive dashboard"""
    alerts = []
    
    if len(daily_metrics) >= 2:
        recent = daily_metrics[-1].get('revenue', 0)
        previous = daily_metrics[-2].get('revenue', 0)
        if previous > 0 and (recent - previous) / previous < -0.2:
            alerts.append({
                'type': 'warning',
                'message': 'Significant revenue drop detected today'
            })
    
    overdue_deals = [d for d in deals_data if d.get('days_overdue', 0) > 30]
    if overdue_deals:
        alerts.append({
            'type': 'critical',
            'message': f'{len(overdue_deals)} deals overdue by more than 30 days'
        })
    
    return alerts
