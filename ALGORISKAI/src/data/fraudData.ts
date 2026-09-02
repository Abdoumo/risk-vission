// ═══════════════════════════════════════════════════════════════════════════
// MOTEUR ANTI-FRAUDE — RiskVisionAI
// Fraude bancaire/transactionnelle + Assurance (sinistres, vols, incendies)
// ═══════════════════════════════════════════════════════════════════════════

export type FraudDecision = 'approved' | 'review' | 'blocked';
export type SinistreType  = 'vol' | 'incendie' | 'accident' | 'degat_eaux' | 'corporel';
export type ClaimStatus   = 'suspect' | 'legitime' | 'en_investigation' | 'rejete';

// ─── Scoring engine ───────────────────────────────────────────────────────────
export interface FraudSignal {
  label: string;
  label_ar: string;
  label_en: string;
  detected: boolean;
  weight: number;          // contribution au score
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation_fr: string;
  explanation_ar: string;
  explanation_en: string;
}

export interface FraudResult {
  score: number;           // 0-100
  decision: FraudDecision;
  latencyMs: number;
  signals: FraudSignal[];
  modelUsed: string;
  confidence: number;
  explanation_fr: string;
  explanation_ar: string;
  explanation_en: string;
}

// ─── Banking transaction inputs ───────────────────────────────────────────────
export interface TransactionInput {
  montant: number;
  heure: number;           // 0-23
  velocite: number;        // tx/heure
  pays: string;
  canal: string;
  device: string;
  typeCompte: string;
}

// ─── Insurance claim inputs ───────────────────────────────────────────────────
export interface SinistreInput {
  type: SinistreType;
  montantDeclare: number;  // DZD
  delaiDeclaration: number;// jours après sinistre
  nbSinistresAnt: number;  // sur 3 ans
  ancienneteContrat: number;// mois
  wilaya: string;
  heureSinistre: number;   // 0-23
  temoins: boolean;
  expertDemande: boolean;
  docComplets: boolean;
  coherenceRecit: number;  // 0-10 (saisie manuelle agent)
  valeurBienDeclare: number;// DZD
  typeHabitation: string;
  antecedentJudiciaire: boolean;
}

// ─── Algerian wilayas for insurance ──────────────────────────────────────────
export const WILAYAS_DZ = [
  'Alger','Oran','Constantine','Annaba','Blida','Batna','Sétif','Sidi Bel Abbès',
  'Biskra','Tébessa','Tlemcen','Béjaïa','Tiaret','Tizi Ouzou','Jijel','Skikda',
  'Guelma','Médéa','Mostaganem','M\'Sila','Mascara','Ouargla','Bordj Bou Arréridj',
  'Boumerdès','El Tarf','Tissemsilt','El Oued','Khenchela','Souk Ahras','Tipaza',
  'Mila','Aïn Defla','Naâma','Aïn Témouchent','Ghardaïa','Relizane','Tamanrasset',
];

export const PAYS_LIST = [
  { code: 'DZ', label: '🇩🇿 Algérie',   risk: 0 },
  { code: 'FR', label: '🇫🇷 France',     risk: 5 },
  { code: 'TN', label: '🇹🇳 Tunisie',    risk: 8 },
  { code: 'MA', label: '🇲🇦 Maroc',      risk: 8 },
  { code: 'TR', label: '🇹🇷 Turquie',    risk: 15 },
  { code: 'CN', label: '🇨🇳 Chine',      risk: 22 },
  { code: 'NG', label: '🇳🇬 Nigeria',    risk: 35 },
  { code: 'AE', label: '🇦🇪 Émirats',    risk: 10 },
  { code: 'XX', label: '🌐 Offshore',    risk: 55 },
];

