import type { SupportedLanguage } from '../config'

// Translation key resolver with nested key support
export class Translator {
  private translations: Record<string, any> = {}

  constructor(translations: Record<string, any>) {
    this.translations = translations
  }

  // Resolve nested keys like 'inventory.itemCode'
  private resolveKey(obj: Record<string, any>, key: string): string | undefined {
    return key.split('.').reduce((current: any, keyPart) => {
      return current?.[keyPart]
    }, obj)
  }

  // Replace parameters in translation strings
  private interpolate(str: string, params?: Record<string, string | number>): string {
    if (!params) return str

    return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key]?.toString() || match
    })
  }

  // Main translation function
  t(key: string, params?: Record<string, string | number>): string {
    const translation = this.resolveKey(this.translations, key)

    if (translation === undefined) {
      console.warn(`Translation key "${key}" not found`)
      return key // Return key as fallback
    }

    if (typeof translation !== 'string') {
      console.warn(`Translation key "${key}" is not a string`)
      return key
    }

    return this.interpolate(translation, params)
  }

  // Check if translation exists
  exists(key: string): boolean {
    return this.resolveKey(this.translations, key) !== undefined
  }

  // Get all available translation keys
  getKeys(): string[] {
    const keys: string[] = []
    const traverse = (obj: Record<string, any>, prefix = ''): void => {
      Object.entries(obj).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          traverse(value, fullKey)
        } else {
          keys.push(fullKey)
        }
      })
    }
    traverse(this.translations)
    return keys
  }
}

// Language detection utilities
export class LanguageDetector {
  // Detect language from browser settings
  static detectBrowserLanguage(): SupportedLanguage {
    if (typeof window === 'undefined') return 'en'

    const browserLanguages = navigator.languages || [navigator.language]

    for (const browserLang of browserLanguages) {
      const langCode = browserLang.toLowerCase().split('-')[0]
      if (langCode === 'th') return 'th'
      if (langCode === 'en') return 'en'
    }

    return 'en' // fallback
  }

  // Get language from local storage
  static getStoredLanguage(): SupportedLanguage | null {
    if (typeof window === 'undefined') return null

    const stored = localStorage.getItem('ssth-inventory-language')
    if (stored === 'en' || stored === 'th') return stored
    return null
  }

  // Save language to local storage
  static storeLanguage(language: SupportedLanguage): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('ssth-inventory-language', language)
  }
}