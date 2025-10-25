'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#202020]">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary dark:bg-[#3B82F6] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">{t('home.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#202020]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Image
            src="/logo.png"
            alt="Livey Logo"
            width={150}
            height={40}
            className="h-8 w-auto"
          />
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Link
              href="/login"
              className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 hover:shadow-lg transition-all duration-200 flex items-center gap-2"
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
            <h1 className="text-6xl font-bold mb-6 text-gray-900 dark:text-white">
              {t('home.hero.title')}
              <br />
              <span className="text-primary">{t('home.hero.subtitle')}</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto whitespace-pre-line">
              {t('home.hero.description')}
            </p>
            <Link
              href="/login"
              className="px-8 py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary-600 hover:shadow-xl transition-all duration-200 inline-flex items-center gap-3"
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
              color="bg-primary dark:bg-[#3B82F6]"
            />
            <FeatureCard
              icon={<Languages className="w-6 h-6" />}
              title={t('feature.translation.title')}
              description={t('feature.translation.desc')}
              color="bg-primary-600"
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title={t('feature.ai.title')}
              description={t('feature.ai.desc')}
              color="bg-primary-700"
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title={t('feature.search.title')}
              description={t('feature.search.desc')}
              color="bg-primary-500"
            />
          </div>

          {/* Demo Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
              {t('home.demo.title')}
            </h2>
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary dark:bg-[#3B82F6] rounded-full flex items-center justify-center mx-auto mb-4">
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
      <footer className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <Image
              src="/logo.png"
              alt="Livey Logo"
              width={120}
              height={30}
              className="h-6 w-auto"
            />
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
  color,
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
      <div
        className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4 text-white`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </div>
  )
}
