'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function SignupSuccessPage() {
  const router = useRouter()
  const { t } = useLanguage()

  const handleStartLivey = () => {
    router.push('/console')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#202020] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            {t('auth.signup.success.title')}
          </h1>

          {/* Subtitle */}
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {t('auth.signup.success.subtitle')}
          </p>

          {/* Start Button */}
          <button
            onClick={handleStartLivey}
            className="w-full py-3 px-4 bg-primary text-white rounded-lg font-semibold shadow-lg hover:bg-primary-600 hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
          >
            {t('auth.signup.success.button')}
          </button>
        </div>
      </div>
    </div>
  )
}
