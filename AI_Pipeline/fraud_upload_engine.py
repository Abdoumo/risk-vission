import pandas as pd
import numpy as np
import uuid
import json
import os
from datetime import datetime

DATASET_PATH = os.path.join(os.path.dirname(__file__), "DATASETS", "fraud_historical.csv")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "fraud_results.json")

def main():
    print("Starting Fraud Upload Engine...")
    results = []

    if os.path.exists(DATASET_PATH):
        try:
            df = pd.read_csv(DATASET_PATH)
            print(f"Loaded {len(df)} records from {DATASET_PATH}")
            
            # Map to 8 features internally
            for index, row in df.iterrows():
                date_str = datetime.now().strftime("%d/%m/%Y %H:%M")
                
                # Support both old and new BNA formats
                nom = str(row.get('Nom', 'Client'))
                prenom = str(row.get('Prenom', 'Anonyme'))
                client_name = str(row.get('client_name', f"{nom} {prenom}")).strip()
                if client_name == "nan nan": client_name = "Client Anonyme"
                
                if 'Client_ID' in row:
                    entite_val = f"Compte #{row['Client_ID']} — {row.get('Wilaya', 'Alger')}"
                else:
                    entite_val = client_name
                
                type_val = 'Demande de Crédit' if 'Client_ID' in row else 'Bancaire'
                sousType_val = str(row.get('Type_Compte', row.get('card_type', 'Courant')))
                
                # Derive 8 features
                revenu = float(row.get('Revenu_Mensuel_DZD', row.get('income', 50000)))
                solde = float(row.get('Solde_Moyen_DZD', revenu * 2))
                charges = float(row.get('Charges_Mensuelles_DZD', row.get('debtinc', 10)))
                echeance = float(row.get('Echeance_Mensuelle_DZD', 0))
                dti = ((charges + echeance) / revenu) * 100 if revenu > 0 else float(row.get('dti', 10))
                
                impayes = float(row.get('Jours_Impayes', 0))
                retard = float(row.get('Retards_30J', 0)) + float(row.get('Retards_90J', 0))
                cashflow = revenu - charges - echeance
                historique = float(row.get('Historique_Paiement', 0.9))
                overdraft = float(row.get('Decouvert_90J', 0))
                
                # Risk scoring based on features
                score_val = 15.0
                if impayes > 30: score_val += 25.0
                if impayes > 90: score_val += 40.0
                if retard > 2: score_val += 15.0
                if dti > 45: score_val += 15.0
                if cashflow < 0: score_val += 20.0
                if overdraft > 2: score_val += 15.0
                if str(row.get('Statut_Client')) == 'En contentieux': score_val += 50.0
                
                # Some noise for realism
                score_val += (hash(entite_val) % 10)
                score_val = min(99.0, score_val)
                
                if score_val >= 75.0:
                    decision_val = 'blocked'
                elif score_val >= 40.0:
                    decision_val = 'review'
                else:
                    decision_val = 'approved'
                    
                montant_credit = float(row.get('Montant_Credit_DZD', row.get('credit_limit', revenu * 10)))
                if np.isnan(montant_credit): montant_credit = 500000.0
                montant_val = f"{int(montant_credit):,} DZD".replace(",", " ")
                
                analyste_val = 'Système XAI'
                
                # XAI and UI expect these exactly in 'details' for structural output
                ml_results = {
                    "credit_risk": {
                        "pd_percentage": str(round(score_val * 0.8, 1)),
                        "expected_loss": montant_credit * (score_val/100)
                    },
                    "fraud_analysis": {
                        "overall_fraud_score": round(score_val, 1)
                    },
                    "final_decision": "REJECTED" if decision_val == 'blocked' else "HOLD_FOR_INVESTIGATION" if decision_val == 'review' else "APPROVED_WITH_CONDITIONS",
                    "final_reason": f"Analyse basée sur 8 variables. Impayés: {impayes}j. DTI: {round(dti,1)}%."
                }
                
                details_val = json.dumps({
                    "revenue": str(revenu),
                    "solde_compte": str(solde),
                    "dti": str(round(dti, 2)),
                    "impayes": str(impayes),
                    "retard_paiement": str(retard),
                    "cashflow": str(cashflow),
                    "historique_bancaire": str(historique),
                    "overdraft": str(overdraft),
                    "ml_results": ml_results
                })
                
                results.append({
                    "id": f"FRD-{str(uuid.uuid4())[:8]}",
                    "date": date_str,
                    "type": type_val,
                    "sousType": sousType_val,
                    "entite": entite_val,
                    "score": round(score_val, 1),
                    "decision": decision_val,
                    "montant": montant_val,
                    "analyste": analyste_val,
                    "details": details_val
                })

            print("Successfully parsed CSV data.")
            
        except Exception as e:
            print(f"Error processing CSV: {e}")
    else:
        print(f"No {DATASET_PATH} found.")

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"Fraud metrics generated at {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
