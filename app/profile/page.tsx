'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Globe, Moon, Sun, Key, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase'
import type { Language } from '@/lib/translations'
import { useUserUsage } from '@/hooks/useUserUsage'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false)
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const {
    usage,
    loading: usageLoading,
    getRemainingRecordingTime,
    getRecordedTime,
    getTotalQuotaTime,
    getRemainingAICredit
  } = useUserUsage()

  useEffect(() => {
    setMounted(true)
  }, [])

  // 로그인하지 않은 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ]

  // Format time as HH:MM:SS
  const formatTimeHHMMSS = (hours: number, minutes: number, seconds: number) => {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const handleResetPassword = async () => {
    if (!user?.email) return

    setResetPasswordLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      setResetPasswordSuccess(true)
      setTimeout(() => setResetPasswordSuccess(false), 5000)
    } catch (error) {
      console.error('Password reset error:', error)
    } finally {
      setResetPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('delete_user')

      if (error) throw error

      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Account deletion error:', error)
      alert('Failed to delete account. Please try again.')
    } finally {
      setDeleteLoading(false)
      setShowDeleteModal(false)
    }
  }

  if (loading || !user || !mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary dark:bg-[#3B82F6] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <User className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">{t('profile.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-[#202020] border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.push('/console')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {t('profile.title')}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Info */}
        <div className="bg-white dark:bg-[#202020] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('profile.section.user.info')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">{t('profile.label.name')}</label>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {user.user_metadata?.full_name || t('profile.user.default')}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">{t('profile.label.email')}</label>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{user.email}</p>
            </div>

            {/* Password Reset Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleResetPassword}
                disabled={resetPasswordLoading}
                className="flex items-center gap-2 px-4 py-2 bg-primary dark:bg-[#3B82F6] text-white rounded-lg hover:bg-primary-600 dark:hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                {resetPasswordLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                <span>{t('profile.reset.password')}</span>
              </button>
              {resetPasswordSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  {t('auth.reset.success')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Usage Information */}
        <div className="bg-white dark:bg-[#202020] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            {t('profile.usage.title')}
          </h2>

          {usageLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 dark:text-gray-500" />
            </div>
          ) : usage ? (
            <div className="space-y-6">
              {/* Recording Quota Section */}
              <div>
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('profile.usage.recording.limit')}
                </h3>
                <div className="space-y-2 pl-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('profile.usage.my.recording.limit')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {getTotalQuotaTime().hours}시간
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('profile.usage.this.month.recorded')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatTimeHHMMSS(
                        getRecordedTime().hours,
                        getRecordedTime().minutes,
                        getRecordedTime().seconds
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('profile.usage.this.month.remaining')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatTimeHHMMSS(
                        getRemainingRecordingTime().hours,
                        getRemainingRecordingTime().minutes,
                        getRemainingRecordingTime().seconds
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Credit Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('profile.usage.ai.credit.title')}
                </h3>
                <div className="space-y-2 pl-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('profile.usage.my.ai.credit')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {usage.total_ai_credit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('profile.usage.this.month.used.credits')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {usage.total_ai_used}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('profile.usage.this.month.remaining.credits')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {getRemainingAICredit()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              사용량 정보를 불러올 수 없습니다.
            </p>
          )}
        </div>

        {/* Language Settings */}
        <div className="bg-white dark:bg-[#202020] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t('profile.section.language')}
          </h2>
          <div className="space-y-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  language === lang.code
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{lang.name}</span>
                </div>
                {language === lang.code && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-white dark:bg-[#202020] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            {t('profile.section.theme')}
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span className="font-medium text-gray-900 dark:text-gray-100">{t('profile.theme.light')}</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span className="font-medium text-gray-900 dark:text-gray-100">{t('profile.theme.dark')}</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                theme === 'system'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-medium text-gray-900 dark:text-gray-100">{t('profile.theme.system')}</span>
            </button>
          </div>
        </div>

        {/* Account Deletion */}
        <div className="bg-white dark:bg-[#202020] rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6 mt-6">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            {t('profile.delete.account')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('profile.delete.account.warning')}
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('profile.delete.account')}</span>
          </button>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                정말 탈퇴하시겠습니까?
              </h3>
            </div>
            <div className="mb-6 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                이 작업은 <span className="font-bold text-red-600 dark:text-red-400">영구적이며 되돌릴 수 없습니다</span>.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                계정을 삭제하면:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                <li>모든 녹음 기록이 삭제됩니다</li>
                <li>AI 채팅 기록이 삭제됩니다</li>
                <li>저장된 번역 데이터가 삭제됩니다</li>
                <li>계정 정보가 영구적으로 삭제됩니다</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>탈퇴 중...</span>
                  </>
                ) : (
                  <span>{t('profile.delete.account')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
