export interface PredictionPoint {
  date: string;
  reel: number | null;
  predit: number | null;
  confMin: number | null;
  confMax: number | null;
}

export interface AnomaliePoint {
  date: string;
  valeur: number;
  anomalie: boolean;
  score: number;
}

// Génération des prédictions — Indice DZAIR30 (en points)
export function genererPredictions(): PredictionPoint[] {
  const data: PredictionPoint[] = [];
  const baseDate = new Date(2025, 0, 1);
  let valeur = 8400;

  for (let i = 0; i < 90; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' });

    const trend = Math.sin(i / 15) * 180 + i * 4.2;
    const noise = (Math.random() - 0.5) * 220;
    valeur = 8400 + trend + noise;

    if (i < 60) {
      const predNoise = (Math.random() - 0.5) * 80;
      data.push({
        date: dateStr,
        reel: Math.round(valeur),
        predit: Math.round(valeur + predNoise),
        confMin: null,
        confMax: null,
      });
    } else {
      const predVal = Math.round(valeur + (Math.random() - 0.3) * 120);
      data.push({
        date: dateStr,
        reel: null,
        predit: predVal,
        confMin: predVal - Math.round(80 + (i - 60) * 5),
        confMax: predVal + Math.round(80 + (i - 60) * 5),
      });
    }
  }
  return data;
}

// Génération des anomalies — transactions suspectes
export function genererAnomalies(): AnomaliePoint[] {
  const data: AnomaliePoint[] = [];
  const baseDate = new Date(2025, 0, 1);

  for (let i = 0; i < 60; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' });

    let valeur = 50 + Math.sin(i / 7) * 20 + (Math.random() - 0.5) * 10;
    const isAnomalie = Math.random() < 0.08;
    if (isAnomalie) {
      valeur += (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 30);
    }

    data.push({
      date: dateStr,
      valeur: Math.round(valeur * 10) / 10,
      anomalie: isAnomalie,
      score: isAnomalie
        ? Math.round((0.85 + Math.random() * 0.15) * 100) / 100
        : Math.round(Math.random() * 0.3 * 100) / 100,
    });
  }
  return data;
}

// Performance temporelle
export function genererPerformanceTemporelle() {
  const data = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(2025, 4, 15 + i);
    const dateStr = date.toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' });
    data.push({
      date: dateStr,
      lstm: Math.round((90 + Math.sin(i / 5) * 3 + Math.random() * 2) * 10) / 10,
      xgboost: Math.round((93 + Math.sin(i / 7) * 2 + Math.random() * 1.5) * 10) / 10,
      rf: Math.round((85 + Math.sin(i / 4) * 4 + Math.random() * 2.5) * 10) / 10,
      transformer: Math.round((88 + Math.sin(i / 6) * 3 + Math.random() * 2) * 10) / 10,
    });
  }
  return data;
}

// Données de VaR
export function genererVaRData() {
  const data = [];
  for (let i = 0; i < 40; i++) {
    data.push({
      jour: `J-${40 - i}`,
      perte: -Math.abs(2 + Math.random() * 3 + (Math.random() < 0.1 ? 4 : 0)),
      var95: -3.2,
    });
  }
  return data;
}
