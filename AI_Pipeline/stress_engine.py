"""
stress_engine.py - Algorisk Stress Testing and VaR Engine

Calculates Value at Risk (VaR), Liquidity Risk, Market Risk, and performs Stress Testing scenarios.
Also generates the Global Risk Score.
"""

class StressEngine:
    def __init__(self):
        pass

    def calculate_var(self, portfolio_value: float, confidence_level: float = 0.95, volatility: float = 0.1) -> dict:
        """
        Calculate Value at Risk (VaR).
        Simplified parametric VaR calculation for demonstration.
        """
        import scipy.stats as st
        # z-score for the confidence level
        z_score = st.norm.ppf(confidence_level)
        var_amount = portfolio_value * volatility * z_score
        
        return {
            "portfolio_value": portfolio_value,
            "confidence_level": confidence_level,
            "var_amount": var_amount,
            "interpretation": f"Il y a {confidence_level*100}% de chances que la perte ne dépasse pas {var_amount:,.2f} DZD"
        }

    def run_stress_test(self, portfolio_value: float, scenario: str) -> dict:
        """
        Run a specific stress testing scenario.
        Scenarios: 'krach_boursier', 'depreciation_dzd', 'hausse_taux_ba'
        """
        impact_factors = {
            "krach_boursier": -0.20,      # -20%
            "depreciation_dzd": -0.15,    # -15%
            "hausse_taux_ba": -0.05,      # Estimated -5% impact on portfolio value for +2% rate hike
            "base": 0.0                   # No change
        }

        factor = impact_factors.get(scenario.lower(), 0.0)
        expected_loss = portfolio_value * abs(factor)
        new_value = portfolio_value + (portfolio_value * factor)

        return {
            "scenario": scenario,
            "impact_percentage": factor * 100,
            "expected_loss": expected_loss,
            "new_portfolio_value": new_value
        }

    def generate_global_score(self, credit_score: float, market_score: float, liquidity_score: float, operational_score: float) -> dict:
        """
        Generate Global Risk Score out of 10.
        Weights: Credit 35%, Market 30%, Liquidity 20%, Operational 15%.
        Input scores should be out of 10.
        """
        global_score = (credit_score * 0.35) + (market_score * 0.30) + (liquidity_score * 0.20) + (operational_score * 0.15)
        
        # Determine risk level
        if global_score <= 3.0:
            level = "Low"
            action = "Approve"
        elif global_score <= 6.0:
            level = "Medium"
            action = "Manual review"
        else:
            level = "High"
            action = "Reject / Guarantee required"

        return {
            "global_score_out_of_10": round(global_score, 2),
            "risk_level": level,
            "recommended_action": action,
            "components": {
                "credit": credit_score,
                "market": market_score,
                "liquidity": liquidity_score,
                "operational": operational_score
            }
        }

if __name__ == "__main__":
    engine = StressEngine()
    var_res = engine.calculate_var(100_000_000, 0.95, 0.24)
    print("VaR:", var_res)
    
    stress_res = engine.run_stress_test(100_000_000, "krach_boursier")
    print("Stress Test:", stress_res)
    
    global_res = engine.generate_global_score(1.8, 3.2, 2.1, 4.1)
    print("Global Score:", global_res)
