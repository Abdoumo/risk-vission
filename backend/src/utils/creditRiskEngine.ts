/**
 * creditRiskEngine.ts — Moteur d'évaluation du Risque de Crédit, XAI & Explicabilité
 * Conforme à la spécification exacte de "Credit Risk & AI Explication.PDF"
 */

export interface CreditClientData {
  client_id: string;
  nom: string;
  prenom?: string;
  type_client?: string; // Particulier, Entreprise, Professionel, PME, Grande_Entreprise
  statut_client?: string; // Actif, Inactif, Nouveau, A_Risque, EWS HIGH RISK
  type_compte?: string; // Courant, Professionel, Entreprise, Devise, Epargne, Cheque
  type_credit?: string; // Credit_Consommation, Credit_Personnel, Credit_Automobile, etc.
  
  // Les 8 variables financières & comportementales principales (Pages 3-13 du PDF)
  revenu_mensuel_dzd?: number; // 1. Revenue
  solde_compte_dzd?: number;   // 2. Solde_Compte
  echeance_mensuelle_dzd?: number; // Utilisé pour 3. DTI
  impayes_dzd?: number;        // 4. Impayes (Montant)
  nombre_impayes?: number;     // 4. Impayes (Nombre)
  jours_retard?: number;       // 5. Retard_de_Paiement (Jours Max)
  cashflow_dzd?: number;       // 6. Cashflow (Entrées - Sorties)
  classe_creance?: string;     // 7. Historique_Bancaire (Favorable, Normal, Défavorable, Très_Défavorable)
  overdraft?: string;          // 8. Overdraft (Aucun, Faible, Modere, Frequent, Eleve)

  montant_credit_dzd?: number;
  duree_credit_mois?: number;
}

export interface CreditAnalysisResult {
  clientId: string;
  clientName: string;
  typeClient: string;
  statutClient: string;
  typeCompte: string;
  typeCredit: string;
  
  // Score 0-100 & Bandes de risque (Page 15 du PDF)
  score: number; // 0 - 100
  pd_percentage: string; // Ex: "14.5%"
  riskLevel: 'faible' | 'modere' | 'eleve' | 'critique';
  riskBandLabel: 'Faible (0-24)' | 'Modéré (25-49)' | 'Élevé (50-74)' | 'Critique (75-100)';
  
  // Les 8 Variables Clés nettoyées
  variables: {
    revenue: { value: number | null; display: string; label: string };
    soldeCompte: { value: number | null; display: string; label: string };
    dti: { value: number; display: string; label: string; band: 'DTI_LOW' | 'DTI_MEDIUM' | 'DTI_HIGH' | 'DTI_CRITICAL' };
    impayes: { value: number; display: string; count: number; label: string };
    retardPaiement: { value: number; display: string; label: string };
    cashflow: { value: number | null; display: string; label: string };
    historiqueBancaire: { value: string; display: string; label: string };
    overdraft: { value: string; display: string; label: string };
  };

  // Top 3 à 5 Facteurs (Pages 16-17 du PDF)
  factors: {
    aggravating: string[];
    mitigating: string[];
  };

  // Explication en Langage Naturel Structurée (Pages 18-22 du PDF)
  explanation: string;
  explanation_ar: string;
  explanation_en: string;

  // Policy Engine Séparé (Pages 22-24 du PDF)
  policyDecision: {
    action: string;
    action_ar: string;
    action_en: string;
    recommendation: string;
  };

  // Décomposition SHAP pour XAI
  shapFeatures: Array<{
    feature: string;
    feature_ar: string;
    shapValue: number;
    baselineValue: number;
    actualValue: string;
    category: 'financier' | 'comportemental';
    importance: number;
  }>;

  // Scénarios Contre-Factuels (Counterfactuals)
  counterfactuals: Array<{
    action_fr: string;
    action_ar: string;
    action_en: string;
    impact: number;
    feasibility: 'Facile' | 'Moyenne' | 'Exigeante';
  }>;

