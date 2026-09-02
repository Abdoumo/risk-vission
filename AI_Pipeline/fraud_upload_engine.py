import pandas as pd
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
            
            for index, row in df.iterrows():
                date_str = datetime.now().strftime("%d/%m/%Y %H:%M")
                entite_val = str(row.get('client_name', 'Client Anonyme'))
                
                card_brand = str(row.get('card_brand', 'Visa'))
                card_type = str(row.get('card_type', 'Debit'))
                type_val = 'banking'
                sousType_val = f"{card_type} {card_brand}"
                
                # Derive a fake score based on risk factors
                is_dark_web = str(row.get('card_on_dark_web', '')).strip().lower() == 'yes'
                has_default = str(row.get('default', '0')) == '1'
                
                score_val = 15.0
                if has_default: score_val += 40.0
                if is_dark_web: score_val += 35.0
                
                score_val = min(99.0, score_val + float(str(row.get('BankruptcyHistory', 0))) * 2)
                
                if score_val >= 75.0:
                    decision_val = 'blocked'
                elif score_val >= 40.0:
                    decision_val = 'review'
                else:
                    decision_val = 'approved'
                    
                credit_limit_raw = str(row.get('credit_limit', '$0'))
                montant_val = credit_limit_raw.replace('$', '') + '00 DZD'
                analyste_val = 'Système XAI'
                
                ml_results = {
                    "credit_risk": {
                        "pd_percentage": str(round(score_val * 0.8, 1)),
                        "expected_loss": float(credit_limit_raw.replace('$', '')) * (score_val/100) * 100
                    },
                    "fraud_analysis": {
                        "overall_fraud_score": round(score_val, 1)
                    },
                    "final_decision": "REJECTED" if decision_val == 'blocked' else "HOLD_FOR_INVESTIGATION" if decision_val == 'review' else "APPROVED_WITH_CONDITIONS",
                    "final_reason": f"Analyse complète effectuée. Présence DarkWeb: {is_dark_web}. Défaut: {has_default}."
                }
                
                details_val = json.dumps({
                    "income": str(row.get('income', 0)),
                    "debtinc": str(row.get('debtinc', 0)),
                    "creddebt": str(round(float(row.get('creddebt', 0)), 2)),
                    "othdebt": str(round(float(row.get('othdebt', 0)), 2)),
                    "default": str(row.get('default', 0)),
                    "card_brand": card_brand,
                    "card_type": card_type,
                    "credit_limit": credit_limit_raw,
                    "has_chip": str(row.get('has_chip', 'Yes')).upper(),
                    "card_on_dark_web": str(row.get('card_on_dark_web', 'No')).capitalize(),
                    "MaritalStatus": str(row.get('MaritalStatus', 'Unknown')),
                    "EducationLevel": str(row.get('EducationLevel', 'Unknown')),
                    "EmploymentStatus": str(row.get('EmploymentStatus', 'Unknown')),
                    "HomeOwnershipStatus": str(row.get('HomeOwnershipStatus', 'Unknown')),
                    "BankruptcyHistory": str(row.get('BankruptcyHistory', 0)),
                    "kashf_ratib": str(row.get('kashf_ratib', False)).lower(),
                    "sijil_tijari": str(row.get('sijil_tijari', False)).lower(),
                    "ouqoud": str(row.get('ouqoud', False)).lower(),
                    "damanat": str(row.get('damanat', False)).lower(),
                    "wathaiq_zoboun": str(row.get('wathaiq_zoboun', False)).lower(),
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
        print("No fraud_historical.csv found. Generating sample data instead...")
        sample_data = [
            {
                "id": "FRD-" + str(uuid.uuid4())[:8],
                "date": datetime.now().strftime("%d/%m/%Y %H:%M"),
                "type": "Virement SWIFT",
                "sousType": "International",
                "entite": "Compte Offshore 998X",
                "score": 92.5,
                "decision": "blocked",
                "montant": "25,000,000 DZD",
                "analyste": "Système XAI",
                "details": json.dumps({"amount": 25000000, "transaction_hour": 2})
            }
        ]
        results.extend(sample_data)
        print("Successfully generated sample data.")

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"Fraud metrics generated at {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
