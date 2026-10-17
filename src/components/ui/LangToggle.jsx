import { useLangStore, useT } from '../../i18n'

export default function LangToggle() {
  const lang = useLangStore(s => s.lang)
  const setLang = useLangStore(s => s.setLang)
  const t = useT()

  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
      aria-label={t('lang.switch')}
      title={t('lang.switch')}
      className="fixed right-3 z-50 flex items-center rounded-full border border-gold/40 bg-black/55 px-1 py-1 text-[11px] backdrop-blur-sm"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
    >
      <span className={`rounded-full px-2.5 py-0.5 transition ${lang === 'en' ? 'bg-gold/30 text-goldBright' : 'text-inkMuted'}`}>EN</span>
      <span className={`rounded-full px-2.5 py-0.5 transition ${lang === 'zh' ? 'bg-gold/30 text-goldBright' : 'text-inkMuted'}`}>中文</span>
    </button>
  )
}
