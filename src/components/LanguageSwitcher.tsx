import { Globe2 } from 'lucide-react'
import { useI18n } from '@/i18n/I18nProvider'
import { Language, languages } from '@/i18n/translations'

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useI18n()

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm ${
        compact ? 'w-fit' : ''
      }`}
      aria-label={t('common.language')}
    >
      <div className="hidden h-8 items-center px-2 text-slate-500 sm:flex">
        <Globe2 className="h-4 w-4" />
      </div>
      {languages.map((item) => (
        <button
          key={item.code}
          type="button"
          onClick={() => setLanguage(item.code as Language)}
          className={`h-8 rounded-lg px-2.5 text-xs font-black transition ${
            language === item.code
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
          aria-pressed={language === item.code}
        >
          {item.shortLabel}
        </button>
      ))}
    </div>
  )
}
