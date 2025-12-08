// Main i18n exports
export { I18nProvider, useI18n } from './I18nProvider'
export type { TranslationFunction } from './config'

// Configuration
export {
  i18nConfig,
  languageMetadata,
  type SupportedLanguage,
  type TranslationNamespace
} from './config'

// Utilities
export { Translator, LanguageDetector } from './utils/translator'
export { TranslationLoader } from './utils/loader'

// Re-export for convenience
export { I18nContext } from './I18nProvider'