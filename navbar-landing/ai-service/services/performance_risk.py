import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from datetime import datetime
from utils.feature_engineering import extract_performance_features

def detect_performance_anomalies(data):
    """
    Detect performance anomalies for managers/zones
    Input: {
        'performance_data': [
            {
                'id': '...',
                'name': '...',
                'zone': '...',
                'metrics': {
                    'conversion_rate': 0.3,
                    'avg_deal_size': 50000,
                    'avg_payment_delay': 15,
                    'dc_completion_rate': 0.8,
                    'lead_count': 50,
                    'closed_deals': 15
                }
            }
        ]
    }
    """
    performance_data = data.get('performance_data', [])
    
    if len(performance_data) < 3:
        # Not enough data for anomaly detection, use statistical approach
        return statistical_risk_analysis(performance_data)
    
    # Extract features
    features_df = extract_performance_features(performance_data)
    
    if features_df.empty:
        return statistical_risk_analysis(performance_data)
    
    # Use Isolation Forest for anomaly detection
    contamination = min(0.2, max(0.05, 2 / len(performance_data)))  # 5-20% contamination
    model = IsolationForest(contamination=contamination, random_state=42)
    
    try:
        model.fit(features_df)
        anomaly_scores = model.decision_function(features_df)
        predictions = model.predict(features_df)
    except:
        return statistical_risk_analysis(performance_data)
    
    results = []
    for i, perf_data in enumerate(performance_data):
        score = float(anomaly_scores[i])
        is_anomaly = bool(predictions[i] == -1)
        
        # Normalize score to 0-1 range (higher = more risky)
        normalized_score = (score - anomaly_scores.min()) / (anomaly_scores.max() - anomaly_scores.min()) if anomaly_scores.max() != anomaly_scores.min() else 0.5
        risk_index = 1 - normalized_score  # Invert so lower scores = higher risk
        
        results.append({
            'manager_id': perf_data.get('id') or perf_data.get('_id'),
            'manager_name': perf_data.get('name', 'Unknown'),
            'zone': perf_data.get('zone', ''),
            'risk_index': round(risk_index, 3),
            'is_anomaly': is_anomaly,
            'metrics': perf_data.get('metrics', {}),
            'risk_level': 'High' if risk_index > 0.7 or is_anomaly else 'Medium' if risk_index > 0.4 else 'Low',
            'recommendations': get_performance_recommendations(perf_data.get('metrics', {}), risk_index)
        })
    
    # Sort by risk index (highest first)
    results.sort(key=lambda x: x['risk_index'], reverse=True)
    
    return {
        'performance_risks': results,
        'high_risk_count': sum(1 for r in results if r['risk_level'] == 'High'),
        'anomaly_count': sum(1 for r in results if r['is_anomaly']),
        'timestamp': datetime.now().isoformat()
    }

def statistical_risk_analysis(performance_data):
    """Fallback statistical analysis when not enough data for ML"""
    if not performance_data:
        return {
            'performance_risks': [],
            'high_risk_count': 0,
            'anomaly_count': 0,
            'timestamp': datetime.now().isoformat()
        }
    
    # Calculate averages
    all_metrics = [p.get('metrics', {}) for p in performance_data]
    avg_conversion = np.mean([m.get('conversion_rate', 0) for m in all_metrics])
    avg_deal_size = np.mean([m.get('avg_deal_size', 0) for m in all_metrics])
    avg_delay = np.mean([m.get('avg_payment_delay', 0) for m in all_metrics])
    
    results = []
    for perf_data in performance_data:
        metrics = perf_data.get('metrics', {})
        risk_factors = []
        
        # Conversion rate below average
        if metrics.get('conversion_rate', 0) < avg_conversion * 0.7:
            risk_factors.append('low_conversion')
        
        # Payment delay above average
        if metrics.get('avg_payment_delay', 0) > avg_delay * 1.5:
            risk_factors.append('high_payment_delay')
        
        # Deal size below average
        if metrics.get('avg_deal_size', 0) < avg_deal_size * 0.7:
            risk_factors.append('low_deal_size')
        
        risk_index = len(risk_factors) / 3.0  # Normalize to 0-1
        
        results.append({
            'manager_id': perf_data.get('id') or perf_data.get('_id'),
            'manager_name': perf_data.get('name', 'Unknown'),
            'zone': perf_data.get('zone', ''),
            'risk_index': round(risk_index, 3),
            'is_anomaly': risk_index > 0.6,
            'metrics': metrics,
            'risk_level': 'High' if risk_index > 0.6 else 'Medium' if risk_index > 0.3 else 'Low',
            'risk_factors': risk_factors,
            'recommendations': get_performance_recommendations(metrics, risk_index)
        })
    
    results.sort(key=lambda x: x['risk_index'], reverse=True)
    
    return {
        'performance_risks': results,
        'high_risk_count': sum(1 for r in results if r['risk_level'] == 'High'),
        'anomaly_count': sum(1 for r in results if r['is_anomaly']),
        'timestamp': datetime.now().isoformat()
    }

def get_performance_recommendations(metrics, risk_index):
    """Get recommendations for performance improvement"""
    recommendations = []
    
    if metrics.get('conversion_rate', 0) < 0.2:
        recommendations.append('Focus on improving lead conversion rate')
        recommendations.append('Review sales process and training needs')
    
    if metrics.get('avg_payment_delay', 0) > 20:
        recommendations.append('Implement stricter payment follow-up process')
        recommendations.append('Review payment terms with customers')
    
    if metrics.get('dc_completion_rate', 0) < 0.7:
        recommendations.append('Improve DC completion rate')
        recommendations.append('Review operational bottlenecks')
    
    if risk_index > 0.7:
        recommendations.append('Schedule performance review meeting')
        recommendations.append('Provide additional support and resources')
    
    return recommendations if recommendations else ['Continue monitoring performance']
