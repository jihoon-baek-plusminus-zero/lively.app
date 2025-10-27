'use client'
import { logger } from '@/lib/logger'

import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function MultiWarningPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConnect = async () => {
    setIsProcessing(true)

    try {
      // 1. 현재 사용자의 모든 녹음중인 항목을 완료로 변경
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('lectures')
        .update({ status: 'completed' })
        .eq('user_id', user.id)
        .eq('status', 'recording')

      if (error) throw error

      // 2. 브로드캐스트 채널로 다른 세션에 새로고침 명령 전송
      const channel = supabase.channel('session_control')
      await channel.subscribe()
      await channel.send({
        type: 'broadcast',
        event: 'force_refresh',
        payload: { userId: user.id }
      })

      logger.log('✅ 다른 세션에 새로고침 명령 전송')

      // 3. 콘솔 페이지로 이동
      router.push('/console')
    } catch (error) {
      logger.error('❌ 접속 처리 실패:', error)
      alert('접속 처리에 실패했습니다. 다시 시도해주세요.')
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    // 현재 탭 닫기
    window.close()

    // window.close()가 작동하지 않는 경우 (새 탭으로 열린 경우가 아닌 경우)
    // 이전 페이지로 이동
    setTimeout(() => {
      router.back()
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#202020] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
            <AlertCircle className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">
          {t('multi.warning.title')}
        </h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8 leading-relaxed">
          {t('multi.warning.message')}
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleConnect}
            disabled={isProcessing}
            className="w-full px-6 py-3 bg-primary dark:bg-[#3B82F6] hover:bg-primary-600 dark:hover:bg-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? '처리 중...' : t('multi.warning.connect')}
          </button>

          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('multi.warning.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
