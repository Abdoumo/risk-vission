"""
generate_transactions.py
Generates a realistic synthetic transaction dataset for Anomaly Detection training.
Each client gets a behavioral profile, and ~5% of transactions are injected as anomalies.
"""
import pandas as pd
import numpy as np
import os

np.random.seed(42)

NUM_CLIENTS = 500
TRANSACTIONS_PER_CLIENT = (50, 200)  # range
ANOMALY_RATE = 0.05

print("Generating synthetic transaction dataset...")

records = []
client_profiles = {}

for client_id in range(1, NUM_CLIENTS + 1):
    # Create a behavioral profile for this client
    avg_amount = np.random.uniform(5000, 80000)  # DZD
    std_amount = avg_amount * np.random.uniform(0.1, 0.3)
    usual_hour_center = np.random.randint(8, 20)
    usual_country = "DZ"  # Algeria
    usual_channel = np.random.choice(["mobile_app", "card", "agency", "online"], p=[0.4, 0.3, 0.2, 0.1])
    avg_monthly_txns = np.random.randint(5, 30)

    client_profiles[client_id] = {
        "avg_amount": avg_amount,
        "std_amount": std_amount,
        "usual_hour": usual_hour_center,
        "usual_country": usual_country,
        "usual_channel": usual_channel,
        "avg_monthly_txns": avg_monthly_txns,
    }

    n_txns = np.random.randint(*TRANSACTIONS_PER_CLIENT)

    for _ in range(n_txns):
        is_anomaly = np.random.random() < ANOMALY_RATE

        if is_anomaly:
            # Generate an anomalous transaction
            anomaly_type = np.random.choice(["amount", "location", "time", "frequency", "combined"])

            if anomaly_type == "amount":
                amount = avg_amount * np.random.uniform(5, 20)
                hour = int(np.clip(np.random.normal(usual_hour_center, 2), 0, 23))
                country = usual_country
                channel = usual_channel
            elif anomaly_type == "location":
                amount = max(100, np.random.normal(avg_amount, std_amount))
                hour = int(np.clip(np.random.normal(usual_hour_center, 2), 0, 23))
                country = np.random.choice(["FR", "US", "CN", "RU", "NG", "TR"])
                channel = usual_channel
            elif anomaly_type == "time":
                amount = max(100, np.random.normal(avg_amount, std_amount))
                hour = np.random.choice([0, 1, 2, 3, 4])  # very late night
                country = usual_country
                channel = usual_channel
            elif anomaly_type == "frequency":
                # Burst: generate multiple rapid transactions
                amount = max(100, np.random.normal(avg_amount, std_amount * 0.5))
                hour = int(np.clip(np.random.normal(usual_hour_center, 2), 0, 23))
                country = usual_country
                channel = usual_channel
            else:  # combined
                amount = avg_amount * np.random.uniform(3, 10)
                hour = np.random.choice([0, 1, 2, 3, 4])
                country = np.random.choice(["FR", "US", "CN", "RU", "NG"])
                channel = np.random.choice(["mobile_app", "card", "agency", "online"])
        else:
            # Normal transaction
            amount = max(100, np.random.normal(avg_amount, std_amount))
            hour = int(np.clip(np.random.normal(usual_hour_center, 2), 0, 23))
            country = usual_country
            channel = usual_channel

        # Random date in 2024-2025
        date = pd.Timestamp("2025-01-01") + pd.Timedelta(days=np.random.randint(0, 540))
        txn_type = np.random.choice(["withdrawal", "transfer", "payment", "deposit"], p=[0.25, 0.3, 0.35, 0.1])

        records.append({
            "client_id": client_id,
            "transaction_date": date.strftime("%Y-%m-%d"),
            "transaction_hour": hour,
            "amount": round(amount, 2),
            "transaction_type": txn_type,
            "country": country,
            "channel": channel,
            "is_fraud": int(is_anomaly),
        })

df = pd.DataFrame(records)
# Sort by client and date for realism
df = df.sort_values(["client_id", "transaction_date"]).reset_index(drop=True)

# Add derived features
df["amount_log"] = np.log1p(df["amount"])

# Per-client rolling features (avg amount last 5 txns)
df["client_avg_amount"] = df.groupby("client_id")["amount"].transform("mean")
df["client_std_amount"] = df.groupby("client_id")["amount"].transform("std").fillna(0)
df["amount_deviation"] = (df["amount"] - df["client_avg_amount"]) / (df["client_std_amount"] + 1)

# Transaction count per client per day
df["daily_txn_count"] = df.groupby(["client_id", "transaction_date"])["amount"].transform("count")

output_path = os.path.join("DATASETS", "synthetic_transactions.csv")
df.to_csv(output_path, index=False)

print(f"Generated {len(df)} transactions for {NUM_CLIENTS} clients")
print(f"Anomaly rate: {df['is_fraud'].mean():.2%}")
print(f"Saved to {output_path}")
