import type { SupportedLanguage } from '../config'

// Lazy load translation files
export class TranslationLoader {
  private static cache = new Map<SupportedLanguage, Record<string, any>>()

  // Load translations for a specific language
  static async loadTranslations(language: SupportedLanguage): Promise<Record<string, any>> {
    // Return from cache if already loaded
    if (this.cache.has(language)) {
      return this.cache.get(language)!
    }

    try {
      // Import the translation file dynamically
      const translations = await import(`../locales/${language}.json`)
      const translationData = translations.default

      // Cache the translations
      this.cache.set(language, translationData)

      return translationData
    } catch (error) {
      console.error(`Failed to load translations for language: ${language}`, error)

      // Fallback to empty object
      const fallback = {}
      this.cache.set(language, fallback)
      return fallback
    }
  }

  // Preload all supported languages
  static async preloadAll(supportedLanguages: SupportedLanguage[]): Promise<void> {
    const loadPromises = supportedLanguages.map(lang => this.loadTranslations(lang))
    await Promise.all(loadPromises)
  }

  // Clear cache (useful for development or testing)
  static clearCache(): void {
    this.cache.clear()
  }

  // Get cached translations
  static getCached(language: SupportedLanguage): Record<string, any> | undefined {
    return this.cache.get(language)
  }
}