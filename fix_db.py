import psycopg2
conn = psycopg2.connect('postgresql://postgres:lightking@localhost:5432/algorisk')
cur = conn.cursor()
cur.execute('''UPDATE "FraudHistoryItem" SET decision = 'blocked' WHERE decision = 'Bloqué';''')
cur.execute('''UPDATE "FraudHistoryItem" SET decision = 'review' WHERE decision = 'Analyse requise';''')
cur.execute('''UPDATE "FraudHistoryItem" SET decision = 'approved' WHERE decision = 'Approuvé';''')
conn.commit()
print('Fixed decisions in DB')
