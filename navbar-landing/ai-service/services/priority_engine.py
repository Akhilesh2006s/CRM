from utils.feature_engineering import calculate_urgency, calculate_business_impact, calculate_risk
from datetime import datetime, timezone

def calculate_priority_scores(data):
    """
    Calculate priority scores for tasks
    Input: {
        'tasks': [
            {
                'id': '...',
                'type': 'deal' | 'payment' | 'dc' | 'lead',
                'due_date': '...',
                'amount': 0,
                'status': '...',
                'priority': '...'
            }
        ]
    }
    """
    tasks = data.get('tasks', [])
    
    scored_tasks = []
    
    for task in tasks:
        urgency = calculate_urgency(task)
        impact = calculate_business_impact(task)
        risk = calculate_risk(task)
        
        # Weighted priority score
        priority_score = (urgency * 0.4) + (impact * 0.4) + (risk * 0.2)
        
        # Type-based adjustment
        task_type = task.get('type', '').lower()
        if task_type == 'payment':
            priority_score *= 1.1  # Payments are slightly more urgent
        elif task_type == 'deal' and task.get('priority', '').lower() == 'hot':
            priority_score *= 1.2
        
        scored_tasks.append({
            'id': task.get('id') or task.get('_id'),
            'type': task_type,
            'name': task.get('name') or task.get('school_name') or task.get('customerName', 'Unknown'),
            'priority_score': round(priority_score, 3),
            'urgency': round(urgency, 2),
            'impact': round(impact, 2),
            'risk': round(risk, 2),
            'due_date': task.get('due_date') or task.get('follow_up_date'),
            'status': task.get('status'),
            'amount': task.get('amount') or task.get('total_amount') or task.get('totalAmount', 0),
            'recommended_action': get_recommended_action(priority_score, task_type)
        })
    
    # Sort by priority score (highest first)
    scored_tasks.sort(key=lambda x: x['priority_score'], reverse=True)
    
    return {
        'prioritized_tasks': scored_tasks,
        'high_priority_count': sum(1 for t in scored_tasks if t['priority_score'] > 0.7),
        'timestamp': datetime.now(timezone.utc).isoformat()
    }

def get_recommended_action(priority_score, task_type):
    """Get recommended action based on priority score"""
    if priority_score > 0.8:
        return 'Immediate action required'
    elif priority_score > 0.6:
        return 'Handle within 24 hours'
    elif priority_score > 0.4:
        return 'Handle within 3 days'
    else:
        return 'Handle within 1 week'
