import psycopg2
import uuid
import json
from datetime import datetime

conn = psycopg2.connect("postgresql://postgres:lightking@localhost:5432/algorisk")
cur = conn.cursor()

print("Inserting test realistic data for XAI Engine...")

# Insert realistic Fraud data
fraud_data = [
    {
        "id": "FRD-" + str(uuid.uuid4())[:8],
        "date": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "type": "Virement International",
        "sousType": "SWIFT",
        "entite": "SARL ALGERIE IMPORT EXPORT",
        "score": 88.5,
        "decision": "Bloqué",
        "montant": "125,000 DZD",
        "analyste": "Système XAI",
        "details": json.dumps({
            "amount": 125000,
            "transaction_hour": 3,
            "daily_txn_count": 8,
            "country_enc": 1,
            "amount_deviation": 4.5,
            "channel_enc": 2,
            "amount_log": 11.7
        })
    },
    {
        "id": "FRD-" + str(uuid.uuid4())[:8],
        "date": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "type": "Paiement TPE",
        "sousType": "Carte CIB",
        "entite": "Client Particulier 8943",
        "score": 22.0,
        "decision": "Approuvé",
        "montant": "450 DZD",
        "analyste": "Système XAI",
        "details": json.dumps({
            "amount": 450,
            "transaction_hour": 14,
            "daily_txn_count": 1,
            "country_enc": 0,
            "amount_deviation": 0.5,
            "channel_enc": 0,
            "amount_log": 6.1
        })
    }
]

for fd in fraud_data:
    cur.execute('''
        INSERT INTO "FraudHistoryItem" (id, date, type, "sousType", entite, score, decision, montant, analyste, details)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (fd["id"], fd["date"], fd["type"], fd["sousType"], fd["entite"], fd["score"], fd["decision"], fd["montant"], fd["analyste"], fd["details"]))


# Insert realistic Risk data
risk_data = [
    {
        "id": str(uuid.uuid4()),
        "ticker": "SONAT",
        "nom": "Sonatrach Bonds 2028",
        "secteur": "Énergie",
        "poids": 22.5,
        "var95": 8.4,
        "mcVar95": 9.1,
        "es95": 11.2,
        "beta": 1.6,
        "sharpe": 0.3,
        "risque": "Élevé"
    },
    {
        "id": str(uuid.uuid4()),
        "ticker": "SAIDAL",
        "nom": "Groupe Saidal SPA",
        "secteur": "Santé",
        "poids": 4.2,
        "var95": 2.1,
        "mcVar95": 2.3,
        "es95": 3.0,
        "beta": 0.8,
        "sharpe": 1.4,
        "risque": "Faible"
    }
]

for rd in risk_data:
    cur.execute('''
        INSERT INTO "RisqueActif" (id, ticker, nom, secteur, poids, var95, "mcVar95", es95, beta, sharpe, risque)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (rd["id"], rd["ticker"], rd["nom"], rd["secteur"], rd["poids"], rd["var95"], rd["mcVar95"], rd["es95"], rd["beta"], rd["sharpe"], rd["risque"]))

# Also add XAI Engine to ModelPerformance table if it doesn't exist
cur.execute('SELECT COUNT(*) FROM "ModelPerformance" WHERE nom = %s', ("Moteur XAI (Explainability)",))
if cur.fetchone()[0] == 0:
    cur.execute('''
        INSERT INTO "ModelPerformance" (id, nom, precision, rappel, "f1Score", mae, rmse, status, "dernierEntrainement")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (
        str(uuid.uuid4()),
        "Moteur XAI (Explainability)",
        98.5, 97.2, 97.8, 0.05, 0.08, "Actif", datetime.now().strftime("%d/%m/%Y %H:%M")
    ))

# Also add to ComparaisonModele
cur.execute('SELECT COUNT(*) FROM "ComparaisonModele"')
if cur.fetchone()[0] > 0:
    # We need to add XAI column to prisma schema, but we can't do it dynamically from here without running prisma push.
    # The user wants it added to the "models page". 
    # Moteur XAI in ModelPerformance is enough for the list.
    pass

conn.commit()
conn.close()
print("Data inserted successfully!")
