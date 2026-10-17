import { useMemo } from 'react'
import { create } from 'zustand'
import { STRINGS } from './strings'

const STORAGE_KEY = 'avalon.lang'
const LANGS = ['en', 'zh']

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (LANGS.includes(saved)) return saved
  } catch {}
  return 'en'
}

function applyToDocument(lang) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang === 'zh' ? 'zh' : 'en'
  document.title = lang === 'zh' ? '阿瓦隆 · Avalon' : 'Avalon'
}

export const useLangStore = create((set) => ({
  lang: initialLang(),
  setLang: (lang) => {
    try { localStorage.setItem(STORAGE_KEY, lang) } catch {}
    applyToDocument(lang)
    set({ lang })
  },
}))

applyToDocument(useLangStore.getState().lang)

export function getLang() {
  return useLangStore.getState().lang
}

// Unknown keys come back unchanged, so raw messages (e.g. Firebase errors) pass through.
export function translate(lang, key, params) {
  const entry = STRINGS[key]
  if (!entry) return key
  const text = (lang === 'zh' ? entry[0] : entry[1]) ?? entry[0]
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (m, k) => (params[k] ?? m))
}

export function useT() {
  const lang = useLangStore(s => s.lang)
  return useMemo(() => {
    const t = (key, params) => translate(lang, key, params)
    t.lang = lang
    // Errors thrown by roomApi carry a string key as message (and optional params).
    t.err = (e, fallbackKey) => (e?.message ? translate(lang, e.message, e.params) : translate(lang, fallbackKey))
    // Events carry { i18n: key, ...params } in data; older events only have a Chinese message.
    t.event = (e) => (e?.data?.i18n ? translate(lang, e.data.i18n, e.data) : e?.message)
    return t
  }, [lang])
}
