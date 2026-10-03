# Comprehensive Guide to AlgoRiskAI (RiskVision)

AlgoRiskAI is a sophisticated risk management platform built for modern banking and insurance. It combines Basel III compliance formulas with advanced Machine Learning (AI) to evaluate credit risk, detect fraud in real-time, and explain its decisions using eXplainable AI (XAI).

Here is a detailed, page-by-page and engine-by-engine breakdown of how everything works, including the underlying math and AI models.

---

## 1. The Core AI & Mathematical Engines

The platform relies on two main AI engines, both backed by strict financial mathematics.

### A. Credit Risk Engine (The Financial AI)
This engine calculates the Expected Loss (EL) for every credit line. It is based on standard Basel banking regulations, enhanced by AI.

*The Math (Basel Framework):*
1. *EAD (Exposure At Default):* How much money is at risk if the client stops paying today.
   *Equation:* `EAD = Outstanding Balance + (Credit Conversion Factor × Undrawn Commitment)`
2. *LGD (Loss Given Default):* The percentage of the EAD that the bank will actually lose (after seizing collateral/guarantees).
   *Equation (If Defaulted):* `LGD = (EAD - Recovery Amount) / EAD`
   *Equation (If Not Defaulted):* `LGD = Historical Average LGD` (based on similar loans and collateral).
3. *PD (Probability of Default):* The percentage chance the client will default. *This is where the AI comes in.*
4. *EL (Expected Loss):* The final financial risk value.
   *Equation:* `EL = PD × LGD × EAD`

*How the AI computes PD:*
The AI uses an algorithm called *XGBoost* (Extreme Gradient Boosting), an advanced tree-based machine learning model. It reads 8 specific variables (Revenue, Account Balance, DTI, Unpaid dues, Late payment days, Cashflow, Banking History, and Overdraft). The model has been trained on historical banking data to recognize patterns of failure and assigns a precise probability percentage (PD).

### B. Anti-Fraud Engine (The Anomaly AI)
This engine monitors live transactions and insurance claims to block fraud before it happens.

*How the AI works:*
It uses *Isolation Forests* and *LSTM (Long Short-Term Memory)* neural networks. Instead of just looking for known rules, the AI establishes what a "normal" baseline looks like for a client. 
If a transaction deviates from this baseline (e.g., `Anomaly Score > Threshold`), the AI flags it. 
It looks at the velocity (transactions per day), location, device, time, and amount variance (e.g., +1600% higher than usual).

---

## 2. Frontend: Page-by-Page Breakdown

Here is exactly what is on each page of the frontend application and how it works:

### Page 1: Dashboard (Vue d'ensemble)
*What is on it:* The control center. It displays total at-risk capital, overall portfolio health, recent critical alerts, and live risk trends.
*How it works:* It fetches aggregated data from all endpoints (Credit, Fraud, Market) and uses charting libraries (Recharts) to show the bank's global Expected Loss vs. Total Assets.

### Page 2: Moteur Anti-Fraude (Anti-Fraud Engine)
*What is on it:* The command center for fraud analysts. Currently stripped down to its core to focus on historical logs and testing.
*Tabs:*
  * *Historique:* A live-updating table showing every transaction analyzed by the AI. It shows the Transaction ID, Type, Score (0-100), and the AI's Decision (Approved, Review, Blocked). You can click "Détails" to see exactly why it was blocked.
  * *Test en Masse (Bulk Test):* Allows the bank to upload a CSV file of thousands of past transactions to test the AI's accuracy and detection rate without affecting live accounts.
*How it works:* It communicates with the Python backend via API. For every transaction, the AI instantly returns a risk score and a recommended action.

### Page 3: Risque de Crédit (Credit Risk Analysis)
*What is on it:* A detailed profiling tool for individual clients.
*How it works:* You search for a specific client (by ID or name) and click "Analyser". 
*What you see:* 
  1. A dial showing the precise *Risk Score* (driven by the PD calculation).
  2. The *8 Key Variables* retrieved from the database (Revenue, DTI, Solde, etc.).
  3. *Aggravating & Mitigating Factors:* The UI splits the AI's findings into red (bad signs, like negative cashflow) and green (good signs, like high revenue).
  4. *Natural Language Explanation:* A paragraph written by the AI explaining its final decision to the banker.

### Page 4: Portefeuille de Risques (RisquesView)
*What is on it:* The macro-view of the credit department.
*How it works:* It lists all clients in a massive data table. For every client, it calculates and displays the live *EAD, PD, LGD, and EL*. 
*Stress Tests:* At the top of the page, there are interactive simulations. You can see how the total EL of the bank changes under different scenarios (e.g., "What if real estate drops by 20%, crashing our collateral value and spiking our LGD?").

### Page 5: Explainable AI (XaiView)
*What is on it:* The transparency engine. Banking regulations require that AI cannot be a "black box." This page solves that.
*How it works:* It uses *SHAP (SHapley Additive exPlanations)* mathematics. SHAP breaks down exactly how much each variable contributed to the final score.
*Features:*
  * *SHAP Waterfall Charts:* Shows mathematically, for example, that the client's high DTI added +15% to their risk score, but their high revenue subtracted -5%.
  * *Counterfactuals:* The AI tells the banker how to fix the client's risk. For example: *"If the client deposits 50,000 DZD into their account, their risk score will drop from Critique to Modéré, and their LGD will improve."*

---

*In Summary:* The frontend acts as a beautiful, interactive shell (built in React/TypeScript) that queries a highly advanced Python backend. The backend runs the standard Basel equations (EAD, LGD, EL) and feeds the variables into Machine Learning models (XGBoost, LSTMs) to output probabilities (PD, Anomaly Scores) and explanations (SHAP/XAI).