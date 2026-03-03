from datetime import datetime

def generate_business_narrative(data_summary):
    """
    Generate narrative business intelligence summary
    Input: {
        'revenue_trend': 'increasing' | 'decreasing',
        'revenue_change': 0.0,
        'revenue_at_risk': 0.0,
        'high_risk_deals': [...],
        'high_risk_managers': [...],
        'pending_approvals': 0,
        'cashflow_issues': [...],
        'key_metrics': {...}
    }
    """
    narrative_parts = []
    key_insights = []
    recommended_actions = []
    
    # Revenue narrative
    revenue_trend = data_summary.get('revenue_trend', 'stable')
    revenue_change = data_summary.get('revenue_change', 0)
    
    if revenue_trend == 'increasing':
        narrative_parts.append(
            f"Revenue has increased by {abs(revenue_change):.1f}% compared to the previous period, "
            f"indicating positive business momentum."
        )
        key_insights.append('Revenue growth is positive')
    elif revenue_trend == 'decreasing':
        narrative_parts.append(
            f"Revenue has decreased by {abs(revenue_change):.1f}% compared to the previous period, "
            f"requiring immediate attention to identify and address the root causes."
        )
        key_insights.append('Revenue decline detected - investigation needed')
        recommended_actions.append('Analyze revenue decline factors and implement corrective measures')
    else:
        narrative_parts.append("Revenue is stable with minimal changes from the previous period.")
    
    # Revenue at risk
    revenue_at_risk = data_summary.get('revenue_at_risk', 0)
    if revenue_at_risk > 100000:
        narrative_parts.append(
            f"₹{revenue_at_risk:,.0f} is currently at risk due to delayed approvals, pending renewals, "
            f"and operational bottlenecks. Immediate intervention is recommended to protect this revenue."
        )
        key_insights.append(f'High revenue at risk: ₹{revenue_at_risk:,.0f}')
        recommended_actions.append('Prioritize high-risk deals and expedite approval processes')
    elif revenue_at_risk > 50000:
        narrative_parts.append(
            f"₹{revenue_at_risk:,.0f} is at moderate risk. Regular monitoring and follow-up actions "
            f"should be implemented to minimize potential losses."
        )
        key_insights.append(f'Moderate revenue at risk: ₹{revenue_at_risk:,.0f}')
    
    # High-risk deals
    high_risk_deals = data_summary.get('high_risk_deals', [])
    if high_risk_deals:
        count = len(high_risk_deals)
        narrative_parts.append(
            f"{count} deal{'s' if count > 1 else ''} {'are' if count > 1 else 'is'} at high risk of failure. "
            f"These require immediate follow-up and management attention to improve closure rates."
        )
        key_insights.append(f'{count} deals at high risk')
        recommended_actions.append('Assign senior resources to high-risk deals')
    
    # Performance risks
    high_risk_managers = data_summary.get('high_risk_managers', [])
    if high_risk_managers:
        count = len(high_risk_managers)
        narrative_parts.append(
            f"{count} manager{'s' if count > 1 else ''} {'are' if count > 1 else 'is'} showing performance "
            f"anomalies or risk indicators. Performance review meetings and support should be scheduled."
        )
        key_insights.append(f'{count} managers with performance concerns')
        recommended_actions.append('Schedule performance reviews for at-risk managers')
    
    # Pending approvals
    pending_approvals = data_summary.get('pending_approvals', 0)
    if pending_approvals > 10:
        narrative_parts.append(
            f"There are {pending_approvals} deals pending approval, which may be causing delays in "
            f"revenue recognition and customer satisfaction."
        )
        key_insights.append(f'{pending_approvals} approvals pending')
        recommended_actions.append('Expedite approval process for pending deals')
    
    # Cashflow issues
    cashflow_issues = data_summary.get('cashflow_issues', [])
    if cashflow_issues:
        narrative_parts.append(
            f"Cashflow bottlenecks have been identified, with {len(cashflow_issues)} critical payment delays "
            f"affecting working capital management."
        )
        key_insights.append('Cashflow bottlenecks detected')
        recommended_actions.append('Implement stricter payment follow-up process')
    
    # Fraud/anomaly alerts
    fraud_alerts = data_summary.get('fraud_alerts', [])
    if fraud_alerts:
        suspicious_count = sum(1 for a in fraud_alerts if a.get('is_suspicious', False))
        if suspicious_count > 0:
            narrative_parts.append(
                f"{suspicious_count} suspicious transaction{'s' if suspicious_count > 1 else ''} "
                f"{'have' if suspicious_count > 1 else 'has'} been flagged for review."
            )
            key_insights.append(f'{suspicious_count} suspicious transactions')
            recommended_actions.append('Review flagged transactions for potential fraud')
    
    # Churn risks
    churn_risks = data_summary.get('churn_risks', [])
    if churn_risks:
        high_churn = sum(1 for c in churn_risks if c.get('risk_level') == 'High')
        if high_churn > 0:
            narrative_parts.append(
                f"{high_churn} customer{'s' if high_churn > 1 else ''} {'are' if high_churn > 1 else 'is'} "
                f"at high risk of churning. Retention efforts should be prioritized."
            )
            key_insights.append(f'{high_churn} customers at high churn risk')
            recommended_actions.append('Implement retention strategies for at-risk customers')
    
    # Operational delays
    delay_costs = data_summary.get('total_delay_cost', 0)
    if delay_costs > 50000:
        narrative_parts.append(
            f"Operational delays have resulted in an estimated cost of ₹{delay_costs:,.0f}, "
            f"highlighting the need for process optimization."
        )
        key_insights.append(f'High operational delay costs: ₹{delay_costs:,.0f}')
        recommended_actions.append('Review and optimize operational processes to reduce delays')
    
    # Generate summary
    if not narrative_parts:
        narrative_parts.append("Business operations are running smoothly with no critical issues identified.")
        key_insights.append('No critical issues detected')
        recommended_actions.append('Continue monitoring key metrics')
    
    summary = ' '.join(narrative_parts)
    
    # Add overall assessment
    if revenue_trend == 'decreasing' or revenue_at_risk > 100000 or len(high_risk_deals) > 5:
        overall_assessment = "Overall business health requires attention with multiple risk factors present."
    elif revenue_trend == 'increasing' and revenue_at_risk < 50000 and len(high_risk_deals) < 3:
        overall_assessment = "Overall business health is positive with manageable risk factors."
    else:
        overall_assessment = "Overall business health is stable with some areas requiring monitoring."
    
    return {
        'summary': summary,
        'overall_assessment': overall_assessment,
        'key_insights': key_insights[:10],  # Top 10 insights
        'recommended_actions': recommended_actions[:10],  # Top 10 actions
        'timestamp': datetime.now().isoformat()
    }
