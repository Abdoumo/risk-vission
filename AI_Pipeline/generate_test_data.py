import csv
import random
import os

ARABIC_NAMES = [
    "محمد بن سالم", "كريم بوزيدي", "سارة حميدي", "أحمد طاهر", "فاطمة الزهراء", 
    "عبد الله منصور", "يوسف قادري", "زينب عماري", "علي بوعلام", "ليلى شريف",
    "عمر حشاني", "نور الدين عمار", "حسيبة خيذر", "طارق بلعيد", "أمينة قسول",
    "SARL ConstantinePro", "EURL BatiDz", "SNC Tlemcen Immo", "SPA ElDjazaïr Tech"
]

def generate_bulk_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "DATASETS")
    
    bankloans_path = os.path.join(data_dir, "bankloans.csv")
    cards_path = os.path.join(data_dir, "cards_data.csv")
    loans_new_path = os.path.join(data_dir, "Loan new datset.csv")
    
    output_path = os.path.join(base_dir, "clients_bulk_test.csv")
    
    # Load bankloans
    with open(bankloans_path, "r", encoding="utf-8") as f:
        bankloans_rows = list(csv.DictReader(f))
        
    # Load cards
    with open(cards_path, "r", encoding="utf-8") as f:
        cards_rows = list(csv.DictReader(f))

    # Load loans_new
    with open(loans_new_path, "r", encoding="utf-8") as f:
        loans_new_rows = list(csv.DictReader(f))

    # Sample 50
    sampled_bankloans = random.sample(bankloans_rows, min(50, len(bankloans_rows)))

    output_headers = [
        "client_name",
        # Bankloans
        "age", "employ", "income", "debtinc", "creddebt", "othdebt", "default",
        # Documents
        "kashf_ratib", "sijil_tijari", "ouqoud", "damanat", "wathaiq_zoboun",
        # Cards
        "card_brand", "card_type", "credit_limit", "has_chip", "card_on_dark_web",
        # Loans New
        "MaritalStatus", "EducationLevel", "EmploymentStatus", "HomeOwnershipStatus", "BankruptcyHistory"
    ]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=output_headers)
        writer.writeheader()
        
        for row in sampled_bankloans:
            client_name = random.choice(ARABIC_NAMES)
            is_company = "SARL" in client_name or "EURL" in client_name or "SNC" in client_name or "SPA" in client_name
            is_default = row.get("default") == "1"
            
            c_row = random.choice(cards_rows)
            l_row = random.choice(loans_new_rows)
            
            out_row = {
                "client_name": client_name,
                "age": row.get("age", ""),
                "employ": row.get("employ", ""),
                "income": row.get("income", ""),
                "debtinc": row.get("debtinc", ""),
                "creddebt": row.get("creddebt", ""),
                "othdebt": row.get("othdebt", ""),
                "default": row.get("default", ""),
                
                "kashf_ratib": "true" if not is_company else "false",
                "sijil_tijari": "true" if is_company else "false",
                "ouqoud": "true" if random.random() > (0.6 if is_default else 0.1) else "false",
                "damanat": "true" if random.random() > (0.7 if is_default else 0.2) else "false",
                "wathaiq_zoboun": "true" if random.random() > (0.4 if is_default else 0.05) else "false",
                
                "card_brand": c_row.get("card_brand", ""),
                "card_type": c_row.get("card_type", ""),
                "credit_limit": c_row.get("credit_limit", ""),
                "has_chip": c_row.get("has_chip", ""),
                "card_on_dark_web": c_row.get("card_on_dark_web", ""),
                
                "MaritalStatus": l_row.get("MaritalStatus", ""),
                "EducationLevel": l_row.get("EducationLevel", ""),
                "EmploymentStatus": l_row.get("EmploymentStatus", ""),
                "HomeOwnershipStatus": l_row.get("HomeOwnershipStatus", ""),
                "BankruptcyHistory": l_row.get("BankruptcyHistory", ""),
            }
            writer.writerow(out_row)
            
    print(f"Generated {len(sampled_bankloans)} master rows in {output_path}")

if __name__ == "__main__":
    generate_bulk_data()