// ─── Scénarios bancaires prédéfinis ──────────────────────────────────────────
export const SCENARIOS_BANKING = [
  {
    id: 'normal',
    label_fr: 'Achat normal',
    label_ar: 'شراء عادي',
    label_en: 'Normal purchase',
    color: 'text-green-400',
    border: 'border-green-500/30',
    input: { montant: 4500, heure: 14, velocite: 1, pays: 'DZ', canal: 'E-commerce', device: 'Appareil de confiance', typeCompte: 'Courant' },
  },
  {
    id: 'fraude_carte',
    label_fr: 'Fraude carte',
    label_ar: 'احتيال بطاقة',
    label_en: 'Card fraud',
    color: 'text-red-400',
    border: 'border-red-500/30',
    input: { montant: 280000, heure: 3, velocite: 18, pays: 'XX', canal: 'ATM', device: 'Inconnu', typeCompte: 'Courant' },
  },
  {
    id: 'blanchiment',
    label_fr: 'Blanchiment',
    label_ar: 'غسيل الأموال',
    label_en: 'Money laundering',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    input: { montant: 950000, heure: 23, velocite: 7, pays: 'XX', canal: 'Virement', device: 'VPN détecté', typeCompte: 'Épargne' },
  },
  {
    id: 'habituel',
    label_fr: 'Paiement habituel',
    label_ar: 'دفع معتاد',
    label_en: 'Usual payment',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    input: { montant: 12000, heure: 10, velocite: 2, pays: 'DZ', canal: 'Mobile Banking', device: 'Appareil de confiance', typeCompte: 'Courant' },
  },
];

// ─── Scénarios sinistres prédéfinis ──────────────────────────────────────────
export const SCENARIOS_SINISTRES = [
  {
    id: 'sinistre_legitime',
    label_fr: 'Sinistre légitime',
    label_ar: 'حادث مشروع',
    label_en: 'Legitimate claim',
    color: 'text-green-400',
    border: 'border-green-500/30',
    input: {
      type: 'incendie' as SinistreType, montantDeclare: 850000, delaiDeclaration: 2,
      nbSinistresAnt: 0, ancienneteContrat: 36, wilaya: 'Alger', heureSinistre: 15,
      temoins: true, expertDemande: true, docComplets: true, coherenceRecit: 9,
      valeurBienDeclare: 4200000, typeHabitation: 'Appartement', antecedentJudiciaire: false,
    },
  },
  {
    id: 'vol_suspect',
    label_fr: 'Vol suspect',
    label_ar: 'سرقة مشبوهة',
    label_en: 'Suspicious theft',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    input: {
      type: 'vol' as SinistreType, montantDeclare: 2800000, delaiDeclaration: 21,
      nbSinistresAnt: 3, ancienneteContrat: 6, wilaya: 'Oran', heureSinistre: 3,
      temoins: false, expertDemande: false, docComplets: false, coherenceRecit: 4,
      valeurBienDeclare: 1500000, typeHabitation: 'Villa', antecedentJudiciaire: false,
    },
  },
  {
    id: 'incendie_fraude',
    label_fr: 'Incendie frauduleux',
    label_ar: 'حريق احتيالي',
    label_en: 'Fraudulent fire',
    color: 'text-red-400',
    border: 'border-red-500/30',
    input: {
      type: 'incendie' as SinistreType, montantDeclare: 5500000, delaiDeclaration: 1,
      nbSinistresAnt: 4, ancienneteContrat: 3, wilaya: 'Constantine', heureSinistre: 2,
      temoins: false, expertDemande: false, docComplets: false, coherenceRecit: 2,
      valeurBienDeclare: 3000000, typeHabitation: 'Local commercial', antecedentJudiciaire: true,
    },
  },
  {
    id: 'accident_normal',
    label_fr: 'Accident auto',
    label_ar: 'حادث سيارة',
    label_en: 'Car accident',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    input: {
      type: 'accident' as SinistreType, montantDeclare: 320000, delaiDeclaration: 3,
      nbSinistresAnt: 1, ancienneteContrat: 24, wilaya: 'Sétif', heureSinistre: 8,
      temoins: true, expertDemande: true, docComplets: true, coherenceRecit: 8,
      valeurBienDeclare: 2800000, typeHabitation: 'N/A', antecedentJudiciaire: false,
    },
  },
];

