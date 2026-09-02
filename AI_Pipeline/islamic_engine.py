"""
islamic_engine.py - Algorisk Islamic Risk Engine

Handles specific scoring for Islamic finance contracts (Murabaha, Salam, Istisnaa, etc.)
and Sharia compliance checks.
"""

import os
import joblib
import pandas as pd
import numpy as np

class IslamicRiskEngine:
    def __init__(self):
        self.model = None
        self.is_trained = False

    def load(self):
        model_path = os.path.join(os.path.dirname(__file__), "models", "islamic_model.pkl")
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
            self.is_trained = True
            print("Islamic XGBoost Model loaded successfully.")
        else:
            print("Warning: Islamic model not found at", model_path)
        return self

    def assess_sharia_compliance(self, contract_details: dict) -> dict:
        """
        Check if a contract is Sharia compliant.
        """
        forbidden_clauses = contract_details.get("has_forbidden_clauses", False)
        interest_mentioned = contract_details.get("mentions_riba", False)
        uncertainty = contract_details.get("high_gharar", False)
        
        # AAOIFI Compliance Rules
        aaoifi_compliant = contract_details.get("aaoifi_compliant", True)
        missing_aaoifi_standards = contract_details.get("missing_aaoifi_standards", [])

        if forbidden_clauses or interest_mentioned or uncertainty or not aaoifi_compliant:
            status = "Non conforme"
            risk_level = "High"
            reasons = []
            if forbidden_clauses: reasons.append("Présence de clauses interdites")
            if interest_mentioned: reasons.append("Mention de Riba (Intérêt)")
            if uncertainty: reasons.append("Niveau élevé de Gharar (Incertitude)")
            if not aaoifi_compliant: reasons.append("Non respect des normes AAOIFI")
            if missing_aaoifi_standards: reasons.append(f"Normes AAOIFI manquantes: {', '.join(missing_aaoifi_standards)}")
        else:
            status = "Conforme"
            risk_level = "Low"
            reasons = ["Le contrat respecte les principes de la Charia et les normes AAOIFI"]

        return {
            "status": status,
            "sharia_risk_level": risk_level,
            "details": reasons,
            "aaoifi_compliance": aaoifi_compliant
        }

    def predict_risk(self, data: dict) -> dict:
        """Use XGBoost model to predict risk."""
        if not self.is_trained:
            # Fallback scoring
            return {"predicted_risk_score": 50, "fallback": True}

        # Provide defaults if keys are missing
        features = {
            'client_reliability': data.get('client_reliability_score', 0.5),
            'supplier_reliability': data.get('supplier_reliability_score', 0.5),
            'price_volatility': data.get('price_volatility', 0.1),
            'delivery_probability': data.get('delivery_probability', 0.5)
        }
        df = pd.DataFrame([features])
        
        # Predict using XGBoost
        score = float(self.model.predict(df)[0])
        score = max(0, min(100, score)) # Clip to 0-100
        
        return {
            "predicted_risk_score": score,
            "fallback": False,
            "inputs_used": features
        }

    def classify_contract(self, contract_data: dict) -> str:
        """
        Classify the Islamic Contract based on its features.
        """
        if contract_data.get("asset_purchased_by_bank") and contract_data.get("resold_with_markup"):
            return "Murabaha"
        elif contract_data.get("profit_sharing") and contract_data.get("loss_borne_by_capital_provider"):
            return "Mudarabah"
        elif contract_data.get("joint_venture") and contract_data.get("profit_and_loss_sharing"):
            return "Musharakah"
        elif contract_data.get("lease_agreement"):
            return "Ijara"
        elif contract_data.get("forward_sale") and contract_data.get("full_payment_upfront"):
            return "Salam"
        elif contract_data.get("manufacturing_contract"):
            return "Istisnaa"
        else:
            return contract_data.get("contract_type", "Unknown")

    def assess_islamic_contract(self, contract_type: str, contract_data: dict) -> dict:
        """
        Assess an Islamic contract combining Sharia compliance and specific risk.
        """
        classified_type = self.classify_contract(contract_data)
        if classified_type != "Unknown":
            contract_type = classified_type
            
        sharia_result = self.assess_sharia_compliance(contract_data)
        
        ml_prediction = self.predict_risk(contract_data)
        
        specific_risk = {
            "contract_type": contract_type,
            "specific_risk_score": ml_prediction["predicted_risk_score"],
            "ml_fallback_used": ml_prediction["fallback"],
            "features": ml_prediction.get("inputs_used", {})
        }

        # Global Islamic Risk Score
        # If not Sharia compliant, risk is 100 automatically
        global_score = 100 if sharia_result["status"] == "Non conforme" else specific_risk.get("specific_risk_score", 50)

        return {
            "global_islamic_score": global_score,
            "sharia_compliance": sharia_result,
            "contract_risk": specific_risk
        }

if __name__ == "__main__":
    engine = IslamicRiskEngine()
    res = engine.assess_islamic_contract("Murabaha", {
        "has_forbidden_clauses": False,
        "client_reliability_score": 0.8,
        "supplier_reliability_score": 0.9,
        "price_volatility": 0.05
    })
    print(res)
