from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Import AI services
from services.revenue_at_risk import calculate_revenue_at_risk
from services.executive_dashboard import get_executive_dashboard_data
from services.priority_engine import calculate_priority_scores
from services.deal_risk_scoring import score_deal_risk
from services.performance_risk import detect_performance_anomalies
from services.fraud_detection import detect_fraud_anomalies
from services.cashflow_analyzer import analyze_cashflow_blockages
from services.delay_cost_calculator import calculate_delay_costs
from services.churn_predictor import predict_churn
from services.narrative_bi import generate_business_narrative

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'message': 'AI Service is running'})

@app.route('/api/revenue-at-risk', methods=['POST'])
def revenue_at_risk():
    try:
        data = request.json
        result = calculate_revenue_at_risk(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/executive-dashboard', methods=['POST'])
def executive_dashboard():
    try:
        data = request.json
        result = get_executive_dashboard_data(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/priority-engine', methods=['POST'])
def priority_engine():
    try:
        data = request.json
        result = calculate_priority_scores(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/deal-risk-scoring', methods=['POST'])
def deal_risk_scoring():
    try:
        data = request.json
        result = score_deal_risk(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/performance-risk', methods=['POST'])
def performance_risk():
    try:
        data = request.json
        result = detect_performance_anomalies(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/fraud-detection', methods=['POST'])
def fraud_detection():
    try:
        data = request.json
        result = detect_fraud_anomalies(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cashflow-analyzer', methods=['POST'])
def cashflow_analyzer():
    try:
        data = request.json
        result = analyze_cashflow_blockages(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delay-cost-calculator', methods=['POST'])
def delay_cost_calculator():
    try:
        data = request.json
        result = calculate_delay_costs(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/churn-predictor', methods=['POST'])
def churn_predictor():
    try:
        data = request.json
        result = predict_churn(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/narrative-bi', methods=['POST'])
def narrative_bi():
    try:
        data = request.json
        result = generate_business_narrative(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('AI_SERVICE_PORT', 5001))
    host = os.getenv('AI_SERVICE_HOST', '0.0.0.0')
    app.run(host=host, port=port, debug=True)
