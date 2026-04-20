import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import tr from './locales/tr.json'
import de from './locales/de.json'
import fr from './locales/fr.json'
import es from './locales/es.json'
import pt from './locales/pt.json'
import ru from './locales/ru.json'
import zh from './locales/zh.json'
import ja from './locales/ja.json'

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
] as const

export type LangCode = typeof LANGUAGES[number]['code']

export const DATE_LOCALES: Record<LangCode, string> = {
  en: 'en-US',
  tr: 'tr-TR',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  pt: 'pt-BR',
  ru: 'ru-RU',
  zh: 'zh-CN',
  ja: 'ja-JP',
}

const savedLang = localStorage.getItem('marmotconn-language') || 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, tr: { translation: tr }, de: { translation: de }, fr: { translation: fr }, es: { translation: es }, pt: { translation: pt }, ru: { translation: ru }, zh: { translation: zh }, ja: { translation: ja } },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export function setLanguage(code: LangCode) {
  i18n.changeLanguage(code)
  localStorage.setItem('marmotconn-language', code)
}

export default i18n