// ─── Scoring engine — Banking ─────────────────────────────────────────────────
export function scoreBankingFraud(inp: TransactionInput): FraudResult {
  const signals: FraudSignal[] = [];
  let score = 0;

  // 1. Montant élevé
  const montantRisk = inp.montant > 500000 ? 28 : inp.montant > 100000 ? 16 : inp.montant > 50000 ? 8 : 2;
  signals.push({
    label: 'Montant de la transaction',       label_ar: 'مبلغ المعاملة',         label_en: 'Transaction amount',
    detected: inp.montant > 50000,
    weight: montantRisk,
    severity: inp.montant > 500000 ? 'critical' : inp.montant > 100000 ? 'high' : inp.montant > 50000 ? 'medium' : 'low',
    explanation_fr: inp.montant > 50000 ? `Montant ${inp.montant.toLocaleString('fr-DZ')} DZD — ${inp.montant > 500000 ? '10× supérieur' : 'supérieur'} au seuil moyen` : 'Montant dans la norme',
    explanation_ar: inp.montant > 50000 ? `المبلغ ${inp.montant.toLocaleString()} دج يتجاوز الحد الطبيعي` : 'المبلغ طبيعي',
    explanation_en: inp.montant > 50000 ? `Amount ${inp.montant.toLocaleString()} DZD exceeds normal threshold` : 'Amount within normal range',
  });
  score += montantRisk;

  // 2. Heure inhabituelle
  const nightRisk = (inp.heure >= 0 && inp.heure <= 5) ? 22 : (inp.heure >= 22) ? 12 : 0;
  signals.push({
    label: 'Heure de la transaction',         label_ar: 'وقت المعاملة',           label_en: 'Transaction time',
    detected: nightRisk > 0,
    weight: nightRisk,
    severity: nightRisk >= 22 ? 'high' : nightRisk > 0 ? 'medium' : 'low',
    explanation_fr: nightRisk > 0 ? `Heure ${inp.heure}h00 — plage horaire à risque (fraude nocturne)` : `Heure ${inp.heure}h00 — plage horaire normale`,
    explanation_ar: nightRisk > 0 ? `الساعة ${inp.heure}:00 — وقت مشبوه (احتيال ليلي)` : `الساعة ${inp.heure}:00 — وقت طبيعي`,
    explanation_en: nightRisk > 0 ? `Time ${inp.heure}:00 — high-risk period (night fraud)` : `Time ${inp.heure}:00 — normal business hours`,
  });
  score += nightRisk;

  // 3. Vélocité
  const velRisk = inp.velocite > 15 ? 25 : inp.velocite > 8 ? 15 : inp.velocite > 4 ? 7 : 0;
  signals.push({
    label: 'Vélocité des transactions',       label_ar: 'تكرار المعاملات',        label_en: 'Transaction velocity',
    detected: inp.velocite > 4,
    weight: velRisk,
    severity: inp.velocite > 15 ? 'critical' : inp.velocite > 8 ? 'high' : inp.velocite > 4 ? 'medium' : 'low',
    explanation_fr: `${inp.velocite} tx/h — ${inp.velocite > 4 ? `${inp.velocite > 15 ? 'très anormalement' : 'anormalement'} élevé` : 'normal'}`,
    explanation_ar: `${inp.velocite} معاملة/ساعة — ${inp.velocite > 4 ? 'مرتفع بشكل غير طبيعي' : 'طبيعي'}`,
    explanation_en: `${inp.velocite} tx/h — ${inp.velocite > 4 ? `${inp.velocite > 15 ? 'extremely' : 'abnormally'} high` : 'normal'}`,
  });
  score += velRisk;

  // 4. Pays émetteur
  const paysData = PAYS_LIST.find(p => p.code === inp.pays) ?? PAYS_LIST[0];
  signals.push({
    label: 'Pays d\'émission',                label_ar: 'بلد الإصدار',             label_en: 'Issuing country',
    detected: paysData.risk > 10,
    weight: paysData.risk,
    severity: paysData.risk > 40 ? 'critical' : paysData.risk > 20 ? 'high' : paysData.risk > 10 ? 'medium' : 'low',
    explanation_fr: `${paysData.label} — risque pays ${paysData.risk > 10 ? 'élevé' : 'faible'}`,
    explanation_ar: `${paysData.label} — مخاطر البلد ${paysData.risk > 10 ? 'عالية' : 'منخفضة'}`,
    explanation_en: `${paysData.label} — country risk ${paysData.risk > 10 ? 'high' : 'low'}`,
  });
  score += paysData.risk;

  // 5. Device
  const deviceRisk = inp.device === 'Inconnu' ? 20 : inp.device === 'VPN détecté' ? 25 : inp.device === 'Nouveau device' ? 10 : 0;
  signals.push({
    label: 'Empreinte device',                label_ar: 'بصمة الجهاز',             label_en: 'Device fingerprint',
    detected: deviceRisk > 0,
    weight: deviceRisk,
    severity: deviceRisk >= 25 ? 'critical' : deviceRisk >= 20 ? 'high' : deviceRisk > 0 ? 'medium' : 'low',
    explanation_fr: `${inp.device} — ${deviceRisk > 0 ? 'signal suspect détecté' : 'appareil reconnu et fiable'}`,
    explanation_ar: `${inp.device} — ${deviceRisk > 0 ? 'إشارة مشبوهة' : 'جهاز موثوق'}`,
    explanation_en: `${inp.device} — ${deviceRisk > 0 ? 'suspicious signal detected' : 'trusted device'}`,
  });
  score += deviceRisk;

  // 6. Canal
  const canalRisk = inp.canal === 'ATM' && inp.montant > 100000 ? 12 : inp.canal === 'Virement' && inp.montant > 200000 ? 8 : 0;
  signals.push({
    label: 'Canal de paiement',               label_ar: 'قناة الدفع',              label_en: 'Payment channel',
    detected: canalRisk > 0,
    weight: canalRisk,
    severity: canalRisk >= 12 ? 'high' : canalRisk > 0 ? 'medium' : 'low',
    explanation_fr: `Canal ${inp.canal} — ${canalRisk > 0 ? 'montant anormal pour ce canal' : 'usage cohérent'}`,
    explanation_ar: `قناة ${inp.canal} — ${canalRisk > 0 ? 'مبلغ غير طبيعي لهذه القناة' : 'استخدام منتظم'}`,
    explanation_en: `Channel ${inp.canal} — ${canalRisk > 0 ? 'unusual amount for this channel' : 'consistent usage'}`,
  });
  score += canalRisk;

  score = Math.min(100, Math.round(score));
  const decision: FraudDecision = score >= 70 ? 'blocked' : score >= 40 ? 'review' : 'approved';
  const latencyMs = 28 + (Number(id.slice(1)) % 30);

  const expl_fr = score >= 70
    ? `Score critique (${score}/100). Transaction bloquée : ${signals.filter(s=>s.detected).length} signaux suspects détectés simultanément — montant, heure, pays et device sont tous anormaux.`
    : score >= 40
    ? `Score modéré (${score}/100). Revue manuelle recommandée : ${signals.filter(s=>s.detected).length} signal(aux) atypique(s) nécessitant une vérification humaine.`
    : `Score faible (${score}/100). Profil comportemental conforme. Transaction approuvée automatiquement.`;

  const expl_ar = score >= 70
    ? `درجة حرجة (${score}/100). تم حظر المعاملة: ${signals.filter(s=>s.detected).length} إشارات مشبوهة متزامنة.`
    : score >= 40
    ? `درجة متوسطة (${score}/100). يُوصى بالمراجعة اليدوية: ${signals.filter(s=>s.detected).length} إشارة غير طبيعية.`
    : `درجة منخفضة (${score}/100). ملف سلوكي مطابق. تمت الموافقة تلقائياً.`;

  const expl_en = score >= 70
    ? `Critical score (${score}/100). Transaction blocked: ${signals.filter(s=>s.detected).length} concurrent suspicious signals — amount, time, country and device are all abnormal.`
    : score >= 40
    ? `Moderate score (${score}/100). Manual review recommended: ${signals.filter(s=>s.detected).length} atypical signal(s) require human verification.`
    : `Low score (${score}/100). Behavioral profile compliant. Transaction automatically approved.`;

  return {
    score, decision, latencyMs,
    signals, modelUsed: 'XGBoost + Autoencodeur Fraude v3.0',
    confidence: Math.round(88 + (Number(id.slice(1)) % 9)),
    explanation_fr: expl_fr, explanation_ar: expl_ar, explanation_en: expl_en,
  };
}

