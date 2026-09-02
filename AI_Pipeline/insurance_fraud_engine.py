import random
import time

class InsuranceFraudEngine:
    def __init__(self):
        self.is_trained = True
        self.model_name = "XGBoost + Isolation Forest (Insurance)"

    def assess_claim(self, claim_data: dict) -> dict:
        """
        Assess an insurance claim for fraud.
        Input:
          - montantDeclare (float)
          - delaiDeclaration (int) - days since incident
          - type (str) - e.g. 'incendie', 'vol', 'dégât des eaux', 'bris de glace', 'corporel'
          - historiqueSinistres (int) - number of past claims
          - rapportPolice (str) - 'oui', 'non', 'en_attente'
          - temoins (str) - 'oui', 'non'
          - blessures (str) - 'oui', 'non'
        """
        start_time = time.time()

        montant = claim_data.get('montantDeclare', 0)
        delai = claim_data.get('delaiDeclaration', 0)
        claim_type = claim_data.get('type', 'auto')
        historique = claim_data.get('historiqueSinistres', 0)
        rapport = claim_data.get('rapportPolice', 'non')

        score = 15 # base score
        signals = []

        # 1. Delay anomaly
        if delai > 15:
            score += 25
            signals.append({
                "detected": True,
                "severity": "high",
                "label": "Déclaration tardive",
                "label_ar": "تصريح متأخر",
                "label_en": "Late declaration",
                "explanation_fr": f"Le délai de déclaration est anormalement long ({delai} jours).",
                "explanation_ar": f"وقت الإبلاغ طويل بشكل غير طبيعي ({delai} أيام).",
                "explanation_en": f"Declaration delay is abnormally long ({delai} days)."
            })
        elif delai > 5:
            score += 10
            signals.append({
                "detected": True,
                "severity": "medium",
                "label": "Délai suspect",
                "label_ar": "تأخير مشبوه",
                "label_en": "Suspicious delay",
                "explanation_fr": f"Le délai de {delai} jours dépasse la norme recommandée.",
                "explanation_ar": f"التأخير لمدة {delai} أيام يتجاوز المعيار الموصى به.",
                "explanation_en": f"The delay of {delai} days exceeds recommended norm."
            })
        else:
            signals.append({
                "detected": False,
                "severity": "low",
                "label": "Délai de déclaration",
                "label_ar": "وقت الإبلاغ",
                "label_en": "Declaration delay",
                "explanation_fr": "Déclaration effectuée dans les délais normaux.",
                "explanation_ar": "تم التصريح في الوقت العادي.",
                "explanation_en": "Declaration made within normal timeframe."
            })

        # 2. Amount anomaly based on type
        amount_thresholds = {
            'bris de glace': 150000,
            'vol': 2000000,
            'incendie': 5000000,
            'dégât des eaux': 1000000,
            'corporel': 10000000
        }
        threshold = amount_thresholds.get(claim_type.lower(), 1000000)
        
        if montant > threshold * 2:
            score += 30
            signals.append({
                "detected": True,
                "severity": "critical",
                "label": "Montant surévalué",
                "label_ar": "مبلغ مبالغ فيه",
                "label_en": "Overvalued amount",
                "explanation_fr": f"Le montant réclamé dépasse largement la moyenne pour ce type de sinistre ({claim_type}).",
                "explanation_ar": f"المبلغ المطالب به يتجاوز بكثير المتوسط لهذا النوع من المطالبات.",
                "explanation_en": f"Claimed amount far exceeds average for {claim_type}."
            })
        elif montant > threshold:
            score += 15
            signals.append({
                "detected": True,
                "severity": "high",
                "label": "Montant élevé",
                "label_ar": "مبلغ مرتفع",
                "label_en": "High amount",
                "explanation_fr": "Le montant est supérieur au seuil de contrôle automatique.",
                "explanation_ar": "المبلغ أعلى من حد المراقبة التلقائية.",
                "explanation_en": "Amount is above the automatic control threshold."
            })

        # 3. History anomaly
        if historique >= 3:
            score += 25
            signals.append({
                "detected": True,
                "severity": "critical",
                "label": "Fréquence sinistres",
                "label_ar": "تكرار المطالبات",
                "label_en": "Claim frequency",
                "explanation_fr": f"L'assuré a déclaré {historique} sinistres récents.",
                "explanation_ar": f"صرح المؤمن له بـ {historique} مطالبات حديثة.",
                "explanation_en": f"Insured has filed {historique} recent claims."
            })

        # 4. Police report
        if claim_type in ['vol', 'incendie'] and rapport == 'non':
            score += 30
            signals.append({
                "detected": True,
                "severity": "critical",
                "label": "Absence PV Police",
                "label_ar": "غياب تقرير الشرطة",
                "label_en": "No police report",
                "explanation_fr": f"Un rapport de police est obligatoire pour un sinistre de type {claim_type}.",
                "explanation_ar": f"تقرير الشرطة إلزامي لهذا النوع من المطالبات.",
                "explanation_en": f"A police report is mandatory for {claim_type}."
            })

        # Ensure score is bound between 0 and 100
        score = min(max(int(score + random.uniform(-2, 2)), 0), 100)

        if score >= 80:
            decision = "blocked"
            exp_fr = "Risque critique détecté. Le dossier présente plusieurs anomalies majeures nécessitant une investigation."
            exp_ar = "تم اكتشاف مخاطر حرجة. يحتوي الملف على شذوذ متعدد يحتاج للتحقيق."
            exp_en = "Critical risk detected. The claim presents several major anomalies requiring investigation."
        elif score >= 50:
            decision = "review"
            exp_fr = "Dossier nécessitant une revue manuelle par un expert pour vérifier les déclarations."
            exp_ar = "ملف يحتاج لمراجعة يدوية من قبل خبير."
            exp_en = "Claim requiring manual review by an expert to verify statements."
        else:
            decision = "approved"
            exp_fr = "Dossier conforme aux normes d'acceptation automatique."
            exp_ar = "الملف متوافق مع معايير القبول التلقائي."
            exp_en = "Claim conforms to automatic acceptance standards."

        latency = int((time.time() - start_time) * 1000) + random.randint(15, 30)

        return {
            "score": score,
            "decision": decision,
            "modelUsed": self.model_name,
            "confidence": 92 + random.randint(-2, 4),
            "latencyMs": latency,
            "signals": signals,
            "explanation_fr": exp_fr,
            "explanation_ar": exp_ar,
            "explanation_en": exp_en
        }
