import { useState } from 'react'
import { useI18n } from '../../i18n/I18nProvider'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { languageMetadata } from '../../i18n/config'

interface LanguageSwitcherProps {
  className?: string
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useI18n()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languageMetadata[language]

  const handleLanguageChange = async (langCode: 'en' | 'th') => {
    if (langCode !== language) {
      await setLanguage(langCode)
      setIsOpen(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Minimal Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <Globe className="w-3.5 h-3.5 text-gray-400" />
        <span className="uppercase tracking-wider">
          {currentLanguage.code}
        </span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Minimal Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 overflow-hidden">
            {Object.entries(languageMetadata).map(([code, metadata]) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code as 'en' | 'th')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                  code === language
                    ? 'bg-gray-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>{metadata.nativeName}</span>
                {code === language && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}