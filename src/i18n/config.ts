// i18n configuration
export type SupportedLanguage = 'en' | 'th'

export interface I18nConfig {
  defaultLanguage: SupportedLanguage
  supportedLanguages: SupportedLanguage[]
  fallbackLanguage: SupportedLanguage
}

export const i18nConfig: I18nConfig = {
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'th'],
  fallbackLanguage: 'en'
}

// Language metadata
export const languageMetadata = {
  en: {
    name: 'English',
    code: 'en',
    flag: '🇺🇸',
    dir: 'ltr' as const,
    nativeName: 'English'
  },
  th: {
    name: 'ไทย',
    code: 'th',
    flag: '🇹🇭',
    dir: 'ltr' as const,
    nativeName: 'ไทย'
  }
} as const

// Translation function type
export type TranslationFunction = (key: string, params?: Record<string, string | number>) => string

// Translation namespace type for type safety
export type TranslationNamespace = 'common' | 'navigation' | 'inventory' | 'transactions' | 'purchasing' | 'vendors' | 'reports' | 'users' | 'settings' | 'auth' | 'dashboard' | 'months' | 'departments'