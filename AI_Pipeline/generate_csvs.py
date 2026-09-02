import csv
import random
import os
import copy

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def to_float(val):
    try:
        return float(str(val).replace('$', '').replace(',', ''))
    except:
        return 0.0

with open(os.path.join(BASE_DIR, 'clients_bulk_test.csv'), 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    original_rows = list(reader)
    fieldnames = reader.fieldnames

def make_low_risk(r):
    row = copy.deepcopy(r)
    row['default'] = '0'
    age = to_float(row.get('age', 18))
    employ = to_float(row.get('employ', 0))
    row['age'] = str(max(int(age), 25))
    row['employ'] = str(max(int(employ), 5))
    income = to_float(row.get('income', 50))
    row['income'] = str(max(income, 50))
    row['credit_limit'] = f"${max(to_float(row.get('credit_limit', 500)), 1000):.0f}"
    row['card_on_dark_web'] = 'No'
    row['BankruptcyHistory'] = '0'
    row['has_chip'] = 'YES'
    row['wathaiq_zoboun'] = 'true'
    row['kashf_ratib'] = 'true'
    row['ouqoud'] = 'true'
    row['sijil_tijari'] = 'true'
    row['damanat'] = 'true'
    return row

def make_medium_risk(r):
    row = copy.deepcopy(r)
    row['default'] = random.choice(['0', '1'])
    row['card_on_dark_web'] = 'No'
    row['BankruptcyHistory'] = str(random.choice([0, 1]))
    row['has_chip'] = 'YES'
    row['wathaiq_zoboun'] = 'true'
    row['kashf_ratib'] = random.choice(['true', 'false'])
    row['ouqoud'] = 'true'
    creddebt = to_float(row.get('creddebt', 10))
    othdebt = to_float(row.get('othdebt', 10))
    row['creddebt'] = str(creddebt * 2)
    row['othdebt'] = str(othdebt * 2)
    row['debtinc'] = str(to_float(row.get('debtinc', 10)) + 30.0) # High debt to income
    return row

def make_high_risk(r):
    row = copy.deepcopy(r)
    row['age'] = str(random.choice([15, 120, -5, 200]))
    row['income'] = str(random.choice([-1000, 0, 9999999]))
    row['default'] = '1'
    row['card_on_dark_web'] = 'Yes'
    row['BankruptcyHistory'] = str(random.randint(2, 10))
    row['credit_limit'] = "$999999"
    row['has_chip'] = 'NO'
    row['wathaiq_zoboun'] = 'false'
    row['kashf_ratib'] = 'false'
    row['sijil_tijari'] = 'false'
    row['damanat'] = 'false'
    row['ouqoud'] = 'false'
    row['creddebt'] = str(to_float(row.get('creddebt', 0)) * 1000)
    row['othdebt'] = str(to_float(row.get('othdebt', 0)) * 1000)
    row['debtinc'] = '999.99'
    return row

# 1. clients_low_risk.csv
with open(os.path.join(BASE_DIR, 'clients_low_risk.csv'), 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for r in original_rows:
        writer.writerow(make_low_risk(r))

# 2. clients_medium_risk.csv
with open(os.path.join(BASE_DIR, 'clients_medium_risk.csv'), 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for r in original_rows:
        writer.writerow(make_medium_risk(r))

# 3. clients_high_risk.csv
with open(os.path.join(BASE_DIR, 'clients_high_risk.csv'), 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for r in original_rows:
        writer.writerow(make_high_risk(r))

# 4. clients_mixed.csv
with open(os.path.join(BASE_DIR, 'clients_mixed.csv'), 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for i, r in enumerate(original_rows):
        if i % 3 == 0:
            writer.writerow(make_high_risk(r))
        elif i % 3 == 1:
            writer.writerow(make_medium_risk(r))
        else:
            writer.writerow(make_low_risk(r))

print("Generated 4 CSVs: clients_low_risk.csv, clients_medium_risk.csv, clients_high_risk.csv, clients_mixed.csv")
