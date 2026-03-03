import pandas as pd
import numpy as np
from datetime import datetime, timezone
import os
import joblib

def load_model(model_name):
    """Load trained model or return None if not available"""
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', model_name)
    if os.path.exists(model_path):
        return joblib.load(model_path)
    return None

def calculate_delay_costs(data):
    """
    Calculate operational delay costs
    Input: {
        'operational_events': [
            {
                'id': '...',
                'type': 'dc' | 'approval' | 'service',
                'created_at': '...',
                'completed_at': '...',
                'expected_completion': '...',
                'amount': 0,
                'status': '...'
            }
        ]
    }
    """
    events = data.get('operational_events', [])
    
    # Try to load trained model
    model = load_model('delay_cost_model.pkl')
    
    results = []
    now = datetime.now(timezone.utc)
    total_delay_cost = 0
    
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
    
    for event in events:
        created_at = event.get('created_at') or event.get('createdAt')
        completed_at = event.get('completed_at') or event.get('completedAt')
        expected_completion = event.get('expected_completion') or event.get('expected_completion_date')
        
        if not created_at:
            continue
        
        created = normalize_datetime(created_at)
        
        # Calculate delay days
        if completed_at:
            completed = normalize_datetime(completed_at)
            actual_delay = (completed - created).days
            if expected_completion:
                expected = normalize_datetime(expected_completion)
                delay_days = max(0, (completed - expected).days)
            else:
                delay_days = max(0, actual_delay - 7)  # Assume 7 days is normal
        else:
            # Still pending
            if expected_completion:
                expected = normalize_datetime(expected_completion)
                delay_days = max(0, (now - expected).days)
            else:
                delay_days = max(0, (now - created).days - 7)
        
        # Calculate cost (rule-based or ML)
        amount = event.get('amount') or event.get('total_amount') or event.get('totalAmount', 0)
        event_type = event.get('type', '').lower()
        
        # Base cost calculation
        if model:
            try:
                # Use ML model if available
                features = np.array([[delay_days, amount, 1 if event_type == 'dc' else 0]])
                cost = model.predict(features)[0]
            except:
                cost = calculate_rule_based_cost(delay_days, amount, event_type)
        else:
            cost = calculate_rule_based_cost(delay_days, amount, event_type)
        
        total_delay_cost += cost
        
        # Cost breakdown
        cost_breakdown = {
            'opportunity_cost': cost * 0.4,  # Lost opportunity
            'operational_cost': cost * 0.3,  # Extra operational overhead
            'customer_impact': cost * 0.2,  # Customer satisfaction impact
            'revenue_impact': cost * 0.1    # Direct revenue impact
        }
        
        results.append({
            'event_id': event.get('id') or event.get('_id'),
            'event_type': event_type,
            'delay_days': delay_days,
            'estimated_cost': round(cost, 2),
            'amount': amount,
            'status': event.get('status', ''),
            'cost_breakdown': {k: round(v, 2) for k, v in cost_breakdown.items()},
            'created_at': created_at,
            'completed_at': completed_at
        })
    
    # Sort by cost (highest first)
    results.sort(key=lambda x: x['estimated_cost'], reverse=True)
    
    return {
        'delay_costs': results,
        'total_delay_cost': round(total_delay_cost, 2),
        'average_delay_cost': round(total_delay_cost / len(results), 2) if results else 0,
        'high_cost_events': [r for r in results if r['estimated_cost'] > 10000][:10],
        'timestamp': datetime.now(timezone.utc).isoformat()
    }

def calculate_rule_based_cost(delay_days, amount, event_type):
    """Calculate cost using rule-based approach"""
    if delay_days <= 0:
        return 0
    
    # Base cost per day
    base_cost_per_day = amount * 0.001  # 0.1% of amount per day
    
    # Type-specific multipliers
    if event_type == 'dc':
        multiplier = 1.2  # DC delays are more costly
    elif event_type == 'approval':
        multiplier = 1.0
    else:
        multiplier = 0.8
    
    # Exponential increase for long delays
    if delay_days > 30:
        multiplier *= 1.5
    elif delay_days > 15:
        multiplier *= 1.2
    
    cost = base_cost_per_day * delay_days * multiplier
    
    # Minimum cost threshold
    return max(cost, delay_days * 100)  # At least ₹100 per day
