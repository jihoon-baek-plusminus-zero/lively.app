'use client'

import Link from 'next/link'
import { Mail, Home } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function VerifyEmailPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#202020] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
            {t('auth.verify.title')}
          </h1>

          {/* Message */}
          <div className="space-y-4 mb-8">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('auth.verify.message')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('auth.verify.check.email')}
            </p>
          </div>

          {/* Back to Home Button */}
          <Link
            href="/"
            className="w-full py-3 px-4 bg-primary text-white rounded-lg font-semibold shadow-lg hover:bg-primary-600 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            {t('auth.verify.back.home')}
          </Link>
        </div>
      </div>
    </div>
  )
}
