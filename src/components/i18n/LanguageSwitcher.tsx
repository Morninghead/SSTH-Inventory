import { useState } from 'react'
import { useI18n } from '../../i18n/I18nProvider'
import { Globe, Check } from 'lucide-react'
import { languageMetadata } from '../../i18n/config'

interface LanguageSwitcherProps {
  variant?: 'full' | 'compact'
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

  // Unified modern design for all devices
  return (
    <div className={`relative ${className}`}>
      {/* Modern Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-gray-700 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-full hover:border-blue-400 hover:shadow-lg transition-all duration-300 overflow-hidden"
      >
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Globe icon */}
        <Globe className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 text-blue-600 group-hover:rotate-12 transition-transform duration-300" />

        {/* Flag emoji - always visible */}
        <span className="text-xl sm:text-2xl relative z-10 group-hover:scale-110 transition-transform duration-300">
          {currentLanguage.flag}
        </span>

        {/* Language name - visible on all devices */}
        <span className="relative z-10 font-semibold text-xs sm:text-sm group-hover:text-blue-700 transition-colors duration-300">
          {currentLanguage.code.toUpperCase()}
        </span>

        {/* Chevron indicator */}
        <svg
          className={`w-3 h-3 sm:w-4 sm:h-4 relative z-10 text-gray-500 group-hover:text-blue-600 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    Select Language
                  </div>
                  <div className="text-xs text-white/80">
                    เลือกภาษา
                  </div>
                </div>
              </div>
            </div>

            {/* Language Options */}
            <div className="p-2">
              {Object.entries(languageMetadata).map(([code, metadata]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code as 'en' | 'th')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${code === language
                      ? 'bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 shadow-md scale-[1.02]'
                      : 'hover:bg-gray-50 hover:scale-[1.01]'
                    }`}
                >
                  {/* Flag */}
                  <div className={`text-3xl transition-transform duration-200 ${code === language ? 'scale-110' : ''
                    }`}>
                    {metadata.flag}
                  </div>

                  {/* Language Info */}
                  <div className="flex-1">
                    <div className={`font-semibold text-sm ${code === language ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                      {metadata.name}
                    </div>
                    <div className={`text-xs ${code === language ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                      {metadata.nativeName}
                    </div>
                  </div>

                  {/* Check Badge */}
                  {code === language && (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-sm opacity-50"></div>
                      <div className="relative w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Footer Tip */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Language preference saved automatically</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}