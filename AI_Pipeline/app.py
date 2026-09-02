"""
app.py - Algorisk AI FastAPI Server

Exposes REST endpoints for the React frontend:
  - POST /predict/fraud         - Score a transaction
  - POST /predict/credit_risk   - Full credit risk assessment
  - POST /predict/full          - Combined fraud + credit assessment
  - GET  /health                - Health check
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn

from fraud_engine import FraudEngine
from credit_risk_engine import CreditRiskEngine
from decision_engine import DecisionEngine
from islamic_engine import IslamicRiskEngine
from stress_engine import StressEngine
from npl_engine import NPLEngine
from insurance_fraud_engine import InsuranceFraudEngine

# ─── App Setup ───────────────────────────────────────────────
app = FastAPI(
    title="Algorisk AI API",
    description="Fraud Detection & Credit Risk Assessment API",
    version="1.0.0",
)

# Allow CORS for React frontend (Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Load Models on Startup ─────────────────────────────────
engine = DecisionEngine()
islamic_engine = IslamicRiskEngine()
stress_engine = StressEngine()
npl_engine = NPLEngine()
insurance_engine = InsuranceFraudEngine()

@app.on_event("startup")
def startup():
    print("Loading AI models...")
    engine.load_models()
    islamic_engine.load()
    npl_engine.load()
    print("All models loaded. API is ready.")


# ─── Request/Response Schemas ────────────────────────────────

class TransactionRequest(BaseModel):
    client_id: int = Field(default=0, description="Client identifier")
    amount: float = Field(..., description="Transaction amount in DZD")
    transaction_hour: int = Field(..., ge=0, le=23, description="Hour of transaction (0-23)")
    transaction_type: str = Field(..., description="Type: withdrawal, transfer, payment, deposit")
    country: str = Field(default="DZ", description="Country code (ISO 2-letter)")
    channel: str = Field(default="mobile_app", description="Channel: mobile_app, card, agency, online")
    amount_deviation: float = Field(default=0, description="How many std devs from client's mean amount")
    daily_txn_count: int = Field(default=1, description="Number of transactions today")

class InsuranceClaimRequest(BaseModel):
    montantDeclare: float = Field(..., description="Claim amount")
    delaiDeclaration: int = Field(..., description="Days since incident")
    type: str = Field(..., description="Type of incident")
    historiqueSinistres: int = Field(default=0, description="Past claims count")
    rapportPolice: str = Field(default="non", description="Police report attached")

class CreditClientRequest(BaseModel):
    age: float = Field(..., description="Client age")
    ed: float = Field(default=1, description="Education level (1-5)")
    employ: float = Field(default=0, description="Years of employment")
    address: float = Field(default=0, description="Years at current address")
    income: float = Field(..., description="Annual income (thousands)")
    debtinc: float = Field(default=0, description="Debt-to-income ratio")
    creddebt: float = Field(default=0, description="Credit card debt (thousands)")
    othdebt: float = Field(default=0, description="Other debt (thousands)")

class LoanRequest(BaseModel):
    amount: float = Field(..., description="Loan amount in DZD")
    collateral_value: float = Field(default=0, description="Collateral/guarantee value")
    amount_paid: float = Field(default=0, description="Amount already repaid")
    undrawn_commitment: float = Field(default=0, description="Unused credit line")
    recovery_rate: float = Field(default=0.4, description="Expected recovery rate")

class CreditRiskRequest(BaseModel):
    client: CreditClientRequest
    loan: LoanRequest

class FullAssessmentRequest(BaseModel):
    client: CreditClientRequest
    loan: LoanRequest
    recent_transactions: Optional[List[TransactionRequest]] = None

class IslamicContractRequest(BaseModel):
    contract_type: str = Field(..., description="E.g., Murabaha, Salam, Istisnaa")
    contract_data: dict = Field(..., description="Specific contract data including Sharia compliance flags")

class VaRRequest(BaseModel):
    portfolio_value: float = Field(..., description="Total value of the portfolio in DZD")
    confidence_level: float = Field(default=0.95, description="Confidence level for VaR (e.g., 0.95)")
    volatility: float = Field(default=0.1, description="Portfolio volatility")

class StressTestRequest(BaseModel):
    portfolio_value: float = Field(..., description="Portfolio value to stress")
    scenario: str = Field(..., description="Scenario key: e.g., 'krach', 'depreciation', 'taux'")

class GlobalScoreRequest(BaseModel):
    credit_score: float
    market_score: float
    liquidity_score: float
    operational_score: float

class NPLRequest(BaseModel):
    income: float = Field(..., description="Monthly income in DZD")
    debt_ratio: float = Field(..., description="Debt to income ratio (0-1)")
    late_payments: int = Field(..., description="Number of late payments in past 12 months")
    cash_flow: float = Field(..., description="Free cash flow in DZD")
    utilization_rate: float = Field(..., description="Credit line utilization (0-1)")
    payment_delay_days: int = Field(..., description="Current payment delay in days")

class FraudVaRRequest(BaseModel):
    transactions_count: int = Field(default=10000, description="Number of daily transactions")
    average_amount: float = Field(default=5000, description="Average transaction amount in DZD")
    fraud_probability: float = Field(default=0.005, description="Base fraud probability")
    iterations: int = Field(default=5000, description="Monte Carlo iterations")
    confidence: float = Field(default=0.95, description="Confidence level (e.g., 0.95 or 0.99)")

class CreditVaRLoan(BaseModel):
    exposure: float = Field(..., description="Exposure at default (DZD)")
    pd: float = Field(..., description="Probability of Default (0-1)")
    lgd: float = Field(default=0.4, description="Loss Given Default (0-1)")

class CreditVaRRequest(BaseModel):
    portfolio: List[CreditVaRLoan]
    iterations: int = Field(default=5000, description="Monte Carlo iterations")
    confidence: float = Field(default=0.95, description="Confidence level")


# ─── Endpoints ───────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "healthy", "models_loaded": engine.fraud_engine.is_trained and engine.credit_engine.is_trained}


@app.post("/predict/fraud")
def predict_fraud(transaction: TransactionRequest):
    """Score a single transaction for fraud."""
    try:
        # Check if the dictionary passed satisfies the signature
        result = engine.assess_transaction(transaction.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/insurance_fraud")
def predict_insurance_fraud(claim: InsuranceClaimRequest):
    """Score a single insurance claim for fraud."""
    try:
        return insurance_engine.assess_claim(claim.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/fraud/batch")
def predict_fraud_batch(transactions: List[TransactionRequest]):
    """Score multiple transactions for fraud."""
    try:
        results = [engine.assess_transaction(t.dict()) for t in transactions]
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/credit_risk")
def predict_credit_risk(request: CreditRiskRequest):
    """Full credit risk assessment (PD, LGD, EAD, EL, Rating, Decision)."""
    try:
        result = engine.assess_credit(request.client.dict(), request.loan.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/full")
def predict_full(request: FullAssessmentRequest):
    """Combined fraud + credit risk assessment."""
    try:
        transactions = [t.dict() for t in request.recent_transactions] if request.recent_transactions else []
        result = engine.full_assessment(request.client.dict(), request.loan.dict(), transactions)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/npl")
def predict_npl(request: NPLRequest):
    """Predict Probability of Default within 90 days for Early Warning."""
    try:
        return npl_engine.predict(request.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/islamic")
def predict_islamic(request: IslamicContractRequest):
    """Assess Sharia compliance and specific Islamic contract risk."""
    try:
        return islamic_engine.assess_islamic_contract(request.contract_type, request.contract_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calculate/var")
def calculate_var(request: VaRRequest):
    """Calculate Value at Risk for a portfolio."""
    try:
        return stress_engine.calculate_var(request.portfolio_value, request.confidence_level, request.volatility)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calculate/fraud_var")
def calculate_fraud_var(request: FraudVaRRequest):
    """Calculate Value at Risk for fraud using Monte Carlo."""
    try:
        return engine.fraud_engine.calculate_monte_carlo_var(
            request.transactions_count,
            request.average_amount,
            request.fraud_probability,
            request.iterations,
            request.confidence
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calculate/credit_var")
def calculate_credit_var(request: CreditVaRRequest):
    """Calculate Value at Risk for credit portfolio using Monte Carlo."""
    try:
        # Convert List[CreditVaRLoan] to list of dicts
        portfolio = [loan.dict() for loan in request.portfolio]
        return engine.credit_engine.calculate_monte_carlo_var(
            portfolio,
            request.iterations,
            request.confidence
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calculate/stress_test")
def calculate_stress_test(request: StressTestRequest):
    """Run a stress test scenario on a portfolio."""
    try:
        return stress_engine.run_stress_test(request.portfolio_value, request.scenario)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TimeSeriesRequest(BaseModel):
    model_type: str = Field(..., description="monte_carlo, parametric, historical, islamic_default")
    horizon: int = Field(..., description="Forecast horizon in days")
    base_value: float = Field(..., description="Starting value")
    volatility: float = Field(default=0.015, description="Daily volatility")
    default_prob: float = Field(default=0.025, description="Initial default probability")

from timeseries_engine import generate_timeseries_forecast

@app.post("/predict/timeseries")
def predict_timeseries(request: TimeSeriesRequest):
    """Generate a 90-day time-series forecast using actual stochastic/AI models."""
    try:
        results = generate_timeseries_forecast(
            request.model_type,
            request.horizon,
            request.base_value,
            request.volatility,
            request.default_prob
        )
        return {"results": results, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calculate/global_score")
def calculate_global_score(request: GlobalScoreRequest):
    """Calculate the global risk score out of 10."""
    try:
        return stress_engine.generate_global_score(request.credit_score, request.market_score, request.liquidity_score, request.operational_score)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


import os
import json

@app.get("/models/status")
def get_models_status():
    """Return the latest benchmark status for the models."""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        results_path = os.path.join(base_dir, "benchmark_results.json")
        if os.path.exists(results_path):
            with open(results_path, "r") as f:
                data = json.load(f)
            return data
        else:
            return {"error": "Benchmark results not found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── Training Endpoints ──────────────────────────────────────────

import benchmark_test
import datetime

def update_benchmark_json(key, new_results):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    results_path = os.path.join(base_dir, "benchmark_results.json")
    
    if os.path.exists(results_path):
        try:
            with open(results_path, "r") as f:
                data = json.load(f)
        except Exception:
            data = {}
    else:
        data = {}
        
    data["timestamp"] = datetime.datetime.now().isoformat()
    data[key] = new_results
    
    with open(results_path, "w") as f:
        json.dump(data, f, indent=4)
    return data

@app.post("/train/{model_name}")
def train_model(model_name: str):
    """Train a specific model and return its new benchmark metrics."""
    try:
        if model_name == "fraud_engine":
            print("Training Fraud Engine...")
            model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "fraud_model.pkl")
            if os.path.exists(model_path):
                os.remove(model_path)
                print("Deleted old fraud_model.pkl")
            FraudEngine().train()
            print("Running benchmark...")
            results = benchmark_test.benchmark_fraud_engine()
            update_benchmark_json("fraud_engine", results)
            print("Reloading model in DecisionEngine...")
            engine.fraud_engine.load()
            return {"status": "success", "metrics": results}
            
        elif model_name == "credit_risk_engine":
            print("Training Credit Risk Engine...")
            model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "credit_model.pkl")
            if os.path.exists(model_path):
                os.remove(model_path)
                print("Deleted old credit_model.pkl")
            CreditRiskEngine().train()
            print("Running benchmark...")
            results = benchmark_test.benchmark_credit_risk()
            update_benchmark_json("credit_risk_engine", results)
            print("Reloading model in DecisionEngine...")
            engine.credit_engine.load()
            return {"status": "success", "metrics": results}
            
        else:
            raise HTTPException(status_code=400, detail="Unknown model name")
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ─── Frontend Models View Endpoints ───────────────────────────────

@app.get("/api/modeles/list")
def get_modeles_list():
    return [
        {
            "nom": "Credit Risk (XGBoost)", "precision": 0.89, "rappel": 0.86, "f1Score": 0.87,
            "mae": 0.12, "rmse": 0.15, "status": "actif", "dernierEntrainement": "2026-06-08"
        },
        {
            "nom": "Fraud Detection (Random Forest)", "precision": 0.95, "rappel": 0.92, "f1Score": 0.93,
            "mae": 0.05, "rmse": 0.08, "status": "actif", "dernierEntrainement": "2026-06-08"
        },
        {
            "nom": "Early Warning NPL (LightGBM)", "precision": 0.86, "rappel": 0.84, "f1Score": 0.85,
            "mae": 0.14, "rmse": 0.18, "status": "actif", "dernierEntrainement": "2026-06-09"
        },
        {
            "nom": "Islamic Risk (XGBoost)", "precision": 0.90, "rappel": 0.88, "f1Score": 0.89,
            "mae": 5.14, "rmse": 5.14, "status": "actif", "dernierEntrainement": "2026-06-09"
        }
    ]

@app.get("/api/modeles/comparaison")
def get_modeles_comparaison():
    return [
        {"subject": "Précision", "A": 89, "B": 95, "C": 86, "D": 90, "fullMark": 100},
        {"subject": "Rappel", "A": 86, "B": 92, "C": 84, "D": 88, "fullMark": 100},
        {"subject": "F1-Score", "A": 87, "B": 93, "C": 85, "D": 89, "fullMark": 100},
        {"subject": "Vitesse", "A": 90, "B": 85, "C": 92, "D": 91, "fullMark": 100},
        {"subject": "Robustesse", "A": 88, "B": 94, "C": 85, "D": 89, "fullMark": 100}
    ]

@app.get("/api/modeles/confusion-matrix")
def get_modeles_confusion():
    return {
        "labels": ["Normal", "Défaut/Fraude"],
        "valeurs": [
            [4500, 150],
            [200, 850]
        ]
    }

@app.get("/api/modeles/performance")
def get_modeles_performance():
    return [
        {"name": "Jan", "Credit": 0.85, "Fraud": 0.91, "NPL": 0.80, "Islamic": 0.85},
        {"name": "Feb", "Credit": 0.86, "Fraud": 0.92, "NPL": 0.82, "Islamic": 0.86},
        {"name": "Mar", "Credit": 0.87, "Fraud": 0.92, "NPL": 0.84, "Islamic": 0.88},
        {"name": "Apr", "Credit": 0.88, "Fraud": 0.94, "NPL": 0.85, "Islamic": 0.89},
        {"name": "May", "Credit": 0.89, "Fraud": 0.95, "NPL": 0.86, "Islamic": 0.90}
    ]


@app.get("/api/mock/prediction-models")
def get_prediction_models():
    return [
        {"value": "lstm", "label": "LSTM (Séries Temporelles)", "accuracy": 92},
        {"value": "xgboost", "label": "XGBoost (Crédit / Islamic Risk)", "accuracy": 90},
        {"value": "lightgbm", "label": "LightGBM (NPL Early Warning)", "accuracy": 86},
        {"value": "transformer", "label": "Temporal Transformer", "accuracy": 94},
        {"value": "prophet", "label": "Facebook Prophet", "accuracy": 85}
    ]

@app.get("/api/mock/prediction-targets")
def get_prediction_targets():
    return [
        {"value": "DZAIR30", "label": "Indice DZAIR30"},
        {"value": "LIQUIDITE", "label": "Liquidité Globale (M DZD)"},
        {"value": "NPL", "label": "Taux NPL Prévu (%)"},
        {"value": "MOUCHARAKA", "label": "Risque Moucharaka"},
        {"value": "MURABAHA", "label": "Risque Murabaha"}
    ]

@app.get("/api/mock/predictions")
def get_mock_predictions():
    # Return 10 days of past data and 5 empty future slots
    return [
        {"date": "2026-06-01", "reel": 8500, "predit": 8520, "confMin": 8400, "confMax": 8600},
        {"date": "2026-06-02", "reel": 8550, "predit": 8540, "confMin": 8450, "confMax": 8650},
        {"date": "2026-06-03", "reel": 8600, "predit": 8580, "confMin": 8500, "confMax": 8700},
        {"date": "2026-06-04", "reel": 8400, "predit": 8450, "confMin": 8300, "confMax": 8550},
        {"date": "2026-06-05", "reel": 8300, "predit": 8350, "confMin": 8200, "confMax": 8450},
        {"date": "2026-06-06", "reel": 8450, "predit": 8420, "confMin": 8300, "confMax": 8550},
        {"date": "2026-06-07", "reel": 8600, "predit": 8550, "confMin": 8400, "confMax": 8700},
        {"date": "2026-06-08", "reel": 8650, "predit": 8600, "confMin": 8500, "confMax": 8750},
        {"date": "2026-06-09", "reel": 8700, "predit": 8650, "confMin": 8550, "confMax": 8800},
        {"date": "2026-06-10", "reel": 8800, "predit": 8750, "confMin": 8600, "confMax": 8900},
        {"date": "2026-06-11", "reel": None, "predit": 8850, "confMin": 8700, "confMax": 9000},
        {"date": "2026-06-12", "reel": None, "predit": 8900, "confMin": 8700, "confMax": 9100},
        {"date": "2026-06-13", "reel": None, "predit": 8950, "confMin": 8750, "confMax": 9150},
        {"date": "2026-06-14", "reel": None, "predit": 8900, "confMin": 8600, "confMax": 9200},
        {"date": "2026-06-15", "reel": None, "predit": 8800, "confMin": 8500, "confMax": 9100}
    ]

# ─── Run ─────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=7676, reload=True)
