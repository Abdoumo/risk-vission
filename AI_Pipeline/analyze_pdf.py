import fitz  # PyMuPDF
import sys
import json
import os
import re

sys.path.append(r"c:\Users\abdou\Downloads\ALGORISK\AlgoRiskAI\AI_Pipeline")
try:
    from kyc_engine import KYCEngine
except ImportError as e:
    print(f"Error importing KYCEngine: {e}")
    sys.exit(1)

def extract_pdf_text(pdf_path):
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text()
    except Exception as e:
        return str(e)
    return text

def parse_profile_from_text(text):
    text_lower = text.lower()
    
    # Simple heuristic to extract risk scores or assign them based on keywords
    profile = {
        "identity_risk": 20,
        "business_risk": 20,
        "financial_risk": 20,
        "geographic_risk": 20,
        "product_risk": 20,
        "channel_risk": 20,
        "behavioral_risk": 20,
        "data_quality_risk": 20
    }
    
    if "high risk" in text_lower or "sanction" in text_lower or "pep" in text_lower:
        profile["identity_risk"] = 80
        profile["geographic_risk"] = 85
        
    if "offshore" in text_lower or "shell company" in text_lower:
        profile["business_risk"] = 90
        profile["financial_risk"] = 85
        
    if "inconsistent" in text_lower or "missing" in text_lower:
        profile["data_quality_risk"] = 70
        
    if "cash intensive" in text_lower:
        profile["product_risk"] = 75
        profile["channel_risk"] = 80

    return profile

if __name__ == "__main__":
    pdf_path = r"c:\Users\abdou\Downloads\ALGORISK\AlgoRiskAI\KYC .PDF"
    if not os.path.exists(pdf_path):
        print(json.dumps({"error": f"File not found: {pdf_path}"}))
        sys.exit(1)
        
    text = extract_pdf_text(pdf_path)
    if "No such file" in text or "Error" in text and len(text) < 100:
        print(json.dumps({"error": text}))
        sys.exit(1)
        
    profile = parse_profile_from_text(text)
    engine = KYCEngine()
    result = engine.evaluate_static_risk(profile)
    
    print(json.dumps({
        "raw_text_preview": text[:500] + "...",
        "profile_extracted": profile,
        "kyc_result": result
    }))