  // Projections 30 / 60 / 90 jours
  projections: {
    horizon30: { pd: number; cashflowExpected: number; liquidityRisk: string };
    horizon60: { pd: number; cashflowExpected: number; liquidityRisk: string };
    horizon90: { pd: number; cashflowExpected: number; liquidityRisk: string };
  };
}

export function evaluateCreditRiskAndXai(client: CreditClientData): CreditAnalysisResult {
  const nom = client.nom || 'Client';
  const prenom = client.prenom || '';
  const fullName = prenom ? `${prenom} ${nom}` : nom;

  // 1. Validation & Nettoyage des 8 variables (Pages 24-26 du PDF)
  const revenue = client.revenu_mensuel_dzd !== undefined && client.revenu_mensuel_dzd !== null
    ? Math.max(0, client.revenu_mensuel_dzd)
    : 85000;
  
  const solde = client.solde_compte_dzd !== undefined && client.solde_compte_dzd !== null
    ? client.solde_compte_dzd
    : 150000;

  const echeance = client.echeance_mensuelle_dzd !== undefined && client.echeance_mensuelle_dzd !== null
    ? Math.max(0, client.echeance_mensuelle_dzd)
    : Math.round(revenue * 0.3);

  // 3. DTI Formule : (Mensualités / Revenu) * 100
  const dti = revenue > 0 ? parseFloat(((echeance / revenue) * 100).toFixed(1)) : 0;
  let dtiBand: 'DTI_LOW' | 'DTI_MEDIUM' | 'DTI_HIGH' | 'DTI_CRITICAL' = 'DTI_LOW';
  if (dti >= 60) dtiBand = 'DTI_CRITICAL';
  else if (dti >= 45) dtiBand = 'DTI_HIGH';
  else if (dti >= 33) dtiBand = 'DTI_MEDIUM';

  // 4. Impayés
  const impayes = client.impayes_dzd !== undefined && client.impayes_dzd !== null ? Math.max(0, client.impayes_dzd) : 0;
  const nbImpayes = client.nombre_impayes !== undefined && client.nombre_impayes !== null
    ? client.nombre_impayes
    : (impayes > 50000 ? 3 : impayes > 0 ? 1 : 0);

  // 5. Retard de paiement
  const retardJours = client.jours_retard !== undefined && client.jours_retard !== null ? Math.max(0, client.jours_retard) : 0;

  // 6. Cashflow (Entrées - Sorties)
  const cashflow = client.cashflow_dzd !== undefined && client.cashflow_dzd !== null
    ? client.cashflow_dzd
    : Math.round(revenue * 0.25);

  // 7. Historique Bancaire
  const historique = client.classe_creance || (retardJours > 60 ? 'Défavorable' : retardJours > 15 ? 'Normal' : 'Favorable');

  // 8. Overdraft
  const overdraft = client.overdraft || (solde < 0 ? 'Frequent' : 'Aucun');

  // -------------------------------------------------------------
  // CALCUL DU SCORE DE RISQUE 0–100 & SHAP VALUES
  // -------------------------------------------------------------
  let baseScore = 20; // Score de base nominal
  const shapList: Array<{
    feature: string;
    feature_ar: string;
    shapValue: number;
    baselineValue: number;
    actualValue: string;
    category: 'financier' | 'comportemental';
    importance: number;
  }> = [];

  // DTI SHAP
  let dtiImpact = 0;
  if (dti >= 60) dtiImpact = +28;
  else if (dti >= 45) dtiImpact = +16;
  else if (dti >= 35) dtiImpact = +6;
  else dtiImpact = -8;
  baseScore += dtiImpact;
  shapList.push({
    feature: 'DTI (Ratio Endettement)',
    feature_ar: 'نسبة الدين إلى الدخل',
    shapValue: parseFloat((dtiImpact / 100).toFixed(3)),
    baselineValue: 33,
    actualValue: `${dti}%`,
    category: 'financier',
    importance: 95
  });

  // Impayés SHAP
  let impayesImpact = 0;
  if (nbImpayes >= 3 || impayes > 100000) impayesImpact = +26;
  else if (nbImpayes >= 1 || impayes > 0) impayesImpact = +14;
  else impayesImpact = -7;
  baseScore += impayesImpact;
  shapList.push({
    feature: 'Impayés récents',
    feature_ar: 'المبالغ غير المسددة',
    shapValue: parseFloat((impayesImpact / 100).toFixed(3)),
    baselineValue: 0,
    actualValue: impayes > 0 ? `${impayes.toLocaleString('fr-FR')} DZD (${nbImpayes})` : '0 DZD',
    category: 'financier',
    importance: 90
  });

  // Retard Paiement SHAP
  let retardImpact = 0;
  if (retardJours >= 60) retardImpact = +24;
  else if (retardJours >= 30) retardImpact = +15;
  else if (retardJours > 0) retardImpact = +8;
  else retardImpact = -6;
  baseScore += retardImpact;
  shapList.push({
    feature: 'Retard de paiement',
    feature_ar: 'أيام تأخير الدفع',
    shapValue: parseFloat((retardImpact / 100).toFixed(3)),
    baselineValue: 0,
    actualValue: `${retardJours} jours`,
    category: 'comportemental',
    importance: 88
  });

  // Cashflow SHAP
  let cashflowImpact = 0;
  if (cashflow < -20000) cashflowImpact = +18;
  else if (cashflow < 0) cashflowImpact = +10;
  else if (cashflow >= 40000) cashflowImpact = -9;
  else cashflowImpact = -3;
  baseScore += cashflowImpact;
  shapList.push({
    feature: 'Flux de Cashflow net',
    feature_ar: 'التدفق النقدي الصافي',
    shapValue: parseFloat((cashflowImpact / 100).toFixed(3)),
    baselineValue: 25000,
    actualValue: `${cashflow.toLocaleString('fr-FR')} DZD/mois`,
    category: 'financier',
    importance: 82
  });

  // Overdraft SHAP
  let overdraftImpact = 0;
  if (overdraft.toLowerCase().includes('eleve') || overdraft.toLowerCase().includes('frequent')) overdraftImpact = +16;
  else if (overdraft.toLowerCase().includes('modere') || overdraft.toLowerCase().includes('faible')) overdraftImpact = +5;
  else overdraftImpact = -5;
  baseScore += overdraftImpact;
  shapList.push({
    feature: 'Recours au Découvert',
    feature_ar: 'استخدام السحب على المكشوف',
    shapValue: parseFloat((overdraftImpact / 100).toFixed(3)),
    baselineValue: 0,
    actualValue: overdraft,
    category: 'financier',
    importance: 75
  });

  // Historique Bancaire SHAP
  let histImpact = 0;
  if (historique.toLowerCase().includes('très') || historique.toLowerCase().includes('tres')) histImpact = +22;
  else if (historique.toLowerCase().includes('défavorable') || historique.toLowerCase().includes('defavorable')) histImpact = +14;
  else if (historique.toLowerCase().includes('favorable')) histImpact = -8;
  else histImpact = 0;
  baseScore += histImpact;
  shapList.push({
    feature: 'Historique Bancaire',
    feature_ar: 'التاريخ المصرفي',
    shapValue: parseFloat((histImpact / 100).toFixed(3)),
    baselineValue: 50,
    actualValue: historique,
    category: 'comportemental',
    importance: 80
  });

  // Solde Compte SHAP
  let soldeImpact = 0;
  if (solde < 0) soldeImpact = +20;
  else if (solde < 20000) soldeImpact = +8;
  else if (solde >= revenue * 2.5) soldeImpact = -9;
  else soldeImpact = -4;
  baseScore += soldeImpact;
  shapList.push({
    feature: 'Solde du Compte',
    feature_ar: 'رصيد الحساب',
    shapValue: parseFloat((soldeImpact / 100).toFixed(3)),
    baselineValue: 80000,
    actualValue: `${solde.toLocaleString('fr-FR')} DZD`,
    category: 'financier',
    importance: 78
  });

  // Revenu SHAP
  let revImpact = 0;
  if (revenue < 40000) revImpact = +10;
  else if (revenue >= 180000) revImpact = -10;
  else revImpact = -4;
  baseScore += revImpact;
  shapList.push({
    feature: 'Stabilité du Revenu',
    feature_ar: 'استقرار الدخل',
    shapValue: parseFloat((revImpact / 100).toFixed(3)),
    baselineValue: 90000,
    actualValue: `${revenue.toLocaleString('fr-FR')} DZD/mois`,
    category: 'financier',
    importance: 70
  });

  // Score clamping & Bandes (Page 15 du PDF)
  const finalScore = Math.min(98, Math.max(5, Math.round(baseScore)));
  let riskLevel: 'faible' | 'modere' | 'eleve' | 'critique' = 'faible';
  let riskBandLabel: 'Faible (0-24)' | 'Modéré (25-49)' | 'Élevé (50-74)' | 'Critique (75-100)' = 'Faible (0-24)';

  if (finalScore >= 75) {
    riskLevel = 'critique';
    riskBandLabel = 'Critique (75-100)';
  } else if (finalScore >= 50) {
    riskLevel = 'eleve';
    riskBandLabel = 'Élevé (50-74)';
  } else if (finalScore >= 25) {
    riskLevel = 'modere';
    riskBandLabel = 'Modéré (25-49)';
  } else {
    riskLevel = 'faible';
    riskBandLabel = 'Faible (0-24)';
  }

  // -------------------------------------------------------------
  // TOP 3 À 5 FACTEURS AGGRAVANTS & ATTÉNUANTS (Pages 16-17 du PDF)
  // -------------------------------------------------------------
  const aggravatingFactors: string[] = [];
  const mitigatingFactors: string[] = [];

  if (dti >= 45) aggravatingFactors.push(`DTI élevé (${dti}%)`);
  else if (dti < 35) mitigatingFactors.push(`DTI faible et maîtrisé (${dti}%)`);

  if (nbImpayes > 0 || impayes > 0) aggravatingFactors.push(`Présence d'impayés (${impayes.toLocaleString('fr-FR')} DZD, ${nbImpayes} incident${nbImpayes > 1 ? 's' : ''})`);
  else mitigatingFactors.push('Absence totale d\'impayés récents');

  if (retardJours > 0) aggravatingFactors.push(`Retards de paiement enregistrés (${retardJours} jours)`);
  else mitigatingFactors.push('Aucun retard de remboursement constaté');

  if (cashflow < 0) aggravatingFactors.push(`Cashflow négatif (${cashflow.toLocaleString('fr-FR')} DZD/mois)`);
  else if (cashflow >= 20000) mitigatingFactors.push(`Cashflow net positif et régulier (+${cashflow.toLocaleString('fr-FR')} DZD/mois)`);

  if (overdraft.toLowerCase().includes('eleve') || overdraft.toLowerCase().includes('frequent') || solde < 0) {
    aggravatingFactors.push('Recours fréquent ou élevé au découvert bancaire');
  }

  if (solde >= revenue) mitigatingFactors.push(`Solde de compte créditeur solide (${solde.toLocaleString('fr-FR')} DZD)`);
  else if (solde < 0) aggravatingFactors.push(`Solde de compte débiteur (${solde.toLocaleString('fr-FR')} DZD)`);

  if (revenue >= 80000) mitigatingFactors.push(`Revenu régulier et suffisant (${revenue.toLocaleString('fr-FR')} DZD/mois)`);
  if (historique.toLowerCase().includes('favorable')) mitigatingFactors.push('Historique bancaire favorable et régulier');
  else if (historique.toLowerCase().includes('défavorable')) aggravatingFactors.push(`Historique bancaire classé ${historique}`);

  const topAggravating = aggravatingFactors.slice(0, 5);
  const topMitigating = mitigatingFactors.slice(0, 5);

  // -------------------------------------------------------------
  // POLICY ENGINE (Pages 22-24 du PDF)
  // -------------------------------------------------------------
  let policyDecision = {
    action: 'Décision standard favorable',
    action_ar: 'قرار قياسي إيجابي — موافقة عادية',
    action_en: 'Standard approval decision',
    recommendation: 'Accord de crédit standard sans exigence de garantie supplémentaire.'
  };

  if (riskLevel === 'critique') {
    policyDecision = {
      action: 'Revue manuelle obligatoire — Risque critique',
      action_ar: 'مراجعة يدوية إلزامية — مخاطر حرجة مكتشفة',
      action_en: 'Mandatory manual review — Critical risk',
      recommendation: 'Revue manuelle obligatoire par le Comité des Risques et blocage immédiat de tout nouvel engagement non garanti.'
    };
  } else if (riskLevel === 'eleve') {
    policyDecision = {
      action: 'Revue renforcée requise — Risque élevé',
      action_ar: 'مراجعة معززة مطلوبة — مخاطر مرتفعة',
      action_en: 'Enhanced review required — High risk',
      recommendation: 'Analyse approfondie du dossier requise avant toute décision et exigence de garanties réelles ou caution solidaire.'
    };
  } else if (riskLevel === 'modere') {
    policyDecision = {
      action: 'Analyse standard — Surveillance active',
      action_ar: 'تحليل قياسي — مراقبة نشطة مطلوبة',
      action_en: 'Standard analysis — Active monitoring',
      recommendation: 'Surveillance standard et analyse complémentaire du dossier avec suivi régulier des flux de trésorerie.'
    };
  }

  // -------------------------------------------------------------
  // EXPLICATION IA EN LANGAGE NATUREL (Pages 18-22 du PDF)
  // EXACT TEXT GENERATED "Kima goultili ektebli a bro"
  // -------------------------------------------------------------
  let explanation = '';
  let explanation_ar = '';
  let explanation_en = '';

  const aggText = topAggravating.length > 0 ? topAggravating.join(', ') : 'aucun facteur aggravant majeur';
  const mitText = topMitigating.length > 0 ? topMitigating.join(', ') : 'aucun facteur atténuant significatif identifié';

  if (riskLevel === 'critique') {
    explanation = `L'analyse du profil client a produit un score de risque de ${finalScore}/100, correspondant à un niveau de risque critique. Les principaux facteurs ayant contribué à l'augmentation du risque sont ${aggText}. ${topMitigating.length > 0 ? `Parmi les éléments favorables, on note ${mitText}, qui constitue un facteur atténuant partiel.` : 'Aucun facteur atténuant significatif n\'a été identifié.'} Dans l'ensemble, les facteurs défavorables sont actuellement plus importants que les facteurs favorables. Recommandation : revue manuelle obligatoire du dossier avant toute décision de crédit.`;
    explanation_ar = `أنتج تحليل ملف العميل درجة مخاطر بلغت ${finalScore}/100، مما يتوافق مع مستوى مخاطر حرج. العوامل الرئيسية التي ساهمت في زيادة المخاطر هي: ${aggText}. ${topMitigating.length > 0 ? `من بين العناصر الإيجابية، نلاحظ: ${mitText}.` : 'لم يتم تحديد أي عامل مخفف مهم.'} التوصية: مراجعة يدوية إلزامية للملف قبل اتخاذ أي قرار ائتماني.`;
    explanation_en = `Client profile analysis yielded a risk score of ${finalScore}/100, corresponding to a critical risk level. Key drivers increasing risk are ${aggText}. ${topMitigating.length > 0 ? `Among favorable aspects, note ${mitText}.` : 'No significant mitigating factor was identified.'} Overall, unfavorable factors outweigh favorable ones. Recommendation: mandatory manual dossier review before any credit decision.`;
  } else if (riskLevel === 'eleve') {
    explanation = `L'analyse du profil client a produit un score de risque de ${finalScore}/100, correspondant à un niveau de risque élevé. Les principaux facteurs de risque identifiés sont ${aggText}. ${topMitigating.length > 0 ? `Le client dispose toutefois d'éléments atténuants tels que ${mitText}.` : ''} Le dossier nécessite une analyse approfondie avant toute décision.`;
    explanation_ar = `أنتج تحليل ملف العميل درجة مخاطر بلغت ${finalScore}/100، مما يتوافق مع مستوى مخاطر مرتفع. عوامل المخاطر الرئيسية المحددة هي: ${aggText}. يتطلب الملف تحليلاً معمقاً قبل اتخاذ أي قرار.`;
    explanation_en = `Client profile analysis yielded a risk score of ${finalScore}/100, corresponding to a high risk level. Key identified risk factors are ${aggText}. The file requires thorough assessment before any decision.`;
  } else if (riskLevel === 'modere') {
    explanation = `L'analyse du profil client a produit un score de risque de ${finalScore}/100, correspondant à un niveau de risque modéré. Le profil présente une situation financière globalement acceptable, mais certains éléments nécessitent une attention particulière, notamment ${aggText}. ${topMitigating.length > 0 ? `Les facteurs atténuants identifiés incluent ${mitText}.` : ''} Recommandation : surveillance standard et analyse complémentaire du dossier.`;
    explanation_ar = `أنتج تحليل ملف العميل درجة مخاطر بلغت ${finalScore}/100، مما يتوافق مع مستوى مخاطر معتدل. يقدم الملف وضعاً مالياً مقبولاً بشكل عام، مع عناصر تتطلب متابعة مثل: ${aggText}. التوصية: مراقبة قياسية وتحليل تكميلي للملف.`;
    explanation_en = `Client profile analysis yielded a risk score of ${finalScore}/100, corresponding to a moderate risk level. The profile shows a generally acceptable financial situation, with points requiring monitoring such as ${aggText}. Recommendation: standard monitoring and dossier follow-up.`;
  } else {
    explanation = `L'analyse du profil client a produit un score de risque de ${finalScore}/100, correspondant à un niveau de risque faible. Le profil présente plusieurs éléments favorables, notamment ${mitText}. Aucun facteur de risque majeur n'a été identifié. Recommandation : accord standard favorable.`;
    explanation_ar = `أنتج تحليل ملف العميل درجة مخاطر بلغت ${finalScore}/100، مما يتوافق مع مستوى مخاطر منخفض. يظهر الملف عدة عناصر إيجابية منها: ${mitText}. لم يتم رصد أي عامل خطر رئيسي. التوصية: موافقة قياسية إيجابية.`;
    explanation_en = `Client profile analysis yielded a risk score of ${finalScore}/100, corresponding to a low risk level. The profile presents several favorable elements including ${mitText}. No major risk factor was identified. Recommendation: standard favorable approval.`;
  }

  // -------------------------------------------------------------
  // CONTRE-FACTUELS (Counterfactuals)
  // -------------------------------------------------------------
  const counterfactuals: Array<{
    action_fr: string;
    action_ar: string;
    action_en: string;
    impact: number;
    feasibility: 'Facile' | 'Moyenne' | 'Exigeante';
  }> = [];

  if (dti >= 40) {
    counterfactuals.push({
      action_fr: `Restructurer les échéances pour ramener le DTI à moins de 33%`,
      action_ar: 'إعادة جدولة الأقساط لخفض نسبة الدين إلى أقل من 33%',
      action_en: 'Restructure maturities to bring DTI below 33%',
      impact: -18,
      feasibility: 'Moyenne'
    });
  }

  if (nbImpayes > 0 || impayes > 0) {
    counterfactuals.push({
      action_fr: `Régulariser l'intégralité des impayés (${impayes.toLocaleString('fr-FR')} DZD)`,
      action_ar: `تسوية كامل المبالغ غير المسددة (${impayes.toLocaleString('fr-FR')} دج)`,
      action_en: `Clear outstanding unpaid dues (${impayes.toLocaleString('fr-FR')} DZD)`,
      impact: -22,
      feasibility: 'Exigeante'
    });
  }

  if (solde < revenue) {
    counterfactuals.push({
      action_fr: `Constituer un matelas de sécurité de solde supérieur à ${(revenue * 1.5).toLocaleString('fr-FR')} DZD`,
      action_ar: 'تكوين رصيد احتياطي أمان يتجاوز 1.5 ضعف الدخل الشهري',
      action_en: 'Maintain emergency buffer balance above 1.5x monthly income',
      impact: -10,
      feasibility: 'Facile'
    });
  }

  if (overdraft.toLowerCase().includes('frequent') || overdraft.toLowerCase().includes('eleve')) {
    counterfactuals.push({
      action_fr: `Supprimer le recours au découvert bancaire pendant 90 jours consécutifs`,
      action_ar: 'وقف استخدام السحب على المكشوف لمدة 90 يوماً متتالية',
      action_en: 'Eliminate overdraft utilization for 90 consecutive days',
      impact: -14,
      feasibility: 'Moyenne'
    });
  }

  // -------------------------------------------------------------
  // PROJECTIONS 30 / 60 / 90 JOURS
  // -------------------------------------------------------------
  const pdBase = finalScore;
  const projections = {
    horizon30: {
      pd: Math.min(99, Math.max(2, Math.round(pdBase * 0.98))),
      cashflowExpected: Math.round(cashflow * 1.0),
      liquidityRisk: pdBase >= 70 ? 'STRESS_LIQUIDITE' : 'NORMAL'
    },
    horizon60: {
      pd: Math.min(99, Math.max(2, Math.round(pdBase * (nbImpayes > 0 ? 1.15 : 0.95)))),
      cashflowExpected: Math.round(cashflow * 1.95),
      liquidityRisk: pdBase >= 60 ? 'TENSION_TRESORERIE' : 'STABLE'
    },
    horizon90: {
      pd: Math.min(99, Math.max(2, Math.round(pdBase * (nbImpayes > 0 ? 1.32 : 0.92)))),
      cashflowExpected: Math.round(cashflow * 2.85),
      liquidityRisk: pdBase >= 50 ? 'SURVEILLANCE_EWS' : 'CONFORME'
    }
  };

  return {
    clientId: client.client_id,
    clientName: fullName,
    typeClient: client.type_client || 'Particulier',
    statutClient: client.statut_client || 'Actif',
    typeCompte: client.type_compte || 'Courant Commercial',
    typeCredit: client.type_credit || 'Credit_Consommation',
    
    score: finalScore,
    pd_percentage: `${finalScore}%`,
    riskLevel,
    riskBandLabel,

    variables: {
      revenue: { value: revenue, display: `${revenue.toLocaleString('fr-FR')} DZD/mois`, label: '1. Revenu Mensuel' },
      soldeCompte: { value: solde, display: `${solde.toLocaleString('fr-FR')} DZD`, label: '2. Solde du Compte' },
      dti: { value: dti, display: `${dti}%`, label: '3. Ratio DTI (Dette/Revenu)', band: dtiBand },
      impayes: { value: impayes, display: `${impayes.toLocaleString('fr-FR')} DZD (${nbImpayes})`, count: nbImpayes, label: '4. Impayés' },
      retardPaiement: { value: retardJours, display: `${retardJours} jours`, label: '5. Retard de Paiement' },
      cashflow: { value: cashflow, display: `${cashflow >= 0 ? '+' : ''}${cashflow.toLocaleString('fr-FR')} DZD/mois`, label: '6. Cashflow Net' },
      historiqueBancaire: { value: historique, display: historique, label: '7. Historique Bancaire' },
      overdraft: { value: overdraft, display: overdraft, label: '8. Découvert (Overdraft)' }
    },

    factors: {
      aggravating: topAggravating,
      mitigating: topMitigating
    },

    explanation,
    explanation_ar,
    explanation_en,

    policyDecision,
    shapFeatures: shapList,
    counterfactuals,
    projections
  };
}
