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
  lien_tab?: string;
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
  id?: string;
  date: string;
  valeur: number;
  anomalie: boolean;
  score: number;
  score_raw?: number;
  entite?: string;
  client_id?: string;
  compte_numero?: string;
  decision?: string;
  details?: any;

  // Spécification PDF Anomaly Detection (Tasks / Anomaly detection.PDF)
  type_operation?: string;
  sous_type?: string;
  montant?: number;
  devise?: string;
  date_heure_operation?: string;
  frequence_actuelle?: string;

  montant_habituel?: number;
  montant_maximum_habituel?: number;
  nombre_moyen_operations?: number;
  frequence_habituelle?: string;
  types_operations_habituels?: string;
  horaires_habituels?: string;
  localisation_habituelle?: string;
  canal_habituel?: string;
  device_habituel?: string;
  beneficiaire_habituel?: string;

  localisation_actuelle?: string;
  canal_actuel?: string;
  device_actuel?: string;
  adresse_ip?: string;
  nouveau_beneficiaire?: string;
  nouveau_device?: string;

  ecart_montant?: string;
  ecart_frequence?: string;
  ecart_horaire?: string;
  ecart_geographique?: string;
  ecart_device?: string;
  ecart_comportemental?: string;
  anomalies_recentes_count?: number;
  niveau?: string;

  motifs?: string[];
  actions?: string[];
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
