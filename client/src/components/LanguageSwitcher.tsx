import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }
  
  const currentLanguage = i18n.language
  
  return (
    <button
      onClick={() => changeLanguage(currentLanguage === 'en' ? 'ru' : 'en')}
      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
    >
      <Globe className="w-4 h-4 mr-2" />
      {currentLanguage === 'en' ? 'EN' : 'RU'}
    </button>
  )
}
