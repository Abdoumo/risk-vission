"""
credit_risk_engine.py - Algorisk Credit Risk Assessment Engine

Implements Basel/IFRS compliant risk models:
- PD (Probability of Default) via XGBoost
- LGD (Loss Given Default) estimation
- EAD (Exposure At Default) calculation
- EL (Expected Loss) = PD x LGD x EAD
- Risk Rating (AAA to B)
- Decision Engine (Accept / Accept with conditions / Reject)
"""
import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder, StandardScaler
import xgboost as xgb

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "pd_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "models", "pd_scaler.pkl")
ENCODERS_PATH = os.path.join(BASE_DIR, "models", "pd_encoders.pkl")


class CreditRiskEngine:
    """
    Complete Credit Risk Assessment following Basel Committee standards.
    Calculates PD, LGD, EAD, EL, Rating, and Decision.
    """

    # Rating scale based on risk score
    RATING_SCALE = [
        (0, 20, "AAA", "Prime - Extremely low risk"),
        (20, 40, "AA", "High Grade - Very low risk"),
        (40, 55, "A", "Upper Medium - Low risk"),
        (55, 70, "BBB", "Medium Grade - Moderate risk"),
        (70, 80, "BB", "Speculative - Elevated risk"),
        (80, 90, "B", "Highly Speculative - High risk"),
        (90, 100, "CCC", "Substantial Risk - Very high risk"),
    ]

    def __init__(self):
        self.model = None
        self.scaler = None
        self.encoders = {}
        self.feature_cols = []
        self.is_trained = False

    def train(self, data_path=None):
        """Train the PD model on historical default data."""
        df = None
        print("Loading credit data from PostgreSQL...")
        try:
            import psycopg2
            import json
            conn = psycopg2.connect("postgresql://postgres:lightking@localhost:5432/algorisk")
            cur = conn.cursor()
            cur.execute('SELECT data FROM "ClientProfile"')
            rows = cur.fetchall()
            conn.close()
            
            if rows:
                data = []
                for row in rows:
                    item = row[0]
                    if isinstance(item, str):
                        data.append(json.loads(item))
                    else:
                        data.append(item)
                df = pd.DataFrame(data)
                for col in df.columns:
                    try:
                        df[col] = pd.to_numeric(df[col])
                    except:
                        pass
                print(f"Loaded {len(df)} records from database")
            else:
                print("Database is empty. Falling back to local CSV...")
        except Exception as e:
            print(f"Failed to load from DB ({e}). Falling back to local CSV...")
            
        if df is None or len(df) == 0:
            if data_path is None:
                data_path = os.path.join(BASE_DIR, "DATASETS", "bankloans.csv")
            df = pd.read_csv(data_path)

        if "default" not in df.columns:
            print("Warning: 'default' column missing from data. Ensure DB or CSV has correct labels.")
            return

        df = df.dropna(subset=["default"])
        print(f"  Loaded {len(df)} records, {df['default'].astype(float).sum():.0f} defaults")

        # Separate target
        y = df["default"].astype(int)
        X = df.drop(columns=["default"])

        # Encode categoricals
        for col in X.columns:
            if X[col].dtype == "object":
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
                self.encoders[col] = le

        X = X.fillna(0)
        self.feature_cols = X.columns.tolist()

        # Scale
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        # Split
        X_train, X_val, y_train, y_val = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )

        # Train XGBoost
        print("Training PD Model (XGBoost)...")
        self.model = xgb.XGBClassifier(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=5,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=len(y_train[y_train == 0]) / max(len(y_train[y_train == 1]), 1),
            eval_metric="logloss",
            random_state=42,
        )
        self.model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=20)

        # Evaluate
        val_proba = self.model.predict_proba(X_val)[:, 1]
        val_pred = self.model.predict(X_val)
        auc = roc_auc_score(y_val, val_proba)
        acc = accuracy_score(y_val, val_pred)
        print(f"\n  Validation AUC: {auc:.4f}")
        print(f"  Validation Accuracy: {acc:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_val, val_pred, target_names=["No Default", "Default"]))

        self.is_trained = True

        # Save
        os.makedirs("models", exist_ok=True)
        joblib.dump(self.model, MODEL_PATH)
        joblib.dump(self.scaler, SCALER_PATH)
        joblib.dump({"encoders": self.encoders, "feature_cols": self.feature_cols}, ENCODERS_PATH)
        print("PD model saved to models/")

        return self

    def load(self):
        """Load pre-trained models."""
        self.model = joblib.load(MODEL_PATH)
        self.scaler = joblib.load(SCALER_PATH)
        meta = joblib.load(ENCODERS_PATH)
        self.encoders = meta["encoders"]
        self.feature_cols = meta["feature_cols"]
        self.is_trained = True
        return self

    def predict_pd(self, client_data: dict) -> float:
        """
        Predict Probability of Default for a client.

        Args:
            client_data: dict with client financial features

        Returns:
            PD as a float between 0 and 1
        """
        if not self.is_trained:
            self.load()

        df = pd.DataFrame([client_data])

        # Encode categoricals
        for col, le in self.encoders.items():
            if col in df.columns:
                known = set(le.classes_)
                df[col] = df[col].apply(lambda x: le.transform([x])[0] if x in known else 0)

        # Ensure all feature columns exist
        for col in self.feature_cols:
            if col not in df.columns:
                df[col] = 0

        X = df[self.feature_cols].fillna(0)
        X_scaled = self.scaler.transform(X)

        pd_score = float(self.model.predict_proba(X_scaled)[0, 1])
        return pd_score

    @staticmethod
    def calculate_lgd(exposure: float, collateral_value: float, recovery_rate: float = 0.4) -> float:
        """
        Calculate Loss Given Default.

        LGD = (Exposure - Recovered) / Exposure

        Args:
            exposure: Total loan amount
            collateral_value: Value of collateral/guarantees
            recovery_rate: Base recovery rate (default 40% per Basel)

        Returns:
            LGD as float between 0 and 1
        """
        recovered = min(collateral_value, exposure) * recovery_rate
        lgd = (exposure - recovered) / exposure if exposure > 0 else 0.6
        return np.clip(lgd, 0, 1)

    @staticmethod
    def calculate_ead(original_amount: float, amount_paid: float, undrawn_commitment: float = 0,
                      ccf: float = 0.75) -> float:
        """
        Calculate Exposure At Default.

        EAD = Outstanding Balance + CCF * Undrawn Commitment

        Args:
            original_amount: Original loan/credit amount
            amount_paid: Amount already repaid
            undrawn_commitment: Unused credit line
            ccf: Credit Conversion Factor (default 75%)

        Returns:
            EAD in currency units
        """
        outstanding = max(original_amount - amount_paid, 0)
        ead = outstanding + ccf * undrawn_commitment
        return ead

    @staticmethod
    def calculate_el(pd: float, lgd: float, ead: float) -> float:
        """
        Calculate Expected Loss.

        EL = PD x LGD x EAD (Basel formula)
        """
        return pd * lgd * ead

    def get_rating(self, risk_score: float) -> dict:
        """
        Map a 0-100 risk score to a rating.

        Returns dict with rating, description, and score.
        """
        for low, high, rating, desc in self.RATING_SCALE:
            if low <= risk_score < high:
                return {"rating": rating, "description": desc, "score": round(risk_score, 2)}
        return {"rating": "CCC", "description": "Substantial Risk", "score": round(risk_score, 2)}

    def assess(self, client_data: dict, loan_data: dict) -> dict:
        """
        Full credit risk assessment.

        Args:
            client_data: dict with client financial profile
                Keys: age, income, debtinc, creddebt, othdebt, employ, ed, address, etc.
            loan_data: dict with loan specifics
                Keys: amount, collateral_value, amount_paid, undrawn_commitment

        Returns:
            Complete risk assessment with PD, LGD, EAD, EL, Rating, Decision.
        """
        # 1. Calculate PD
        pd_score = self.predict_pd(client_data)

        # 2. Calculate LGD
        exposure = loan_data.get("amount", 0)
        collateral = loan_data.get("collateral_value", 0)
        recovery_rate = loan_data.get("recovery_rate", 0.4)
        lgd = self.calculate_lgd(exposure, collateral, recovery_rate)

        # 3. Calculate EAD
        amount_paid = loan_data.get("amount_paid", 0)
        undrawn = loan_data.get("undrawn_commitment", 0)
        ead = self.calculate_ead(exposure, amount_paid, undrawn)

        # 4. Calculate EL
        el = self.calculate_el(pd_score, lgd, ead)

        # 5. Risk Score (0-100)
        risk_score = pd_score * 100

        # 6. Rating
        rating_info = self.get_rating(risk_score)

        # 7. Decision
        decision = self._make_decision(pd_score, lgd, el, exposure, rating_info["rating"])

        return {
            "pd": round(pd_score, 4),
            "pd_percentage": f"{pd_score * 100:.2f}%",
            "lgd": round(lgd, 4),
            "lgd_percentage": f"{lgd * 100:.2f}%",
            "ead": round(ead, 2),
            "expected_loss": round(el, 2),
            "risk_score": round(risk_score, 2),
            "rating": rating_info,
            "decision": decision,
        }

    def _make_decision(self, pd: float, lgd: float, el: float,
                       exposure: float, rating: str) -> dict:
        """
        Decision Engine: Accept / Accept with conditions / Reject

        Based on PD, EL ratio, and rating.
        """
        el_ratio = el / exposure if exposure > 0 else 1

        if pd < 0.05 and el_ratio < 0.02 and rating in ("AAA", "AA", "A"):
            return {
                "status": "APPROVED",
                "conditions": [],
                "explanation": "Low risk client with strong credit profile",
            }
        elif pd < 0.15 and el_ratio < 0.05 and rating in ("AAA", "AA", "A", "BBB"):
            conditions = []
            if pd >= 0.08:
                conditions.append("Additional collateral required")
            if lgd > 0.6:
                conditions.append("Reduce loan amount or increase guarantees")
            if pd >= 0.10:
                conditions.append("Higher interest rate applied")
            return {
                "status": "APPROVED_WITH_CONDITIONS",
                "conditions": conditions,
                "explanation": "Moderate risk - approved subject to conditions",
            }
        else:
            return {
                "status": "REJECTED",
                "conditions": [],
                "explanation": f"High risk profile (PD={pd*100:.1f}%, Rating={rating})",
            }

    def calculate_monte_carlo_var(self, portfolio: list, iterations=10000, confidence=0.99) -> dict:
        """
        Calculate Value at Risk for a credit portfolio using Monte Carlo simulation.
        
        Args:
            portfolio: List of dicts, each containing:
                - pd (Probability of Default)
                - ead (Exposure at Default)
                - lgd (Loss Given Default)
        """
        if not portfolio:
            return {"var_value": 0, "expected_loss": 0, "confidence": confidence, "iterations": iterations, "distribution": []}
            
        n_loans = len(portfolio)
        pds = np.array([loan['pd'] for loan in portfolio])
        eads = np.array([loan['ead'] for loan in portfolio])
        lgds = np.array([loan['lgd'] for loan in portfolio])
        
        # Array to hold total loss for each iteration
        portfolio_losses = np.zeros(iterations)
        
        # Simulate defaults
        # We can simulate each loan's default status (1 = default, 0 = no default)
        # Using binomial distribution (shape: iterations x n_loans)
        # A simpler way without a huge matrix:
        for i in range(n_loans):
            defaults = np.random.binomial(1, pds[i], iterations)
            loss_i = defaults * eads[i] * lgds[i]
            portfolio_losses += loss_i
            
        var_value = np.percentile(portfolio_losses, confidence * 100)
        expected_loss = np.mean(portfolio_losses)
        
        # Get loss history for visualization
        hist, bin_edges = np.histogram(portfolio_losses, bins=50)
        distribution = [{"loss": round(float(bin_edges[i]), 2), "frequency": int(hist[i])} for i in range(len(hist))]
        
        return {
            "var_value": float(var_value),
            "expected_loss": float(expected_loss),
            "confidence": confidence,
            "iterations": iterations,
            "max_loss_simulated": float(np.max(portfolio_losses)),
            "distribution": distribution
        }


if __name__ == "__main__":
    engine = CreditRiskEngine()
    engine.train()

    print("\n" + "=" * 60)
    print("Testing Credit Risk Assessment")
    print("=" * 60)

    # Test client (matches bankloans.csv features)
    client = {
        "age": 35,
        "ed": 2,
        "employ": 8,
        "address": 10,
        "income": 55,
        "debtinc": 12.5,
        "creddebt": 3.5,
        "othdebt": 3.4,
    }

    loan = {
        "amount": 1000000,      # 1M DZD
        "collateral_value": 400000,
        "amount_paid": 300000,
        "undrawn_commitment": 0,
    }

    result = engine.assess(client, loan)

    print(f"\nClient Assessment:")
    print(f"  PD (Probability of Default): {result['pd_percentage']}")
    print(f"  LGD (Loss Given Default):    {result['lgd_percentage']}")
    print(f"  EAD (Exposure At Default):    {result['ead']:,.2f} DZD")
    print(f"  EL  (Expected Loss):          {result['expected_loss']:,.2f} DZD")
    print(f"  Risk Score:                   {result['risk_score']}/100")
    print(f"  Rating:                       {result['rating']['rating']} - {result['rating']['description']}")
    print(f"  Decision:                     {result['decision']['status']}")
    if result["decision"]["conditions"]:
        print(f"  Conditions:")
        for c in result["decision"]["conditions"]:
            print(f"    - {c}")
