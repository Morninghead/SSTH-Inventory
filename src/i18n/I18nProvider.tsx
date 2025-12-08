import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'

import { i18nConfig, type SupportedLanguage, type TranslationFunction } from './config'
import { Translator, LanguageDetector } from './utils/translator'
import { TranslationLoader } from './utils/loader'

// I18n context interface
interface I18nContext {
  language: SupportedLanguage
  setLanguage: (language: SupportedLanguage) => Promise<void>
  t: TranslationFunction
  isLoading: boolean
  availableLanguages: typeof i18nConfig.supportedLanguages
}

// Create context
const I18nContext = createContext<I18nContext | undefined>(undefined)

// Provider props
interface I18nProviderProps {
  children: ReactNode
  initialLanguage?: SupportedLanguage
}

// Main I18n Provider component
export function I18nProvider({ children, initialLanguage }: I18nProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>(
    initialLanguage || i18nConfig.defaultLanguage
  )
  const [translator, setTranslator] = useState<Translator | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize translations
  const initializeTranslations = useCallback(async (lang: SupportedLanguage) => {
    setIsLoading(true)
    try {
      const translations = await TranslationLoader.loadTranslations(lang)
      setTranslator(new Translator(translations))
      setLanguageState(lang)
      LanguageDetector.storeLanguage(lang)
    } catch (error) {
      console.error('Failed to initialize translations:', error)
      // Fallback to default language
      if (lang !== i18nConfig.defaultLanguage) {
        await initializeTranslations(i18nConfig.defaultLanguage)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Change language function
  const setLanguage = useCallback(async (newLanguage: SupportedLanguage) => {
    if (newLanguage === language) return
    await initializeTranslations(newLanguage)
  }, [language, initializeTranslations])

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      let langToUse: SupportedLanguage

      if (initialLanguage) {
        langToUse = initialLanguage
      } else {
        // Priority: stored language > browser detection > default
        const storedLanguage = LanguageDetector.getStoredLanguage()
        langToUse = storedLanguage || LanguageDetector.detectBrowserLanguage() || i18nConfig.defaultLanguage
      }

      await initializeTranslations(langToUse)
    }

    initialize()
  }, [initialLanguage, initializeTranslations])

  // Translation function
  const t: TranslationFunction = useCallback((key: string, params?: Record<string, string | number>) => {
    if (!translator) {
      return key // Return key during loading
    }
    return translator.t(key, params)
  }, [translator])

  const value: I18nContext = {
    language,
    setLanguage,
    t,
    isLoading,
    availableLanguages: i18nConfig.supportedLanguages
  }

  // Show loading state while initializing
  if (isLoading && !translator) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

// Hook to use i18n context
export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Export context for testing
export { I18nContext }