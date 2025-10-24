'use client'

import { useState, useEffect } from 'react'
import { X, Globe } from 'lucide-react'
import { useLanguage, type Language } from '@/contexts/LanguageContext'

interface LanguageSettingsModalProps {
  onConfirm: (audioLanguages: string[], translateTo?: string) => void
  onClose: () => void
}

const AVAILABLE_LANGUAGES = ['ko', 'en', 'ja', 'zh', 'es'] as const

export default function LanguageSettingsModal({ onConfirm, onClose }: LanguageSettingsModalProps) {
  const { t, language } = useLanguage()

  const [selectedLanguage, setSelectedLanguage] = useState<string>(language)
  const [translateEnabled, setTranslateEnabled] = useState(false)
  const [translateTo, setTranslateTo] = useState<string>(language)

  const handleConfirm = () => {
    // 선택한 단일 언어만 사용
    const audioLanguages = [selectedLanguage]
    onConfirm(audioLanguages, translateEnabled ? translateTo : undefined)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {t('language.settings.title')}
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
        <div className="p-6 space-y-6">
          {/* Audio Languages Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t('language.settings.audio.title')}
            </h3>

            {/* Language Dropdown */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {AVAILABLE_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {t(`language.name.${lang}` as any)}
                </option>
              ))}
            </select>

            {/* Warning */}
            <p className="mt-4 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              {t('language.settings.warning')}
            </p>
          </div>

          {/* Translation Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('language.settings.translate.toggle')}
              </label>
              <button
                onClick={() => setTranslateEnabled(!translateEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  translateEnabled
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    translateEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {translateEnabled && (
              <div className="mt-3">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {t('language.settings.translate.to')}
                </label>
                <select
                  value={translateTo}
                  onChange={(e) => setTranslateTo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {t(`language.name.${lang}` as any)}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
          >
            {t('language.settings.start')}
          </button>
        </div>
      </div>
    </div>
  )
}
