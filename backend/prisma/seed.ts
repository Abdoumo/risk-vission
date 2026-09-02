import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // --- Prediction Models ---
  const models = [
    { value: 'lstm',        label: 'LSTM Cours Boursiers',         accuracy: 93.4, color: 'text-green-400' },
    { value: 'xgboost',     label: 'XGBoost Détection Fraude',     accuracy: 96.8, color: 'text-emerald-400' },
    { value: 'prophet',     label: 'Prophet Saisonnalité DZ',      accuracy: 84.3, color: 'text-teal-400' },
    { value: 'transformer', label: 'Transformer NLP Nouvelles',    accuracy: 91.5, color: 'text-cyan-400' },
  ];

  for (const model of models) {
    await prisma.predictionModel.upsert({
      where: { value: model.value },
      update: {},
      create: model,
    });
  }

  // --- Model Performance ---
  await prisma.modelPerformance.deleteMany();

  const modeles_perf = [
    { nom: 'LSTM Cours Boursiers', precision: 93, rappel: 90, f1Score: 91, mae: 12, rmse: 18, status: 'actif', dernierEntrainement: new Date().toLocaleDateString('fr-DZ') },
    { nom: 'XGBoost Détection Fraude', precision: 96, rappel: 95, f1Score: 95, mae: 4, rmse: 7, status: 'actif', dernierEntrainement: new Date().toLocaleDateString('fr-DZ') },
    { nom: 'Prophet Saisonnalité DZ', precision: 84, rappel: 80, f1Score: 82, mae: 22, rmse: 28, status: 'inactif', dernierEntrainement: new Date().toLocaleDateString('fr-DZ') },
  ];

  for (const mp of modeles_perf) {
    await prisma.modelPerformance.create({
      data: mp,
    });
  }

  // --- Prediction Targets ---
  const targets = [
    { value: 'DZAIR30',   label: 'Indice DZAIR30' },
    { value: 'ALLIANCE',  label: 'Alliance Assurances' },
    { value: 'BIOPHARM',  label: 'Biopharm' },
    { value: 'SAIDAL',    label: 'Groupe Saïdal' },
    { value: 'EGH',       label: 'El Aurassi Hotels' },
    { value: 'NCA',       label: 'NCA Rouiba' },
  ];

  for (const target of targets) {
    await prisma.predictionTarget.upsert({
      where: { value: target.value },
      update: {},
      create: target,
    });
  }

  // --- Xai Decisions & Related Data ---
  // Clean up existing XAI decisions first to avoid duplicates or relation issues if running multiple times
  await prisma.xaiDecision.deleteMany();

  const shapCredit = [
    { feature: 'Ratio d\'endettement',       feature_ar: 'نسبة المديونية',        feature_en: 'Debt-to-Equity Ratio',    shapValue: +0.342, baselineValue: 0.45, actualValue: '0.78',   contribution: 'positive', importance: 94, category: 'financier' },
    { feature: 'Historique de paiement',     feature_ar: 'سجل السداد',            feature_en: 'Payment History',         shapValue: +0.218, baselineValue: 0.80, actualValue: '0.62',   contribution: 'positive', importance: 81, category: 'comportemental' },
    { feature: 'Flux de trésorerie (12m)',   feature_ar: 'التدفق النقدي 12م',     feature_en: 'Cash Flow (12m)',         shapValue: -0.187, baselineValue: 50000, actualValue: '72,400 DZD', contribution: 'negative', importance: 76, category: 'financier' },
    { feature: 'Secteur pharmaceutique DZ',  feature_ar: 'قطاع الأدوية الجزائري', feature_en: 'DZ Pharma Sector',        shapValue: +0.156, baselineValue: 0.0,  actualValue: 'Oui',    contribution: 'positive', importance: 68, category: 'marché' },
    { feature: 'Cours BIOPHARM / SAIDAL',    feature_ar: 'أسهم BIOPHARM/SAIDAL', feature_en: 'BIOPHARM/SAIDAL Price',  shapValue: +0.134, baselineValue: 0.0,  actualValue: '+4.2%',  contribution: 'positive', importance: 62, category: 'marché' },
    { feature: 'PIB Algérie (croissance)',   feature_ar: 'نمو الناتج المحلي',      feature_en: 'Algeria GDP Growth',     shapValue: -0.098, baselineValue: 3.2,  actualValue: '4.1%',   contribution: 'negative', importance: 51, category: 'macro' },
    { feature: 'Ancienneté client (années)', feature_ar: 'أقدمية العميل',         feature_en: 'Client Seniority (yrs)', shapValue: -0.087, baselineValue: 5.0,  actualValue: '8 ans',  contribution: 'negative', importance: 44, category: 'client' },
    { feature: 'Garanties proposées',        feature_ar: 'الضمانات المقدمة',       feature_en: 'Proposed Collateral',    shapValue: -0.076, baselineValue: 0.0,  actualValue: 'Imm. + Nant.', contribution: 'negative', importance: 38, category: 'financier' },
    { feature: 'Taux directeur Banque d\'Alg', feature_ar: 'سعر الفائدة البنك المركزي', feature_en: 'BA Policy Rate',  shapValue: +0.054, baselineValue: 3.0,  actualValue: '3.5%',   contribution: 'positive', importance: 29, category: 'macro' },
    { feature: 'Nombre d\'incidents 24m',    feature_ar: 'الحوادث خلال 24 شهراً', feature_en: 'Incidents (24m)',        shapValue: +0.038, baselineValue: 0,    actualValue: '1',      contribution: 'positive', importance: 22, category: 'comportemental' },
  ];

  const shapFraude = [
    { feature: 'Montant transaction',        feature_ar: 'مبلغ المعاملة',         feature_en: 'Transaction Amount',     shapValue: +0.512, baselineValue: 500, actualValue: '24,000 DZD', contribution: 'positive', importance: 97, category: 'financier' },
    { feature: 'Heure inhabituelle',         feature_ar: 'وقت غير اعتيادي',       feature_en: 'Unusual Hour',           shapValue: +0.389, baselineValue: 0.1,  actualValue: '02:47',  contribution: 'positive', importance: 89, category: 'comportemental' },
    { feature: 'Pays destinataire',          feature_ar: 'دولة المستفيد',          feature_en: 'Destination Country',    shapValue: +0.298, baselineValue: 0.0,  actualValue: 'Offshore', contribution: 'positive', importance: 82, category: 'comportemental' },
    { feature: 'Fréquence transactions 7j',  feature_ar: 'تكرار المعاملات 7 أيام', feature_en: 'Txn Frequency (7d)',    shapValue: +0.241, baselineValue: 3.0,  actualValue: '28',     contribution: 'positive', importance: 74, category: 'comportemental' },
    { feature: 'Profil historique client',   feature_ar: 'ملف العميل التاريخي',    feature_en: 'Historical Client Profile', shapValue: -0.178, baselineValue: 0.9, actualValue: '0.9/1',  contribution: 'negative', importance: 65, category: 'client' },
    { feature: 'Device fingerprint',         feature_ar: 'بصمة الجهاز',           feature_en: 'Device Fingerprint',     shapValue: +0.143, baselineValue: 1.0,  actualValue: 'Inconnu', contribution: 'positive', importance: 58, category: 'comportemental' },
  ];

  const xaiDecisions = [
    {
      id: 'xai-001',
      type: 'credit',
      label_fr: 'Demande de Crédit',
      label_ar: 'طلب قرض',
      label_en: 'Credit Request',
      entity: 'Groupe Saïdal — Filiale Constantine',
      decision_fr: 'Risque Moyen — Approbation conditionnelle',
      decision_ar: 'مخاطرة متوسطة — موافقة مشروطة',
      decision_en: 'Medium Risk — Conditional Approval',
      score: 62.4,
      confidence: 91.2,
      riskLevel: 'moyen',
      timestamp: '2025-06-14 14:28:00',
      model: 'XGBoost Risque Crédit v2.1',
      naturalExplanation_fr: 'Le modèle attribue un score de risque de **62.4/100** à ce dossier. La décision est principalement influencée par un **ratio d\'endettement élevé (0.78 vs 0.45 en moyenne)** et un **historique de paiement dégradé (0.62)**. Ces facteurs augmentent significativement le risque. En revanche, des **flux de trésorerie solides (72,400 DZD/m)** et une **ancienneté client de 8 ans** réduisent l\'exposition. Le secteur pharmaceutique algérien et les hausses récentes de SAIDAL (+4.2%) constituent des signaux positifs pour le secteur. **Recommandation : Approbation sous réserve de garanties supplémentaires et d\'un plan de désendettement sur 36 mois.**',
      naturalExplanation_ar: 'يمنح النموذج درجة مخاطرة **62.4/100** لهذا الملف. القرار متأثر بشكل رئيسي بـ**نسبة مديونية عالية (0.78)** و**سجل سداد ضعيف (0.62)**. في المقابل، **التدفق النقدي الجيد** وأقدمية العميل تقلل من المخاطر.',
      naturalExplanation_en: 'The model assigns a risk score of **62.4/100** to this file. The decision is mainly driven by a **high debt ratio (0.78 vs 0.45 avg)** and a **degraded payment history (0.62)**. However, **strong cash flows (72,400 DZD/m)** and **8-year client seniority** reduce exposure. **Recommendation: Conditional approval with additional collateral and 36-month debt reduction plan.**',
      shapFeatures: { create: shapCredit },
      counterFactuals: {
        create: [
          { action_fr: 'Réduire le ratio d\'endettement sous 0.55', action_ar: 'تخفيض نسبة المديونية إلى ما دون 0.55', action_en: 'Reduce debt ratio below 0.55', impact: -18, feasibility: 'moyen' },
          { action_fr: 'Régulariser les 3 incidents de paiement', action_ar: 'تسوية حوادث السداد الثلاثة', action_en: 'Settle the 3 payment incidents', impact: -12, feasibility: 'facile' },
          { action_fr: 'Apporter une garantie hypothécaire supplémentaire', action_ar: 'تقديم ضمان رهن إضافي', action_en: 'Provide additional mortgage guarantee', impact: -9, feasibility: 'moyen' },
        ]
      }
    },
    {
      id: 'xai-002',
      type: 'fraude',
      label_fr: 'Alerte Fraude',
      label_ar: 'تنبيه احتيال',
      label_en: 'Fraud Alert',
      entity: 'Compte #DZ-BNA-448921 — Alger',
      decision_fr: 'Risque Critique — Blocage automatique',
      decision_ar: 'مخاطرة حرجة — حظر تلقائي',
      decision_en: 'Critical Risk — Automatic Block',
      score: 94.7,
      confidence: 97.3,
      riskLevel: 'critique',
      timestamp: '2025-06-14 14:12:00',
      model: 'Autoencodeur + XGBoost Fraude v3.0',
      naturalExplanation_fr: 'Le modèle détecte une **anomalie à très haute confiance (97.3%)** sur cette transaction de **24,000 DZD**. Les facteurs déclencheurs principaux sont : (1) **montant 48× supérieur** à la moyenne du compte, (2) exécution à **02h47** hors plage habituelle, (3) **destination offshore** non enregistrée, (4) **28 transactions** en 7 jours contre 3 habituellement. Le compte client a par ailleurs un bon historique (0.9/1) mais le device utilisé est inconnu. **Décision : Blocage immédiat de la transaction et notification au Risk Manager.**',
      naturalExplanation_ar: 'يكتشف النموذج **شذوذاً بثقة عالية جداً (97.3%)** على معاملة بقيمة **24,000 DZD**. العوامل الرئيسية: المبلغ 48 ضعف متوسط الحساب، التنفيذ في 02:47 خارج المعتاد، وجهة خارج البلاد.',
      naturalExplanation_en: 'The model detects a **high-confidence anomaly (97.3%)** on a **24,000 DZD** transaction. Main triggers: (1) amount **48× above account average**, (2) execution at **02:47 AM**, (3) **offshore destination**, (4) **28 transactions** in 7 days vs 3 normally. **Decision: Immediate block + Risk Manager notification.**',
      shapFeatures: { create: shapFraude },
    }
  ];

  for (const dec of xaiDecisions) {
    await prisma.xaiDecision.create({
      data: dec
    });
  }

  // Since GlobalFeatureImportance, ModelFairness, DecisionHistoryItem are already seeded
  // in their current endpoints but the user might be expecting a completely fresh DB, 
  // I will just let existing seeding be, or insert them if empty.
  
  // Wait, let's insert them just in case they aren't there yet
  const countGFI = await prisma.globalFeatureImportance.count();
  if (countGFI === 0) {
    const gfiData = [
      { feature: 'Ratio d\'endettement',     feature_ar: 'نسبة المديونية',       importance: 94, trend: 'up',    category: 'Financier' },
      { feature: 'Montant transaction',      feature_ar: 'مبلغ المعاملة',        importance: 91, trend: 'stable',category: 'Fraude' },
      { feature: 'Historique paiement',      feature_ar: 'سجل السداد',           importance: 87, trend: 'down',  category: 'Crédit' },
      { feature: 'Heure transaction',        feature_ar: 'وقت المعاملة',         importance: 82, trend: 'up',    category: 'Fraude' },
      { feature: 'Cours boursiers SGBV',     feature_ar: 'أسهم البورصة',         importance: 78, trend: 'up',    category: 'Marché' },
      { feature: 'Flux de trésorerie',       feature_ar: 'التدفق النقدي',        importance: 74, trend: 'stable',category: 'Financier' },
      { feature: 'Pays destinataire',        feature_ar: 'دولة المستفيد',         importance: 71, trend: 'stable',category: 'Fraude' },
      { feature: 'Taux directeur BA',        feature_ar: 'سعر الفائدة المركزي',  importance: 65, trend: 'up',    category: 'Macro' },
      { feature: 'Secteur d\'activité',      feature_ar: 'قطاع النشاط',          importance: 61, trend: 'stable',category: 'Crédit' },
      { feature: 'Ancienneté client',        feature_ar: 'أقدمية العميل',        importance: 58, trend: 'down',  category: 'Client' },
      { feature: 'PIB Algérie',             feature_ar: 'الناتج المحلي',         importance: 54, trend: 'up',    category: 'Macro' },
      { feature: 'Device fingerprint',       feature_ar: 'بصمة الجهاز',          importance: 49, trend: 'stable',category: 'Fraude' },
    ];
    for(const gfi of gfiData) {
      await prisma.globalFeatureImportance.create({data: gfi});
    }
  }

  const countMF = await prisma.modelFairness.count();
  if (countMF === 0) {
    const mfData = [
      { group: 'PME — Nord',          group_ar: 'مؤسسات صغيرة — الشمال',   accuracy: 93.4, falsePositiveRate: 3.2, falseNegativeRate: 4.1, count: 4230 },
      { group: 'PME — Sud',           group_ar: 'مؤسسات صغيرة — الجنوب',   accuracy: 91.2, falsePositiveRate: 4.8, falseNegativeRate: 5.2, count: 1840 },
      { group: 'Grandes Entreprises', group_ar: 'الشركات الكبرى',            accuracy: 95.8, falsePositiveRate: 2.1, falseNegativeRate: 2.8, count: 892 },
      { group: 'Particuliers',        group_ar: 'الأفراد',                    accuracy: 89.7, falsePositiveRate: 6.3, falseNegativeRate: 7.1, count: 12450 },
      { group: 'Finance islamique',   group_ar: 'التمويل الإسلامي',           accuracy: 87.4, falsePositiveRate: 7.8, falseNegativeRate: 8.2, count: 2180 },
      { group: 'Commerce extérieur',  group_ar: 'التجارة الخارجية',           accuracy: 92.1, falsePositiveRate: 3.9, falseNegativeRate: 4.4, count: 3120 },
    ];
    for(const mf of mfData) {
      await prisma.modelFairness.create({data: mf});
    }
  }

  const countDH = await prisma.decisionHistoryItem.count();
  if (countDH === 0) {
    const dhData = [
      { id: 'DEC-2847', date: '14/06 14:28', entity: 'Groupe Saïdal',           type: 'Crédit',   score: 62.4, decision: 'Approbation cond.',    riskLevel: 'moyen',    model: 'XGBoost Crédit',    validated: false, analyst: 'A. Benali' },
      { id: 'DEC-2846', date: '14/06 14:12', entity: 'Compte BNA-448921',       type: 'Fraude',   score: 94.7, decision: 'Blocage auto',         riskLevel: 'critique', model: 'Autoencodeur Fraude',validated: true,  analyst: 'S. Hamidi' },
      { id: 'DEC-2845', date: '14/06 13:45', entity: 'Alliance Assurances',     type: 'Marché',   score: 34.1, decision: 'Risque faible',        riskLevel: 'faible',   model: 'LSTM SGBV',         validated: true,  analyst: 'K. Bouzidi' },
      { id: 'DEC-2844', date: '14/06 13:21', entity: 'EURL Batimatech',         type: 'Crédit',   score: 78.9, decision: 'Refus',                riskLevel: 'élevé',    model: 'XGBoost Crédit',    validated: true,  analyst: 'A. Benali' },
      { id: 'DEC-2843', date: '14/06 12:58', entity: 'NCA Rouiba Export',       type: 'Liquidité',score: 28.4, decision: 'Risque acceptable',    riskLevel: 'faible',   model: 'Random Forest',     validated: true,  analyst: 'M. Tabet' },
      { id: 'DEC-2842', date: '14/06 12:34', entity: 'Compte BEA-221034',       type: 'Fraude',   score: 71.2, decision: 'Investigation',        riskLevel: 'élevé',    model: 'Autoencodeur Fraude',validated: false, analyst: 'S. Hamidi' },
      { id: 'DEC-2841', date: '14/06 12:10', entity: 'SARL Pharma Annaba',      type: 'Crédit',   score: 44.8, decision: 'Approbation',          riskLevel: 'moyen',    model: 'XGBoost Crédit',    validated: true,  analyst: 'K. Bouzidi' },
      { id: 'DEC-2840', date: '14/06 11:47', entity: 'El Aurassi Hotels',       type: 'Marché',   score: 56.3, decision: 'Surveillance renforcée',riskLevel: 'moyen',    model: 'LSTM SGBV',         validated: true,  analyst: 'M. Tabet' },
    ];
    for(const dh of dhData) {
      await prisma.decisionHistoryItem.create({data: dh});
    }
  }

  // --- Risques Data (Portfolio, KPIs, Stress Tests, VaR) ---
  await prisma.risqueActif.deleteMany();
  
  const fs = require('fs');
  const path = require('path');
  const varResultPath = path.join(__dirname, '../../AI_Pipeline/var_results.json');
  let risquesPortefeuille: any[] = [];
  let varData: any[] = [];
  
  if (fs.existsSync(varResultPath)) {
    const varJson = JSON.parse(fs.readFileSync(varResultPath, 'utf8'));
    risquesPortefeuille = varJson.portfolio || [];
    varData = varJson.var_data || [];
  }
  
  if (risquesPortefeuille.length > 0) {
    for (const r of risquesPortefeuille) {
      await prisma.risqueActif.create({ data: r });
    }
  }

  await prisma.riskKpi.deleteMany();
  const riskStats = [
    { label: 'risk_market', value: '3.2/10', icon: 'ShieldAlert', color: 'text-amber-400', border: 'border-amber-500/20', bg: 'from-amber-500/10' },
    { label: 'risk_liquidity', value: '2.1/10', icon: 'TrendingDown', color: 'text-green-400', border: 'border-green-500/20', bg: 'from-green-500/10' },
    { label: 'risk_credit', value: '1.8/10', icon: 'AlertTriangle', color: 'text-green-400', border: 'border-green-500/20', bg: 'from-green-500/10' },
    { label: 'risk_operational', value: '4.1/10', icon: 'BarChart3', color: 'text-red-400', border: 'border-red-500/20', bg: 'from-red-500/10' },
  ];
  for (const stat of riskStats) {
    await prisma.riskKpi.create({ data: stat });
  }

  await prisma.stressTest.deleteMany();
  const stressTests = [
    { scenario: 'Krach -20%', impact: -18.4, prob: 2.1, color: '#ef4444' },
    { scenario: 'Crise liquidité', impact: -12.7, prob: 5.8, color: '#f97316' },
    { scenario: 'Choc pétrolier DZ', impact: -8.3, prob: 11.2, color: '#eab308' },
    { scenario: 'Dépréciation DZD', impact: -5.9, prob: 18.4, color: '#22c55e' },
    { scenario: 'Hausse taux BA', impact: -3.2, prob: 24.6, color: '#4ade80' },
    { scenario: 'Scénario de base', impact: +2.4, prob: 38.0, color: '#86efac' },
  ];
  for (const st of stressTests) {
    await prisma.stressTest.create({ data: st });
  }

  await prisma.varData.deleteMany();
  if (varData.length > 0) {
    for (const vd of varData) {
      await prisma.varData.create({ data: vd });
    }
  }

  // --- Modeles IA Data (Comparaison, Matrice, Perf Temporelle) ---
  await prisma.comparaisonModele.deleteMany();
  const compModeles = [
    { sujet: 'Précision', LSTM: 93, XGBoost: 96, RandomForest: 85, Transformer: 88 },
    { sujet: 'Rappel', LSTM: 90, XGBoost: 95, RandomForest: 82, Transformer: 86 },
    { sujet: 'Vitesse', LSTM: 65, XGBoost: 85, RandomForest: 92, Transformer: 45 },
    { sujet: 'Robustesse', LSTM: 78, XGBoost: 92, RandomForest: 88, Transformer: 85 },
    { sujet: 'Scalabilité', LSTM: 75, XGBoost: 88, RandomForest: 95, Transformer: 60 },
    { sujet: 'Interprét.', LSTM: 45, XGBoost: 82, RandomForest: 75, Transformer: 30 }
  ];
  for (const cm of compModeles) {
    await prisma.comparaisonModele.create({ data: cm });
  }

  await prisma.matriceConfusion.deleteMany();
  await prisma.matriceConfusion.create({
    data: {
      vraiPositif: 712,
      fauxPositif: 28,
      fauxNegatif: 39,
      vraiNegatif: 921
    }
  });

  await prisma.performanceTemporelle.deleteMany();
  const perfTemp = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(2025, 4, 15 + i);
    const dateStr = date.toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' });
    perfTemp.push({
      date: dateStr,
      lstm: Math.round((90 + Math.sin(i / 5) * 3 + (i % 2)) * 10) / 10,
      xgboost: Math.round((93 + Math.sin(i / 7) * 2 + (i % 1.5)) * 10) / 10,
      rf: Math.round((85 + Math.sin(i / 4) * 4 + (i % 2.5)) * 10) / 10,
      transformer: Math.round((88 + Math.sin(i / 6) * 3 + (i % 2)) * 10) / 10,
    });
  }
  for (const pt of perfTemp) {
    await prisma.performanceTemporelle.create({ data: pt });
  }

  // --- Options for Nouveau Modele Modal ---
  await prisma.predictionModel.deleteMany();
  const predictionModels = [
    { value: 'LSTM', label: 'LSTM', accuracy: 0, color: '' },
    { value: 'XGBoost', label: 'XGBoost', accuracy: 0, color: '' },
    { value: 'Random Forest', label: 'Random Forest', accuracy: 0, color: '' },
    { value: 'Transformer', label: 'Transformer', accuracy: 0, color: '' },
    { value: 'GRU', label: 'GRU', accuracy: 0, color: '' },
    { value: 'Prophet', label: 'Prophet', accuracy: 0, color: '' },
    { value: 'ARIMA', label: 'ARIMA', accuracy: 0, color: '' },
  ];
  for (const pm of predictionModels) {
    await prisma.predictionModel.create({ data: pm });
  }

  await prisma.predictionTarget.deleteMany();
  const predictionTargets = [
    { value: 'Cours SGBV', label: 'Cours SGBV' },
    { value: 'Score Risque', label: 'Score Risque' },
    { value: 'Détection Fraude', label: 'Détection Fraude' },
    { value: 'Crédit Score', label: 'Crédit Score' },
    { value: 'VaR', label: 'VaR' },
  ];
  for (const pt of predictionTargets) {
    await prisma.predictionTarget.create({ data: pt });
  }


  await prisma.modelPerformance.deleteMany();
  
  const benchmarkPath = path.join(__dirname, '../../AI_Pipeline/benchmark_results.json');
  let fraudAcc = 0, fraudPrec = 0, fraudRec = 0, fraudF1 = 0, fraudMae = 0, fraudRmse = 0;
  let credAcc = 0, credPrec = 0, credRec = 0, credF1 = 0, credMae = 0, credRmse = 0;
  let nplPrec = 0, nplRec = 0, nplF1 = 0, nplMae = 0, nplRmse = 0;
  let islamPrec = 0, islamRec = 0, islamF1 = 0, islamMae = 0, islamRmse = 0;
  
  if (fs.existsSync(benchmarkPath)) {
    const benchData = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));
    if (benchData.fraud_engine) {
      fraudPrec = Math.round(benchData.fraud_engine.accuracy * 100);
      fraudRec = Math.round(benchData.fraud_engine.recall * 100);
      fraudF1 = Math.round(benchData.fraud_engine.f1 * 100);
      fraudMae = benchData.fraud_engine.mae ? parseFloat(benchData.fraud_engine.mae.toFixed(2)) : 0;
      fraudRmse = benchData.fraud_engine.rmse ? parseFloat(benchData.fraud_engine.rmse.toFixed(2)) : 0;
    }
    if (benchData.credit_risk_engine) {
      credPrec = Math.round(benchData.credit_risk_engine.accuracy * 100);
      credRec = Math.round(benchData.credit_risk_engine.recall * 100);
      credF1 = Math.round(benchData.credit_risk_engine.f1 * 100);
      credMae = benchData.credit_risk_engine.mae ? parseFloat(benchData.credit_risk_engine.mae.toFixed(2)) : 0;
      credRmse = benchData.credit_risk_engine.rmse ? parseFloat(benchData.credit_risk_engine.rmse.toFixed(2)) : 0;
    }
    if (benchData.npl_engine) {
      nplPrec = Math.round(benchData.npl_engine.accuracy * 100);
      nplRec = Math.round(benchData.npl_engine.recall * 100);
      nplF1 = Math.round(benchData.npl_engine.f1 * 100);
      nplMae = benchData.npl_engine.mae ? parseFloat(benchData.npl_engine.mae.toFixed(2)) : 0;
      nplRmse = benchData.npl_engine.rmse ? parseFloat(benchData.npl_engine.rmse.toFixed(2)) : 0;
    }
    if (benchData.islamic_engine) {
      islamPrec = Math.round(benchData.islamic_engine.accuracy * 100);
      islamRec = Math.round(benchData.islamic_engine.recall * 100);
      islamF1 = Math.round(benchData.islamic_engine.f1 * 100);
      islamMae = benchData.islamic_engine.mae ? parseFloat(benchData.islamic_engine.mae.toFixed(2)) : 0;
      islamRmse = benchData.islamic_engine.rmse ? parseFloat(benchData.islamic_engine.rmse.toFixed(2)) : 0;
    }
  }

  const real_modeles_perf = [
    { nom: 'Isolation Forest (Détection Fraude)', precision: fraudPrec, rappel: fraudRec, f1Score: fraudF1, mae: fraudMae, rmse: fraudRmse, status: 'actif', dernierEntrainement: new Date().toLocaleDateString('fr-DZ') },
    { nom: 'XGBoost (Credit Risk)', precision: credPrec, rappel: credRec, f1Score: credF1, mae: credMae, rmse: credRmse, status: 'actif', dernierEntrainement: new Date().toLocaleDateString('fr-DZ') },
    { nom: 'LightGBM (NPL Early Warning)', precision: nplPrec, rappel: nplRec, f1Score: nplF1, mae: nplMae, rmse: nplRmse, status: 'actif', dernierEntrainement: new Date().toLocaleDateString('fr-DZ') },
    { nom: 'XGBoost (Islamic Risk)', precision: islamPrec, rappel: islamRec, f1Score: islamF1, mae: islamMae, rmse: islamRmse, status: 'actif', dernierEntrainement: new Date().toLocaleDateString('fr-DZ') },
  ];
  for (const mp of real_modeles_perf) {
    await prisma.modelPerformance.create({ data: mp });
  }

  console.log('Seeding finished successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
