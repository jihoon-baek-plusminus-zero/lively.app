'use client'

import { useState, useEffect } from 'react'
import { X, Languages } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface TranslationActivationModalProps {
  recordingLanguage: string
  onConfirm: (targetLang: string) => void
  onClose: () => void
}

const AVAILABLE_LANGUAGES = ['ko', 'en', 'ja', 'zh', 'es'] as const

export default function TranslationActivationModal({
  recordingLanguage,
  onConfirm,
  onClose
}: TranslationActivationModalProps) {
  const { t } = useLanguage()

  // 번역 언어 초기값: 녹음 언어와 다른 첫 번째 언어
  const getDefaultTranslateLang = (audioLang: string) => {
    return AVAILABLE_LANGUAGES.find(lang => lang !== audioLang) || 'en'
  }
  const [translateTo, setTranslateTo] = useState<string>(getDefaultTranslateLang(recordingLanguage))

  const handleConfirm = () => {
    onConfirm(translateTo)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary dark:bg-[#3B82F6] rounded-lg flex items-center justify-center">
              <Languages className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {t('console.translation.toggle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Translation Language Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('language.settings.translate.to')}
            </label>
            <select
              value={translateTo}
              onChange={(e) => setTranslateTo(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {AVAILABLE_LANGUAGES.filter(lang => lang !== recordingLanguage).map((lang) => (
                <option key={lang} value={lang}>
                  {t(`language.name.${lang}` as any)}
                </option>
              ))}
            </select>
          </div>

          {/* Translation Warnings */}
          <div className="space-y-2">
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              ⚠️ {t('language.settings.translate.warning.cost')}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              ⚠️ {t('language.settings.translate.warning.unchangeable')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
          >
            {t('language.settings.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 bg-primary dark:bg-[#3B82F6] hover:bg-primary-600 dark:hover:bg-blue-500 text-white rounded-lg hover:shadow-lg transition-all font-medium"
          >
            번역 시작
          </button>
        </div>
      </div>
    </div>
  )
}
