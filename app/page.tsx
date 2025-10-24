'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Mic, MessageSquare, Languages, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSelector } from '@/components/LanguageSelector'

export default function Home() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  // 이미 로그인된 사용자는 콘솔로 리다이렉트
  useEffect(() => {
    if (!loading && user) {
      router.push('/console')
    }
  }, [user, loading, router])

  // 로딩 중이면 로딩 화면 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">{t('home.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('app.name')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Link
              href="/login"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              {t('home.header.cta')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Main Content */}
          <div className="text-center mb-20">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t('home.hero.title')}
              <br />
              {t('home.hero.subtitle')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto whitespace-pre-line">
              {t('home.hero.description')}
            </p>
            <Link
              href="/login"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 inline-flex items-center gap-3"
            >
              {t('home.cta.start')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            <FeatureCard
              icon={<Mic className="w-6 h-6" />}
              title={t('feature.realtime.title')}
              description={t('feature.realtime.desc')}
              gradient="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={<Languages className="w-6 h-6" />}
              title={t('feature.translation.title')}
              description={t('feature.translation.desc')}
              gradient="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title={t('feature.ai.title')}
              description={t('feature.ai.desc')}
              gradient="from-orange-500 to-red-500"
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title={t('feature.search.title')}
              description={t('feature.search.desc')}
              gradient="from-green-500 to-emerald-500"
            />
          </div>

          {/* Demo Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
              {t('home.demo.title')}
            </h2>
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-10 h-10 text-white" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {t('home.demo.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">{t('app.name')}</span>
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
      <div
        className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center mb-4 text-white`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </div>
  )
}
