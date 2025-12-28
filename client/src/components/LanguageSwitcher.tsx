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
      className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      <Globe className="w-4 h-4 mr-2" />
      {currentLanguage === 'en' ? 'EN' : 'RU'}
    </button>
  )
}
