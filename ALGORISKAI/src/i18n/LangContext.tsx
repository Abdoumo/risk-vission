import { createContext, useContext, useState, type ReactNode } from 'react';
import { translations, type Lang, type TranslationKey } from './translations';

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LangContext = createContext<LangContextType>({
  lang: 'fr',
  setLang: () => {},
  t: (key) => key,
  isRTL: false,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr');

  const t = (key: TranslationKey): string => {
    return (translations[lang] as Record<string, string>)[key] || (translations.fr as Record<string, string>)[key] || key;
  };

  const isRTL = lang === 'ar';

  return (
    <LangContext.Provider value={{ lang, setLang, t, isRTL }}>
      <div dir={isRTL ? 'rtl' : 'ltr'} className={isRTL ? 'font-arabic' : ''}>
        {children}
      </div>
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
