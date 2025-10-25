'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ResetPasswordPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) {
        setError(t('auth.error.reset.failed'))
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError(t('auth.error.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#202020] flex items-center justify-center px-4">
      {/* Back button */}
      <Link
        href="/login"
        className="absolute top-4 left-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </Link>

      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4">
              <Image
                src="/icon.png"
                alt="Livey Icon"
                width={64}
                height={64}
                className="w-full h-full"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {t('auth.reset.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {t('auth.reset.subtitle')}
            </p>
          </div>

          {/* Success Message */}
          {success ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.reset.success')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('auth.reset.check.email')}
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t('auth.back.to.login')}
              </Link>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('auth.email.label')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder={t('auth.email.placeholder')}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-primary dark:bg-[#3B82F6] text-white rounded-lg font-semibold shadow-lg hover:bg-primary-600 dark:hover:bg-blue-500 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t('auth.processing')}
                    </>
                  ) : (
                    t('auth.reset.button')
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {t('auth.back.to.login')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
