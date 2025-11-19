import { useLanguage } from '../../contexts/LanguageContext'
import { Languages } from 'lucide-react'

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center space-x-2">
      <Languages className="w-4 h-4 text-gray-600" />
      <button
        onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
        className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium"
        title={language === 'en' ? 'Switch to Thai' : 'Switch to English'}
      >
        <span className={`${language === 'en' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
          EN
        </span>
        <span className="text-gray-400">/</span>
        <span className={`${language === 'th' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
          TH
        </span>
      </button>
    </div>
  )
}