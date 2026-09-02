"""
npl_engine.py - Algorisk NPL Early Warning Engine

Loads the trained LightGBM model for NPL prediction and provides PD scoring with SHAP explainability.
"""
import os
import joblib
import pandas as pd
import shap
import numpy as np

class NPLEngine:
    def __init__(self):
        self.model = None
        self.explainer = None
        self.is_trained = False
        
        self.feature_names = [
            'income', 'debt_ratio', 'late_payments', 'cash_flow', 
            'utilization_rate', 'payment_delay_days'
        ]

    def load(self):
        model_path = os.path.join(os.path.dirname(__file__), "models", "npl_model.pkl")
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
            self.explainer = shap.TreeExplainer(self.model)
            self.is_trained = True
            print("NPL LightGBM Model loaded successfully.")
        else:
            print("Warning: NPL model not found at", model_path)
        return self

    def predict(self, data: dict) -> dict:
        if not self.is_trained:
            return {"error": "Model not trained or loaded"}

        # Convert input dict to DataFrame
        df = pd.DataFrame([data], columns=self.feature_names)
        
        # Predict probability of default
        prob = self.model.predict_proba(df)[0][1] # Probability of class 1
        
        # SHAP Explainability
        shap_values = self.explainer.shap_values(df)
        
        # Determine the top contributing factors
        # shap_values[1] contains the SHAP values for class 1
        class_1_shap = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0]
        
        contributions = {}
        for idx, feature in enumerate(self.feature_names):
            contributions[feature] = float(class_1_shap[idx])
            
        # Sort factors by magnitude (absolute impact)
        sorted_factors = sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)
        top_reasons = []
        for feat, val in sorted_factors[:3]:
            direction = "Increased" if val > 0 else "Decreased"
            top_reasons.append(f"{feat} ({direction} risk by {abs(val):.2f})")

        risk_level = "High" if prob > 0.6 else "Medium" if prob > 0.3 else "Low"

        return {
            "probability_of_default_90_days": float(prob),
            "risk_level": risk_level,
            "explainability": {
                "top_driving_factors": top_reasons,
                "raw_shap_values": contributions
            }
        }

if __name__ == "__main__":
    engine = NPLEngine()
    engine.load()
    if engine.is_trained:
        test_data = {
            'income': 80000,
            'debt_ratio': 0.6,
            'late_payments': 2,
            'cash_flow': 20000,
            'utilization_rate': 0.85,
            'payment_delay_days': 45
        }
        res = engine.predict(test_data)
        print("NPL Prediction Result:", res)
