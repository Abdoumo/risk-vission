"""
decision_engine.py - Algorisk Unified Decision Engine

Combines Fraud Detection and Credit Risk Assessment into a single decision point.
"""
from fraud_engine import FraudEngine
from credit_risk_engine import CreditRiskEngine


class DecisionEngine:
    """
    Unified engine that combines:
    - Fraud Detection (anomaly scoring)
    - Credit Risk Assessment (PD/LGD/EAD/EL)

    Into a single, actionable decision.
    """

    def __init__(self):
        self.fraud_engine = FraudEngine()
        self.credit_engine = CreditRiskEngine()

    def load_models(self):
        """Load all pre-trained models."""
        self.fraud_engine.load()
        self.credit_engine.load()
        return self

    def train_all(self):
        """Train all models from scratch."""
        print("=" * 60)
        print("TRAINING FRAUD DETECTION ENGINE")
        print("=" * 60)
        self.fraud_engine.train()

        print("\n" + "=" * 60)
        print("TRAINING CREDIT RISK ENGINE")
        print("=" * 60)
        self.credit_engine.train()

        print("\nAll models trained successfully!")
        return self

    def assess_transaction(self, transaction: dict) -> dict:
        """
        Assess a single transaction for fraud.

        Args:
            transaction: dict with transaction details

        Returns:
            Fraud assessment with score, level, reasons, and action
        """
        return self.fraud_engine.predict(transaction)

    def assess_credit(self, client_data: dict, loan_data: dict) -> dict:
        """
        Full credit risk assessment for a loan application.

        Args:
            client_data: Client financial profile
            loan_data: Loan specifics (amount, collateral, etc.)

        Returns:
            Complete risk assessment
        """
        return self.credit_engine.assess(client_data, loan_data)

    def full_assessment(self, client_data: dict, loan_data: dict,
                        recent_transactions: list = None) -> dict:
        """
        Combined assessment: credit risk + fraud check on recent transactions.

        Returns a unified report.
        """
        # Credit risk
        credit_result = self.assess_credit(client_data, loan_data)

        # Fraud check on recent transactions
        fraud_results = []
        overall_fraud_score = 0
        if recent_transactions:
            for txn in recent_transactions:
                fraud_res = self.assess_transaction(txn)
                fraud_results.append(fraud_res)
            overall_fraud_score = max(r["fraud_score"] for r in fraud_results)

        # Combined decision
        credit_status = credit_result["decision"]["status"]
        has_fraud_alert = overall_fraud_score >= 70

        if has_fraud_alert:
            final_decision = "HOLD_FOR_INVESTIGATION"
            final_reason = (
                f"Fraud alert detected (score: {overall_fraud_score}/100). "
                f"Credit assessment paused pending investigation."
            )
        elif credit_status == "REJECTED":
            final_decision = "REJECTED"
            final_reason = credit_result["decision"]["explanation"]
        elif credit_status == "APPROVED_WITH_CONDITIONS":
            final_decision = "APPROVED_WITH_CONDITIONS"
            final_reason = credit_result["decision"]["explanation"]
        else:
            final_decision = "APPROVED"
            final_reason = "Client passes all risk and fraud checks"

        return {
            "final_decision": final_decision,
            "final_reason": final_reason,
            "credit_risk": credit_result,
            "fraud_analysis": {
                "overall_fraud_score": overall_fraud_score,
                "transactions_checked": len(fraud_results),
                "details": fraud_results,
            },
        }


if __name__ == "__main__":
    engine = DecisionEngine()
    engine.load_models()

    print("=" * 60)
    print("FULL ASSESSMENT TEST")
    print("=" * 60)

    client = {
        "age": 35, "ed": 2, "employ": 8, "address": 10,
        "income": 55, "debtinc": 12.5, "creddebt": 3.5, "othdebt": 3.4,
    }
    loan = {
        "amount": 1000000, "collateral_value": 400000,
        "amount_paid": 300000, "undrawn_commitment": 0,
    }
    transactions = [
        {
            "client_id": 1, "amount": 25000, "transaction_hour": 14,
            "transaction_type": "payment", "country": "DZ", "channel": "mobile_app",
            "amount_deviation": 0.5, "daily_txn_count": 2,
        },
        {
            "client_id": 1, "amount": 500000, "transaction_hour": 2,
            "transaction_type": "transfer", "country": "NG", "channel": "online",
            "amount_deviation": 8.0, "daily_txn_count": 6,
        },
    ]

    result = engine.full_assessment(client, loan, transactions)

    print(f"\nFinal Decision: {result['final_decision']}")
    print(f"Reason: {result['final_reason']}")
    print(f"\nCredit Risk:")
    cr = result["credit_risk"]
    print(f"  PD: {cr['pd_percentage']}, Rating: {cr['rating']['rating']}")
    print(f"  EL: {cr['expected_loss']:,.2f} DZD")
    print(f"\nFraud Analysis:")
    fa = result["fraud_analysis"]
    print(f"  Overall Fraud Score: {fa['overall_fraud_score']}/100")
    print(f"  Transactions Checked: {fa['transactions_checked']}")
