// ======================================================================
// DONNÉES XAI — Explainable AI pour Risk Managers
// SHAP values, LIME, Feature Importance, Décisions expliquées
// ======================================================================

export interface ShapFeature {
  id?: string;
  xaiDecisionId?: string;
  feature: string;
  feature_ar: string;
  feature_en: string;
  shapValue: number;
  baselineValue: number;
  actualValue: string;
  contribution: 'positive' | 'negative' | 'neutral' | string;
  importance: number;
  category: 'financier' | 'comportemental' | 'marché' | 'macro' | 'client' | string;
}

export interface CounterFactual {
  id?: string;
  xaiDecisionId?: string;
  action_fr: string;
  action_ar: string;
  action_en: string;
  impact: number;
  feasibility: 'facile' | 'moyen' | 'difficile' | string;
}

export interface XaiDecision {
  id: string;
  type: 'credit' | 'fraude' | 'marche' | 'liquidite' | string;
  label_fr: string;
  label_ar: string;
  label_en: string;
  entity: string;
  decision_fr: string;
  decision_ar: string;
  decision_en: string;
  score: number;
  confidence: number;
  riskLevel: 'faible' | 'moyen' | 'élevé' | 'critique' | string;
  timestamp: string;
  model: string;
  shapFeatures: ShapFeature[];
  counterFactuals: CounterFactual[];
  naturalExplanation_fr: string;
  naturalExplanation_ar: string;
  naturalExplanation_en: string;
}

export interface GlobalFeatureImportance {
  id?: string;
  feature: string;
  feature_ar: string;
  importance: number;
  trend: 'up' | 'down' | 'stable' | string;
  category: string;
}

export interface ModelFairness {
  id?: string;
  group: string;
  group_ar: string;
  accuracy: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  count: number;
}

export interface DecisionHistoryItem {
  id: string;
  date: string;
  entity: string;
  type: string;
  score: number;
  decision: string;
  riskLevel: 'faible' | 'moyen' | 'élevé' | 'critique' | string;
  model: string;
  validated: boolean;
  analyst: string;
}
