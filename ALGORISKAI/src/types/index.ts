export interface PredictionPoint {
  date: string;
  reel: number | null;
  predit: number | null;
  confMin: number | null;
  confMax: number | null;
}

export interface ModelPerformance {
  nom: string;
  precision: number;
  rappel: number;
  f1Score: number;
  mae: number;
  rmse: number;
  status: 'actif' | 'entraînement' | 'inactif';
  dernierEntrainement: string;
}

export interface Alerte {
  id: string;
  type: 'critique' | 'avertissement' | 'info';
  message_fr: string;
  message_ar: string;
  message_en: string;
  modele: string;
  timestamp_fr: string;
  timestamp_ar: string;
  timestamp_en: string;
  vue: boolean;
}

export interface KPI {
  labelKey: string;
  valeur: string;
  variation: number;
  unite?: string;
  tendance: 'hausse' | 'baisse' | 'stable';
}

export interface DonneeDistribution {
  tranche: string;
  count: number;
}

export interface AnomaliePoint {
  date: string;
  valeur: number;
  anomalie: boolean;
  score: number;
  entite?: string;
  decision?: string;
  details?: any;
}

export interface PipelineStep {
  id: string;
  nom_fr: string;
  nom_ar: string;
  nom_en: string;
  status: 'complété' | 'en cours' | 'en attente' | 'erreur';
  duree: string;
  details_fr: string;
  details_ar: string;
  details_en: string;
}

export interface RisqueActif {
  ticker: string;
  nom: string;
  secteur: string;
  poids: number;
  var95: number;
  mcVar95?: number;
  es95?: number;
  beta: number;
  sharpe: number;
  risque: 'faible' | 'moyen' | 'élevé';
}