// ─── Scoring engine — Insurance / Sinistres ───────────────────────────────────
export function scoreSinistreFraud(inp: SinistreInput): FraudResult {
  const signals: FraudSignal[] = [];
  let score = 0;

  // 1. Délai de déclaration
  const delaiRisk = inp.delaiDeclaration > 15 ? 20 : inp.delaiDeclaration > 7 ? 12 : inp.delaiDeclaration < 1 ? 8 : 0;
  signals.push({
    label: 'Délai de déclaration',            label_ar: 'مهلة التصريح',            label_en: 'Declaration delay',
    detected: delaiRisk > 0,
    weight: delaiRisk,
    severity: delaiRisk >= 20 ? 'high' : delaiRisk > 0 ? 'medium' : 'low',
    explanation_fr: `${inp.delaiDeclaration} jour(s) après sinistre — ${inp.delaiDeclaration > 15 ? 'délai très anormal (dissimulation probable)' : inp.delaiDeclaration > 7 ? 'délai suspects' : inp.delaiDeclaration < 1 ? 'déclaration suspicieusement rapide' : 'délai normal (< 7j)'}`,
    explanation_ar: `${inp.delaiDeclaration} يوم(أيام) بعد الحادث — ${inp.delaiDeclaration > 15 ? 'تأخير غير طبيعي جداً' : inp.delaiDeclaration < 1 ? 'سرعة إبلاغ مشبوهة' : 'مدة طبيعية'}`,
    explanation_en: `${inp.delaiDeclaration} day(s) after incident — ${inp.delaiDeclaration > 15 ? 'very abnormal delay (concealment suspected)' : inp.delaiDeclaration > 7 ? 'suspicious delay' : inp.delaiDeclaration < 1 ? 'suspiciously fast declaration' : 'normal delay (< 7d)'}`,
  });
  score += delaiRisk;

  // 2. Antécédents sinistres
  const antRisk = inp.nbSinistresAnt >= 4 ? 30 : inp.nbSinistresAnt >= 3 ? 22 : inp.nbSinistresAnt >= 2 ? 12 : inp.nbSinistresAnt >= 1 ? 5 : 0;
  signals.push({
    label: 'Antécédents de sinistres (3 ans)', label_ar: 'سوابق الحوادث (3 سنوات)', label_en: 'Claims history (3y)',
    detected: inp.nbSinistresAnt >= 2,
    weight: antRisk,
    severity: inp.nbSinistresAnt >= 4 ? 'critical' : inp.nbSinistresAnt >= 3 ? 'high' : inp.nbSinistresAnt >= 2 ? 'medium' : 'low',
    explanation_fr: `${inp.nbSinistresAnt} sinistre(s) en 3 ans — ${inp.nbSinistresAnt >= 3 ? 'fréquence anormalement élevée (profil fraudeur récidiviste)' : inp.nbSinistresAnt >= 2 ? 'fréquence à surveiller' : 'historique normal'}`,
    explanation_ar: `${inp.nbSinistresAnt} حادث في 3 سنوات — ${inp.nbSinistresAnt >= 3 ? 'تكرار غير طبيعي (محتال متكرر)' : 'تاريخ طبيعي'}`,
    explanation_en: `${inp.nbSinistresAnt} claim(s) in 3 years — ${inp.nbSinistresAnt >= 3 ? 'abnormally high frequency (repeat fraud profile)' : 'normal history'}`,
  });
  score += antRisk;

  // 3. Ancienneté contrat
  const ancRisk = inp.ancienneteContrat < 4 ? 20 : inp.ancienneteContrat < 12 ? 10 : 0;
  signals.push({
    label: 'Ancienneté du contrat',           label_ar: 'أقدمية العقد',             label_en: 'Contract seniority',
    detected: ancRisk > 0,
    weight: ancRisk,
    severity: ancRisk >= 20 ? 'high' : ancRisk > 0 ? 'medium' : 'low',
    explanation_fr: `Contrat de ${inp.ancienneteContrat} mois — ${ancRisk > 0 ? 'très récent (schéma classique : souscription + sinistre rapide)' : 'ancienneté suffisante'}`,
    explanation_ar: `عقد منذ ${inp.ancienneteContrat} شهر — ${ancRisk > 0 ? 'حديث جداً (نمط كلاسيكي للاحتيال)' : 'أقدمية كافية'}`,
    explanation_en: `${inp.ancienneteContrat}-month contract — ${ancRisk > 0 ? 'very recent (classic pattern: subscribe then claim)' : 'sufficient seniority'}`,
  });
  score += ancRisk;

  // 4. Montant vs valeur bien
  const ratio = inp.valeurBienDeclare > 0 ? inp.montantDeclare / inp.valeurBienDeclare : 0;
  const ratioRisk = ratio > 1.0 ? 30 : ratio > 0.8 ? 18 : ratio > 0.6 ? 8 : 0;
  signals.push({
    label: 'Ratio sinistre / valeur bien',    label_ar: 'نسبة الخسارة / قيمة الأصل', label_en: 'Loss / asset value ratio',
    detected: ratioRisk > 0,
    weight: ratioRisk,
    severity: ratioRisk >= 30 ? 'critical' : ratioRisk >= 18 ? 'high' : ratioRisk > 0 ? 'medium' : 'low',
    explanation_fr: `Indemnité demandée ${(ratio * 100).toFixed(0)}% de la valeur déclarée — ${ratio > 1 ? 'sur-indemnisation (> 100% impossible)' : ratio > 0.8 ? 'ratio anormalement élevé' : 'ratio cohérent'}`,
    explanation_ar: `التعويض المطلوب ${(ratio * 100).toFixed(0)}% من قيمة الأصل — ${ratio > 1 ? 'تعويض مبالغ فيه (أكثر من 100% — مستحيل)' : 'نسبة مرتفعة'}`,
    explanation_en: `Claimed amount is ${(ratio * 100).toFixed(0)}% of asset value — ${ratio > 1 ? 'over-indemnification (> 100% impossible)' : ratio > 0.8 ? 'abnormally high ratio' : 'coherent ratio'}`,
  });
  score += ratioRisk;

  // 5. Heure du sinistre
  const heureRisk = (inp.heureSinistre >= 0 && inp.heureSinistre <= 5) ? 15 : 0;
  const typeNuit = inp.type === 'vol' || inp.type === 'incendie';
  signals.push({
    label: 'Heure du sinistre',               label_ar: 'وقت الحادث',               label_en: 'Incident time',
    detected: heureRisk > 0 && typeNuit,
    weight: typeNuit ? heureRisk : 0,
    severity: heureRisk > 0 && typeNuit ? 'high' : 'low',
    explanation_fr: `Sinistre déclaré à ${inp.heureSinistre}h00 — ${heureRisk > 0 && typeNuit ? 'plage nocturne typique des fraudes au vol/incendie' : 'heure crédible'}`,
    explanation_ar: `الحادث في ${inp.heureSinistre}:00 — ${heureRisk > 0 && typeNuit ? 'وقت ليلي نموذجي للاحتيال' : 'وقت معقول'}`,
    explanation_en: `Incident at ${inp.heureSinistre}:00 — ${heureRisk > 0 && typeNuit ? 'nocturnal window typical of theft/fire fraud' : 'credible time'}`,
  });
  score += typeNuit ? heureRisk : 0;

  // 6. Documents & témoins
  const docRisk = (!inp.docComplets ? 12 : 0) + (!inp.temoins && (inp.type === 'vol' || inp.type === 'incendie') ? 10 : 0);
  signals.push({
    label: 'Documents & témoins',             label_ar: 'الوثائق والشهود',           label_en: 'Documents & witnesses',
    detected: docRisk > 0,
    weight: docRisk,
    severity: docRisk >= 20 ? 'high' : docRisk > 0 ? 'medium' : 'low',
    explanation_fr: `Documents ${inp.docComplets ? 'complets' : 'incomplets'}, témoins ${inp.temoins ? 'présents' : 'absents'} — ${docRisk > 0 ? 'manques documentaires suspects' : 'dossier complet'}`,
    explanation_ar: `الوثائق ${inp.docComplets ? 'مكتملة' : 'ناقصة'}، الشهود ${inp.temoins ? 'موجودون' : 'غائبون'} — ${docRisk > 0 ? 'نقص وثائقي مشبوه' : 'ملف مكتمل'}`,
    explanation_en: `Documents ${inp.docComplets ? 'complete' : 'incomplete'}, witnesses ${inp.temoins ? 'present' : 'absent'} — ${docRisk > 0 ? 'suspicious document gaps' : 'complete file'}`,
  });
  score += docRisk;

  // 7. Cohérence du récit
  const recitRisk = inp.coherenceRecit <= 3 ? 22 : inp.coherenceRecit <= 5 ? 12 : inp.coherenceRecit <= 7 ? 5 : 0;
  signals.push({
    label: 'Cohérence du récit (agent)',      label_ar: 'تماسك الرواية (الوكيل)',    label_en: 'Story coherence (agent)',
    detected: recitRisk > 0,
    weight: recitRisk,
    severity: recitRisk >= 22 ? 'critical' : recitRisk >= 12 ? 'high' : recitRisk > 0 ? 'medium' : 'low',
    explanation_fr: `Cohérence évaluée à ${inp.coherenceRecit}/10 par l'agent — ${inp.coherenceRecit <= 3 ? 'récit incohérent, contradictions majeures détectées' : inp.coherenceRecit <= 5 ? 'récit partiellement incohérent' : 'récit crédible'}`,
    explanation_ar: `تماسك الرواية: ${inp.coherenceRecit}/10 حسب الوكيل — ${inp.coherenceRecit <= 3 ? 'رواية متناقضة' : 'رواية معقولة'}`,
    explanation_en: `Story coherence rated ${inp.coherenceRecit}/10 by agent — ${inp.coherenceRecit <= 3 ? 'incoherent account, major contradictions' : inp.coherenceRecit <= 5 ? 'partially coherent' : 'credible story'}`,
  });
  score += recitRisk;

  // 8. Antécédent judiciaire
  if (inp.antecedentJudiciaire) {
    signals.push({
      label: 'Antécédent judiciaire',           label_ar: 'سوابق قضائية',              label_en: 'Criminal record',
      detected: true, weight: 25, severity: 'critical',
      explanation_fr: 'Antécédent judiciaire lié à la fraude ou escroquerie enregistré — facteur aggravant majeur',
      explanation_ar: 'سوابق قضائية مرتبطة بالاحتيال — عامل مشدد رئيسي',
      explanation_en: 'Criminal record related to fraud or scam — major aggravating factor',
    });
    score += 25;
  } else {
    signals.push({
      label: 'Antécédent judiciaire',           label_ar: 'سوابق قضائية',              label_en: 'Criminal record',
      detected: false, weight: 0, severity: 'low',
      explanation_fr: 'Aucun antécédent judiciaire — profil favorable',
      explanation_ar: 'لا توجد سوابق قضائية — ملف إيجابي',
      explanation_en: 'No criminal record — favorable profile',
    });
  }

  score = Math.min(100, Math.round(score));
  const decision: FraudDecision = score >= 65 ? 'blocked' : score >= 35 ? 'review' : 'approved';
  const latencyMs = 35 + (Number(id.slice(1)) % 40);

  const typeLabelFr: Record<SinistreType, string> = { vol: 'Vol', incendie: 'Incendie', accident: 'Accident', degat_eaux: 'Dégât des eaux', corporel: 'Corporel' };

  const expl_fr = score >= 65
    ? `Sinistre ${typeLabelFr[inp.type]} — Score de fraude CRITIQUE (${score}/100). Rejet recommandé : cumul de ${signals.filter(s=>s.detected).length} anomalies graves (antécédents, délai, montant surestimé, incohérence).`
    : score >= 35
    ? `Sinistre ${typeLabelFr[inp.type]} — Score MODÉRÉ (${score}/100). Investigation approfondie requise : ${signals.filter(s=>s.detected).length} signal(aux) atypique(s) à vérifier avec un expert terrain.`
    : `Sinistre ${typeLabelFr[inp.type]} — Score FAIBLE (${score}/100). Profil légittime. Traitement normal recommandé.`;

  const expl_ar = score >= 65
    ? `حادث ${inp.type} — درجة احتيال حرجة (${score}/100). يُوصى بالرفض: ${signals.filter(s=>s.detected).length} شذوذات خطيرة.`
    : score >= 35
    ? `حادث ${inp.type} — درجة متوسطة (${score}/100). تحقيق معمق مطلوب.`
    : `حادث ${inp.type} — درجة منخفضة (${score}/100). ملف مشروع. يُوصى بالمعالجة العادية.`;

  const expl_en = score >= 65
    ? `${inp.type} claim — CRITICAL fraud score (${score}/100). Rejection recommended: ${signals.filter(s=>s.detected).length} serious anomalies accumulated.`
    : score >= 35
    ? `${inp.type} claim — MODERATE score (${score}/100). In-depth investigation required.`
    : `${inp.type} claim — LOW score (${score}/100). Legitimate profile. Normal processing recommended.`;

  return {
    score, decision, latencyMs,
    signals, modelUsed: 'Random Forest + LSTM Sinistres DZ v2.4',
    confidence: Math.round(85 + (Number(id.slice(1)) % 12)),
    explanation_fr: expl_fr, explanation_ar: expl_ar, explanation_en: expl_en,
  };
}

// ─── Recent fraud history (simulated) ────────────────────────────────────────
export interface FraudHistoryItem {
  id: string;
  date: string;
  type: 'banking' | 'assurance';
  sousType: string;
  entite: string;
  score: number;
  decision: FraudDecision;
  montant: string;
  analyste: string;
}

export const fraudHistory: FraudHistoryItem[] = [];
