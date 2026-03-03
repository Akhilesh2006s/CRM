import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from datetime import datetime
from utils.feature_engineering import extract_transaction_features

def convert_to_python_type(value):
    """Convert numpy types to native Python types for JSON serialization"""
    if isinstance(value, (np.integer, np.int_, np.intc, np.intp, np.int8, np.int16, np.int32, np.int64)):
        return int(value)
    elif isinstance(value, (np.floating, np.float_, np.float16, np.float32, np.float64)):
        return float(value)
    elif isinstance(value, (np.bool_, np.bool8)):
        return bool(value)
    elif isinstance(value, np.ndarray):
        return value.tolist()
    return value

def detect_fraud_anomalies(data):
    """
    Detect fraud and anomalies in transactions
    Input: {
        'transactions': [
            {
                'id': '...',
                'type': 'expense' | 'payment' | 'inventory',
                'amount': 0,
                'date': '...',
                'category': '...',
                'user_id': '...'
            }
        ]
    }
    """
    transactions = data.get('transactions', [])
    
    if len(transactions) < 10:
        # Not enough data, use rule-based detection
        return rule_based_fraud_detection(transactions)
    
    # Extract features
    features_df = extract_transaction_features(transactions)
    
    if features_df.empty:
        return rule_based_fraud_detection(transactions)
    
    # Use Isolation Forest
    contamination = min(0.1, max(0.01, 5 / len(transactions)))  # 1-10% contamination
    model = IsolationForest(contamination=contamination, random_state=42)
    
    try:
        model.fit(features_df)
        anomaly_scores = model.decision_function(features_df)
        predictions = model.predict(features_df)
    except:
        return rule_based_fraud_detection(transactions)
    
    results = []
    for i, txn in enumerate(transactions):
        score = float(anomaly_scores[i])
        is_suspicious = bool(int(predictions[i] == -1))  # Convert numpy bool to Python bool
        
        # Normalize to fraud score (0-1, higher = more suspicious)
        normalized_score = (score - float(anomaly_scores.min())) / (float(anomaly_scores.max()) - float(anomaly_scores.min())) if anomaly_scores.max() != anomaly_scores.min() else 0.5
        fraud_score = 1 - normalized_score
        
        # Classify anomaly type - convert features to dict and ensure Python types
        features_dict = features_df.iloc[i].to_dict()
        features_dict = {k: convert_to_python_type(v) for k, v in features_dict.items()}
        anomaly_type = classify_anomaly(txn, fraud_score, features_dict)
        
        results.append({
            'transaction_id': str(txn.get('id') or txn.get('_id') or ''),
            'transaction_type': str(txn.get('type', 'unknown')),
            'amount': float(txn.get('amount', 0)),
            'date': str(txn.get('date') or txn.get('createdAt') or ''),
            'user_id': str(txn.get('user_id') or txn.get('createdBy') or ''),
            'fraud_score': float(round(fraud_score, 3)),
            'is_suspicious': bool(is_suspicious or fraud_score > 0.7),
            'anomaly_type': str(anomaly_type),
            'category': str(txn.get('category', '')),
            'recommendations': get_fraud_recommendations(anomaly_type, fraud_score)
        })
    
    # Sort by fraud score (highest first)
    results.sort(key=lambda x: x['fraud_score'], reverse=True)
    
    suspicious_count = convert_to_python_type(sum(1 for r in results if r['is_suspicious']))
    high_risk_count = convert_to_python_type(sum(1 for r in results if r['fraud_score'] > 0.7))
    
    return {
        'fraud_alerts': results,
        'suspicious_count': suspicious_count,
        'high_risk_count': high_risk_count,
        'timestamp': datetime.now().isoformat()
    }

def rule_based_fraud_detection(transactions):
    """Fallback rule-based fraud detection"""
    results = []
    
    # Calculate statistics
    amounts = [t.get('amount', 0) for t in transactions]
    if amounts:
        mean_amount = float(np.mean(amounts))
        std_amount = float(np.std(amounts))
        threshold = float(mean_amount + (2 * std_amount))  # 2 standard deviations
    else:
        threshold = 0.0
    
    for txn in transactions:
        amount = txn.get('amount', 0)
        fraud_score = 0.0
        anomaly_type = None
        
        # Unusually high amount
        if threshold > 0 and amount > threshold:
            fraud_score = 0.7
            anomaly_type = 'unusually_high_amount'
        
        # Negative amount (shouldn't happen)
        if amount < 0:
            fraud_score = 0.9
            anomaly_type = 'negative_amount'
        
        # Very round numbers (potential red flag)
        if amount > 0 and amount % 10000 == 0 and amount > 50000:
            fraud_score = max(fraud_score, 0.5)
            if not anomaly_type:
                anomaly_type = 'round_number_pattern'
        
        results.append({
            'transaction_id': str(txn.get('id') or txn.get('_id') or ''),
            'transaction_type': str(txn.get('type', 'unknown')),
            'amount': float(amount),
            'date': str(txn.get('date') or txn.get('createdAt') or ''),
            'user_id': str(txn.get('user_id') or txn.get('createdBy') or ''),
            'fraud_score': float(round(fraud_score, 3)),
            'is_suspicious': bool(fraud_score > 0.6),
            'anomaly_type': str(anomaly_type or 'none'),
            'category': str(txn.get('category', '')),
            'recommendations': get_fraud_recommendations(anomaly_type, fraud_score) if anomaly_type else []
        })
    
    results.sort(key=lambda x: x['fraud_score'], reverse=True)
    
    suspicious_count = convert_to_python_type(sum(1 for r in results if r['is_suspicious']))
    high_risk_count = convert_to_python_type(sum(1 for r in results if r['fraud_score'] > 0.7))
    
    return {
        'fraud_alerts': results,
        'suspicious_count': suspicious_count,
        'high_risk_count': high_risk_count,
        'timestamp': datetime.now().isoformat()
    }

def classify_anomaly(txn, fraud_score, features):
    """Classify the type of anomaly"""
    if fraud_score > 0.8:
        return 'high_risk_fraud'
    elif fraud_score > 0.6:
        return 'suspicious_pattern'
    
    # Convert features values to Python types
    amount_log = float(features.get('amount_log', 0) or 0)
    is_after_hours = int(features.get('is_after_hours', 0) or 0)
    
    if amount_log > 12:  # Very large amount
        return 'unusually_high_amount'
    elif is_after_hours == 1 and fraud_score > 0.4:
        return 'after_hours_activity'
    else:
        return 'minor_anomaly'

def get_fraud_recommendations(anomaly_type, fraud_score):
    """Get recommendations for fraud alerts"""
    recommendations = []
    
    if fraud_score > 0.8:
        recommendations.append('Immediate investigation required')
        recommendations.append('Flag for audit review')
    elif fraud_score > 0.6:
        recommendations.append('Review transaction details')
        recommendations.append('Verify with transaction creator')
    
    if anomaly_type == 'unusually_high_amount':
        recommendations.append('Verify amount and approval chain')
    elif anomaly_type == 'negative_amount':
        recommendations.append('Investigate negative amount - data error or refund?')
    elif anomaly_type == 'after_hours_activity':
        recommendations.append('Verify after-hours transaction legitimacy')
    
    return recommendations if recommendations else ['Continue monitoring']
