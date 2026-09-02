# AlgoRiskAI: Comprehensive AI Engines Overview

This document provides a detailed overview of all the Artificial Intelligence and Risk Assessment engines currently implemented in the **AlgoRiskAI** platform. It explains the purpose of each engine, how it is coded (algorithms, frameworks), and how it works in the current system.

## Table of Contents
1. [Islamic Risk Engine (`islamic_engine.py`)](#1-islamic-risk-engine)
2. [Credit Risk Engine (`credit_risk_engine.py`)](#2-credit-risk-engine)
3. [Fraud Detection Engine (`fraud_engine.py`)](#3-fraud-detection-engine)
4. [Non-Performing Loan (NPL) Engine (`npl_engine.py`)](#4-non-performing-loan-npl-engine)
5. [Stress Testing & VaR Engine (`stress_engine.py` & `var_engine.py`)](#5-stress-testing--var-engine)
6. [Unified Decision Engine (`decision_engine.py`)](#6-unified-decision-engine)

---

## 1. Islamic Risk Engine
**File:** `AI_Pipeline/islamic_engine.py`

### **Purpose**
Handles risk scoring specifically tailored for Islamic finance contracts (such as Murabaha, Salam, Istisnaa). It ensures that financial products comply with Sharia law while also predicting the underlying financial risk of the contract.

### **How it's Coded**
- **Algorithm:** XGBoost Regressor/Classifier for the ML risk prediction.
- **Frameworks:** `pandas`, `xgboost`, `scikit-learn`, `joblib`.
- **Rules-based Logic:** Hardcoded Sharia compliance rules checking for forbidden elements.

### **How it Works Now**
1. **Sharia Compliance Check:** It first evaluates the contract details against strict Islamic finance rules.
   - It checks for `has_forbidden_clauses`, `mentions_riba` (Interest), and `high_gharar` (Uncertainty).
   - If any of these are true, the contract is immediately flagged as **"Non conforme" (High Risk)**.
2. **Machine Learning Risk Prediction:** If compliant, it uses an XGBoost model (`islamic_model.pkl`) to predict the specific contract risk score (0-100) based on:
   - `client_reliability_score`
   - `supplier_reliability_score`
   - `price_volatility`
   - `delivery_probability`
3. **Global Islamic Score:** It combines both. If the contract is non-compliant, the global risk score defaults to 100 (Reject). Otherwise, it outputs the specific ML-predicted risk score along with compliance details.

---

## 2. Credit Risk Engine
**File:** `AI_Pipeline/credit_risk_engine.py`

### **Purpose**
Implements Basel/IFRS compliant risk models to evaluate loan applications. It calculates standard banking metrics: Probability of Default (PD), Loss Given Default (LGD), Exposure At Default (EAD), and Expected Loss (EL).

### **How it's Coded**
- **Algorithm:** XGBoost Classifier (`xgb.XGBClassifier`) for PD prediction.
- **Preprocessing:** `StandardScaler` for numeric values, `LabelEncoder` for categoricals.
- **Frameworks:** `xgboost`, `scikit-learn`, `pandas`.

### **How it Works Now**
1. **PD (Probability of Default):** The XGBoost model predicts the likelihood of a client defaulting based on demographic and financial features (age, education, employment years, income, debt-to-income ratio, etc.).
2. **LGD (Loss Given Default):** Calculated deterministically: `(Exposure - Recovered) / Exposure`. It factors in the loan amount, collateral value, and a standard Basel recovery rate (usually 40%).
3. **EAD (Exposure At Default):** Calculated as the outstanding balance plus a Credit Conversion Factor (CCF) applied to any undrawn commitment.
4. **EL (Expected Loss):** The final financial risk is calculated using the Basel formula: `EL = PD × LGD × EAD`.
5. **Rating & Decision:** Converts the risk score (PD * 100) into a letter rating (AAA to CCC) and outputs a decision (APPROVED, APPROVED_WITH_CONDITIONS, REJECTED) based on strict thresholds (e.g., PD < 5% and low EL ratio = APPROVED).

---

## 3. Fraud Detection Engine
**File:** `AI_Pipeline/fraud_engine.py`

### **Purpose**
Detects anomalies and potential fraud in financial transactions, providing a Fraud Score (0-100) and human-readable explanations for why a transaction was flagged.

### **How it's Coded**
- **Algorithm:** Supervised learning using `XGBClassifier` (though originally designed conceptually around Isolation Forest).
- **Frameworks:** `xgboost`, `scikit-learn`, `pandas`.

### **How it Works Now**
1. **Feature Engineering:** It takes a transaction and derives features like the logarithm of the amount (`amount_log`), deviation from the client's usual amount (`amount_deviation`), and daily transaction frequency. Categorical variables (country, channel, type) are encoded.
2. **Scoring:** The XGBoost model outputs an anomaly probability which is scaled to a `fraud_score` between 0 and 100.
3. **Explainability:** It uses hardcoded rules to explain *why* the score is high:
   - *Amount Deviation:* If the amount is > 3x the usual average.
   - *Location:* If the transaction originates from an unusual country.
   - *Time:* If it occurs at an atypical hour (e.g., 2 AM).
   - *Frequency:* If there are > 5 transactions in 24 hours.
4. **Action Recommendation:** Depending on the score, it recommends: ALLOW (<30), MONITOR, VERIFY_CLIENT, MANUAL_REVIEW, or BLOCK_TRANSACTION (>85).

---

## 4. Non-Performing Loan (NPL) Engine
**File:** `AI_Pipeline/npl_engine.py`

### **Purpose**
An early warning system that predicts the likelihood of an existing loan becoming non-performing (defaulting) within the next 90 days.

### **How it's Coded**
- **Algorithm:** LightGBM (Gradient Boosting).
- **Explainability:** SHAP (SHapley Additive exPlanations) via `shap.TreeExplainer`.
- **Frameworks:** `lightgbm` (inferred from saved model), `shap`, `pandas`.

### **How it Works Now**
1. **Prediction:** It takes current loan behavior features (`income`, `debt_ratio`, `late_payments`, `cash_flow`, `utilization_rate`, `payment_delay_days`) and outputs a 90-day probability of default.
2. **SHAP Explainability:** It calculates the exact contribution of each feature to the final prediction. It sorts these factors to provide the "top driving factors" (e.g., "payment_delay_days Increased risk by 0.15"). This tells the bank *exactly* why a client is trending towards default.

---

## 5. Stress Testing & VaR Engine
**Files:** `AI_Pipeline/stress_engine.py` & `AI_Pipeline/var_engine.py`

### **Purpose**
Assesses market risk, liquidity risk, and portfolio vulnerability under extreme economic scenarios. 

### **How it's Coded**
- **Algorithms:** Parametric Value at Risk (VaR), Historical VaR, standard statistical formulas (Beta, Sharpe Ratio).
- **Frameworks:** `scipy.stats`, `numpy`, `pandas`.

### **How it Works Now**
1. **Parametric VaR (`stress_engine.py`):** Calculates the maximum expected loss over a specific timeframe at a 95% confidence level using Z-scores and portfolio volatility.
2. **Historical VaR (`var_engine.py`):** Analyzes historical stock prices (e.g., Algerian stocks like ALLIANCE, SAIDAL, BIOPHARM) over the last 40 days to calculate the 95th percentile worst-case loss. It also calculates the Beta (market correlation) and Sharpe ratio for the portfolio.
3. **Stress Scenarios:** Simulates specific economic shocks:
   - *Krach Boursier (Stock Crash):* -20% portfolio value.
   - *Dépréciation DZD (Currency Depreciation):* -15% portfolio value.
   - *Hausse Taux BA (Interest Rate Hike):* -5% portfolio value.
4. **Global Risk Score:** Aggregates Credit (35%), Market (30%), Liquidity (20%), and Operational (15%) risk scores into a single metric out of 10.

---

## 6. Unified Decision Engine
**File:** `AI_Pipeline/decision_engine.py`

### **Purpose**
Acts as the central orchestrator that combines outputs from multiple AI engines (specifically Credit Risk and Fraud) into one final, actionable banking decision.

### **How it's Coded**
- Pure Python orchestration layer importing `FraudEngine` and `CreditRiskEngine`.

### **How it Works Now**
1. It runs the full **Credit Risk Assessment** on the client and loan details.
2. It simultaneously runs the **Fraud Detection** on the client's recent transactions.
3. **Decision Logic:** 
   - If *any* recent transaction triggers a severe fraud alert (Score >= 70), the entire loan process is overridden to `HOLD_FOR_INVESTIGATION`.
   - If no fraud is detected, the final decision relies entirely on the output of the Credit Risk Engine (Approved, Conditions, or Rejected).
