import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone
from statsmodels.tsa.arima.model import ARIMA

def analyze_cashflow_blockages(data):
    """
    Analyze cashflow blockages and predict bottlenecks
    Input: {
        'payments': [
            {
                'amount': 0,
                'paymentDate': '...',
                'status': '...',
                'expectedDate': '...'
            }
        ]
    }
    """
    payments = data.get('payments', [])
    
    if not payments:
        return {
            'forecast': [],
            'bottlenecks': [],
            'total_pending': 0,
            'total_delayed': 0,
            'recommended_actions': []
        }
    
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
    
    # Analyze payment delays
    pending_payments = []
    delayed_payments = []
    total_pending = 0
    total_delayed = 0
    
    for payment in payments:
        amount = payment.get('amount', 0)
        status = payment.get('status', '').lower()
        payment_date = payment.get('paymentDate') or payment.get('payment_date')
        expected_date = payment.get('expectedDate') or payment.get('expected_date')
        
        if status == 'pending':
            total_pending += amount
            days_delayed = 0
            if payment_date:
                payment_dt = normalize_datetime(payment_date)
                days_delayed = (now - payment_dt).days
            
            pending_payments.append({
                'id': payment.get('_id') or payment.get('id'),
                'amount': amount,
                'days_delayed': days_delayed,
                'customer': payment.get('customerName', 'Unknown')
            })
            
            if days_delayed > 0:
                total_delayed += amount
                delayed_payments.append({
                    'id': payment.get('_id') or payment.get('id'),
                    'amount': amount,
                    'days_delayed': days_delayed,
                    'customer': payment.get('customerName', 'Unknown')
                })
    
    # Simple forecasting (if enough data)
    forecast = []
    if len(payments) >= 7:
        # Aggregate by date
        payment_df = pd.DataFrame([
            {
                'date': normalize_datetime(p.get('paymentDate') or p.get('payment_date') or now),
                'amount': p.get('amount', 0),
                'status': p.get('status', '')
            }
            for p in payments
        ])
        
        if not payment_df.empty:
            daily_payments = payment_df.groupby(payment_df['date'].dt.date)['amount'].sum()
            
            if len(daily_payments) >= 7:
                # Simple moving average forecast
                avg_daily = daily_payments.tail(7).mean()
                
                for i in range(30):
                    forecast_date = now + timedelta(days=i+1)
                    forecast.append({
                        'date': forecast_date.isoformat(),
                        'forecasted_amount': round(avg_daily, 2),
                        'lower_bound': round(avg_daily * 0.7, 2),
                        'upper_bound': round(avg_daily * 1.3, 2)
                    })
    
    # Identify bottlenecks
    bottlenecks = []
    
    # High pending amount
    if total_pending > 100000:
        bottlenecks.append({
            'type': 'high_pending_amount',
            'severity': 'high',
            'amount': total_pending,
            'message': f'₹{total_pending:,.0f} in pending payments'
        })
    
    # Many delayed payments
    if len(delayed_payments) > 10:
        bottlenecks.append({
            'type': 'many_delayed_payments',
            'severity': 'medium',
            'count': len(delayed_payments),
            'message': f'{len(delayed_payments)} payments delayed'
        })
    
    # Long delays
    long_delays = [p for p in delayed_payments if p['days_delayed'] > 30]
    if long_delays:
        bottlenecks.append({
            'type': 'long_delays',
            'severity': 'high',
            'count': len(long_delays),
            'total_amount': sum(p['amount'] for p in long_delays),
            'message': f'{len(long_delays)} payments delayed by more than 30 days'
        })
    
    # Recommended actions
    recommended_actions = []
    if total_pending > 100000:
        recommended_actions.append('Prioritize follow-up on high-value pending payments')
    if len(delayed_payments) > 10:
        recommended_actions.append('Implement automated payment reminder system')
    if long_delays:
        recommended_actions.append('Escalate long-delayed payments to management')
    if not recommended_actions:
        recommended_actions.append('Continue monitoring payment status')
    
    return {
        'forecast': forecast,
        'bottlenecks': bottlenecks,
        'total_pending': round(total_pending, 2),
        'total_delayed': round(total_delayed, 2),
        'pending_payments_count': len(pending_payments),
        'delayed_payments_count': len(delayed_payments),
        'top_delayed_payments': sorted(delayed_payments, key=lambda x: x['days_delayed'], reverse=True)[:10],
        'recommended_actions': recommended_actions,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
