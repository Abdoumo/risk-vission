import { useLang } from '../i18n/LangContext';

interface ConfusionMatrixProps {
  data: { labels: string[]; valeurs: number[][] };
}

export default function ConfusionMatrix({ data }: ConfusionMatrixProps) {
  const { t, isRTL } = useLang();

  if (!data || !data.valeurs || data.valeurs.length < 2) {
    return (
      <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 flex items-center justify-center min-h-[300px]">
        <span className="text-[13px] font-semibold text-slate-500 animate-pulse">
          {isRTL ? 'جاري التحميل...' : 'Chargement...'}
        </span>
      </div>
    );
  }

  const total = data.valeurs.flat().reduce((a, b) => a + b, 0);
  const maxVal = Math.max(...data.valeurs.flat());

  const getColor = (val: number, row: number, col: number) => {
    const isDiag = row === col;
    const intensity = val / maxVal;
    return isDiag
      ? `rgba(34, 211, 238, ${0.1 + intensity * 0.4})` // Cyan for correct
      : `rgba(244, 63, 94, ${0.05 + intensity * 0.25})`; // Rose for incorrect
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 transition-all duration-300 hover:border-cyan-500/20 hover:shadow-[0_0_30px_rgba(34,211,238,0.05)] h-full">
      <div className={`mb-6 ${isRTL ? 'text-right' : ''}`}>
        <h3 className="text-lg font-bold text-white tracking-tight">{t('chart_confusion_title')}</h3>
        <p className="text-[13px] font-medium text-slate-400 mt-1">{t('chart_confusion_sub')} — {total} samples</p>
      </div>
      <div className="flex items-center justify-center">
        <div className="space-y-1.5">
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-24" />
            <div className="flex gap-1.5">
              {['Prédit Fraude/Défaut', 'Prédit Normal'].map((l) => (
                <div key={l} className="flex w-28 items-center justify-center rounded-t-xl bg-slate-800/50 p-2.5 border-b-2 border-slate-700/50">
                  <span className="text-[9px] font-bold tracking-wide uppercase text-slate-400 text-center leading-tight">{l}</span>
                </div>
              ))}
            </div>
          </div>
          {data.valeurs.map((row, i) => (
            <div key={i} className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex w-24 items-center ${isRTL ? 'justify-start pl-3' : 'justify-end pr-4'}`}>
                <span className="text-[9px] font-bold tracking-wide uppercase text-slate-400 border-r-2 border-slate-700/50 pr-3 text-right leading-tight">
                  {i === 0 ? 'Réel Fraude/Défaut' : 'Réel Normal'}
                </span>
              </div>
              {row.map((val, j) => (
                <div
                  key={j}
                  className={`flex h-28 w-28 flex-col items-center justify-center rounded-xl border border-white/5 transition-all duration-300 hover:scale-105 ${i === j ? 'hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:border-cyan-500/30' : 'hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] hover:border-rose-500/30'}`}
                  style={{ backgroundColor: getColor(val, i, j) }}
                >
                  <span className={`text-3xl font-black ${i === j ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}>{val}</span>
                  <span className={`mt-1.5 text-[11px] font-bold ${i === j ? 'text-cyan-200/70' : 'text-rose-200/70'}`}>{((val / total) * 100).toFixed(1)}%</span>
                  <span className={`text-[10px] font-medium mt-0.5 ${i === j ? 'text-cyan-500/80' : 'text-rose-500/80'}`}>{data.labels[i * 2 + j]}</span>
                </div>
              ))}
            </div>
          ))}
          <div className={`mt-6 flex justify-center gap-8 pt-4 border-t border-white/5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="text-center">
              <p className="text-xl font-black text-cyan-400">
                {((data.valeurs[0][0] / (data.valeurs[0][0] + data.valeurs[0][1])) * 100).toFixed(1)}%
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Sensibilité</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-cyan-400">
                {((data.valeurs[1][1] / (data.valeurs[1][0] + data.valeurs[1][1])) * 100).toFixed(1)}%
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Spécificité</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-blue-400">
                {(((data.valeurs[0][0] + data.valeurs[1][1]) / total) * 100).toFixed(1)}%
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Accuracy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
