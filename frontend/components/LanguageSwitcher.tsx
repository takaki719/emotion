'use client';

import { useLocaleStore } from '@/stores/localeStore';
import { translations } from '@/lib/translations';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore();
  const t = translations[locale];

  return (
    <div className="relative">
      <button
        onClick={() => setLocale(locale === 'ja' ? 'en' : 'ja')}
        className="ink-chip text-xs sm:text-sm"
        title={t.common.language}
      >
        <span className="text-sm sm:text-base">🌐</span>
        <span className="hidden sm:inline">{locale === 'ja' ? '日本語' : 'English'}</span>
        <span className="sm:hidden text-xs">{locale === 'ja' ? 'JP' : 'EN'}</span>
      </button>
    </div>
  );
}
