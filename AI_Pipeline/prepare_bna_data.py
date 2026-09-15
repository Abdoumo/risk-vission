import pandas as pd
import numpy as np
import os

def prepare_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    input_csv = os.path.join(base_dir, "..", "things to do", "BNA%205000%20Clients-4.csv")
    output_csv = os.path.join(base_dir, "DATASETS", "bna_credit_risk_ready.csv")

    print(f"Reading data from {input_csv}...")
    try:
        df = pd.read_csv(input_csv)
    except FileNotFoundError:
        print(f"Error: Could not find file {input_csv}")
        return

    print(f"Original shape: {df.shape}")

    # Create the 8 final variables
    df_ready = pd.DataFrame()
    
    # 1. Revenue
    df_ready["revenue"] = df["Revenu_Mensuel_DZD"]
    
    # 2. Solde Compte
    df_ready["solde_compte"] = df["Solde_Moyen_DZD"]
    
    # 3. DTI (Debt-to-Income Ratio in %)
    # To avoid division by zero:
    revenue_safe = np.where(df["Revenu_Mensuel_DZD"] > 0, df["Revenu_Mensuel_DZD"], 1)
    df_ready["dti"] = ((df["Echeance_Mensuelle_DZD"] + df["Charges_Mensuelles_DZD"]) / revenue_safe) * 100
    df_ready["dti"] = df_ready["dti"].clip(0, 150) # Cap at 150%
    
    # 4. Impayes
    df_ready["impayes"] = df["Jours_Impayes"]
    
    # 5. Retard de Paiement (total number of delays)
    df_ready["retard_paiement"] = df["Retards_30J"] + df["Retards_90J"]
    
    # 6. Cashflow
    df_ready["cashflow"] = df["Revenu_Mensuel_DZD"] - df["Charges_Mensuelles_DZD"] - df["Echeance_Mensuelle_DZD"]
    
    # 7. Historique Bancaire (Using the existing score/metric)
    df_ready["historique_bancaire"] = df["Historique_Paiement"]
    
    # 8. Overdraft
    df_ready["overdraft"] = df["Decouvert_90J"]

    # Also keep some basic info if needed for analysis/UI
    df_ready["client_id"] = df["Client_ID"]
    df_ready["nom"] = df["Nom"]
    df_ready["secteur"] = df["Secteur_Activite"]
    df_ready["montant_credit"] = df["Montant_Credit_DZD"]

    # --- Generate 'default' target ---
    print("Generating 'default' target based on business rules with added noise...")
    
    np.random.seed(42)
    # Base probability of default based on features
    prob = np.zeros(len(df_ready))
    
    # Aggravating factors
    prob += np.where(df_ready["impayes"] > 60, 0.3, 0)
    prob += np.where(df_ready["impayes"] > 90, 0.4, 0)
    prob += np.where(df_ready["retard_paiement"] > 1, 0.2, 0)
    prob += np.where(df_ready["retard_paiement"] > 3, 0.3, 0)
    prob += np.where(df_ready["dti"] > 50, 0.2, 0)
    prob += np.where(df_ready["dti"] > 70, 0.3, 0)
    prob += np.where(df_ready["cashflow"] < 0, 0.3, 0)
    prob += np.where(df_ready["overdraft"] > 2, 0.2, 0)
    
    # Mitigating factors
    prob -= np.where(df_ready["revenue"] > df_ready["revenue"].median() * 1.5, 0.2, 0)
    prob -= np.where(df_ready["solde_compte"] > df_ready["montant_credit"] * 0.2, 0.2, 0)
    
    # Add random noise for ML realism (not perfectly deterministic)
    noise = np.random.normal(0, 0.15, len(df_ready))
    prob = np.clip(prob + noise, 0, 1)
    
    # Assign default = 1 if prob > 0.65
    df_ready["default"] = (prob > 0.65).astype(int)
    
    print(f"Generated {df_ready['default'].sum()} defaults out of {len(df_ready)} clients ({(df_ready['default'].sum()/len(df_ready))*100:.1f}%)")

    # Save
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    df_ready.to_csv(output_csv, index=False)
    print(f"Saved prepared dataset to {output_csv}")

if __name__ == "__main__":
    prepare_data()
