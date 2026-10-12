import json
from typing import Dict, Any, List

class KYCEngine:
    def __init__(self):
        # Base weightings for static KYC risk
        self.risk_weights = {
            "identity_risk": 0.15,
            "business_risk": 0.20,
            "financial_risk": 0.15,
            "geographic_risk": 0.10,
            "product_risk": 0.10,
            "channel_risk": 0.10,
            "behavioral_risk": 0.15,
            "data_quality_risk": 0.05
        }
        
        # Base weightings for dynamic KYC change detection
        self.change_weights = {
            "activity_change": 30,
            "turnover_change": 25,
            "country_change": 15,
            "beneficiary_change": 10,
            "transaction_pattern": 10,
            "legal_info_change": 10
        }

    def evaluate_static_risk(self, profile: Dict[str, float]) -> Dict[str, Any]:
        """
        Evaluates the static KYC risk of a customer profile.
        profile should contain values (0-100) for each risk dimension.
        """
        total_score = 0.0
        details = {}
        for key, weight in self.risk_weights.items():
            val = profile.get(key, 0)
            weighted_val = val * weight
            total_score += weighted_val
            details[key] = {
                "score": val,
                "weighted_contribution": round(weighted_val, 2)
            }
        
        total_score = round(total_score, 2)
        
        alerts = []
        
        # Proper Strict Logic:
        if profile.get("identity_risk", 0) >= 80:
            risk_level = "CRITICAL"
            alerts.append("CRITICAL: Personne Politiquement Exposée (PEP) ou Sanctionnée.")
        elif total_score >= 80:
            risk_level = "CRITICAL"
        elif profile.get("geographic_risk", 0) >= 80 or profile.get("business_risk", 0) >= 80:
            risk_level = "HIGH"
            alerts.append("HIGH: Juridiction à haut risque (Offshore) ou structure d'entreprise opaque.")
        elif total_score >= 60:
            risk_level = "HIGH"
        elif total_score >= 30:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            
        return {
            "kyc_score": total_score,
            "risk_level": risk_level,
            "alerts": alerts,
            "details": details
        }

    def detect_changes(self, declared: Dict[str, Any], observed: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compares declared KYC data with observed behavior to detect anomalies.
        """
        change_score = 0
        changes = []
        
        # 1. Activity Mismatch
        if declared.get("activity") != observed.get("activity"):
            change_score += self.change_weights["activity_change"]
            changes.append({
                "variable": "Activity",
                "declared": declared.get("activity"),
                "observed": observed.get("activity"),
                "impact": "Major Change"
            })
            
        # 2. Turnover Mismatch
        decl_turnover = declared.get("turnover", 0)
        obs_turnover = observed.get("turnover", 0)
        if decl_turnover > 0:
            turnover_diff = (obs_turnover - decl_turnover) / decl_turnover
            if turnover_diff > 0.5: # 50% deviation
                change_score += self.change_weights["turnover_change"]
                changes.append({
                    "variable": "Turnover",
                    "declared": decl_turnover,
                    "observed": obs_turnover,
                    "impact": "Major Change"
                })
                
        # 3. Country Mismatch (number of countries or missing countries)
        decl_countries = set(declared.get("countries", []))
        obs_countries = set(observed.get("countries", []))
        if not obs_countries.issubset(decl_countries) and len(obs_countries) > 0:
            change_score += self.change_weights["country_change"]
            changes.append({
                "variable": "Countries",
                "declared": list(decl_countries),
                "observed": list(obs_countries),
                "impact": "Change"
            })
            
        # 4. Beneficiary Pattern
        decl_beneficiaries = declared.get("beneficiaries", 0)
        obs_beneficiaries = observed.get("beneficiaries", 0)
        if obs_beneficiaries > decl_beneficiaries * 2: # Double the expected beneficiaries
            change_score += self.change_weights["beneficiary_change"]
            changes.append({
                "variable": "Beneficiaries",
                "declared": decl_beneficiaries,
                "observed": obs_beneficiaries,
                "impact": "Change"
            })
            
        # 5. Transaction Pattern
        decl_tx = declared.get("transactions_volume", 0)
        obs_tx = observed.get("transactions_volume", 0)
        if decl_tx > 0 and obs_tx > decl_tx * 3:
            change_score += self.change_weights["transaction_pattern"]
            changes.append({
                "variable": "Transaction Volume",
                "declared": decl_tx,
                "observed": obs_tx,
                "impact": "Change"
            })
            
        # 6. Legal Info (mock)
        if declared.get("legal_form") != observed.get("legal_form"):
            change_score += self.change_weights["legal_info_change"]
            changes.append({
                "variable": "Legal Form",
                "declared": declared.get("legal_form"),
                "observed": observed.get("legal_form"),
                "impact": "Change"
            })
            
        # Evaluate status
        if change_score < 30:
            status = "Stable"
            review_required = False
        elif change_score < 60:
            status = "Minor Change"
            review_required = False
        elif change_score < 80:
            status = "Significant Change"
            review_required = True
        else:
            status = "Major Change"
            review_required = True
            
        # EWS Signal mapping
        ews_signal = "EWS HIGH RISK" if review_required else "NORMAL"
            
        return {
            "change_score": change_score,
            "status": status,
            "review_required": review_required,
            "ews_signal": ews_signal,
            "changes_detected": changes
        }
