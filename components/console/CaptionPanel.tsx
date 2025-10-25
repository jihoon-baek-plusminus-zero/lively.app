'use client'

import { useState, useEffect, useRef } from 'react'
import { Languages, Mic } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Caption {
  id: string
  text: string
  isFinal: boolean
  timestamp: string
  speaker?: string
}

interface SavedCaption {
  id: string
  text: string
  timestamp_seconds: number
  speaker: string
  translated_text?: string
}

interface CaptionPanelProps {
  isRecording: boolean
  isCompleted: boolean
  captions: Caption[]
  savedCaptions?: SavedCaption[]
  translationEnabled: boolean
  translationTargetLang: string
  onTranslationToggle: (enabled: boolean) => void
  onTranslationTargetChange: (lang: string) => void
  onTranslationComplete?: (captionId: string, translatedText: string) => void
  onBulkTranslationComplete?: (translations: Record<string, string>) => void
  realTimeTranslations?: Record<string, string>
}

export default function CaptionPanel({
  isRecording,
  isCompleted,
  captions,
  savedCaptions = [],
  translationEnabled,
  translationTargetLang,
  onTranslationToggle,
  onTranslationTargetChange,
  onTranslationComplete,
  onBulkTranslationComplete,
  realTimeTranslations = {}
}: CaptionPanelProps) {
  const { t } = useLanguage()
  const [autoScroll, setAutoScroll] = useState(true)
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({})
  const [isTranslating, setIsTranslating] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const previousFinalCaptionIdsRef = useRef<Set<string>>(new Set())

  // 번역 함수 (중복 방지 포함)
  const translateText = async (text: string, captionId: string) => {
    if (!translationEnabled || !text.trim()) return

    // 이미 번역된 텍스트가 있으면 API 호출 안 함
    if (translatedTexts[captionId]) {
      console.log('⏭️ 이미 번역됨:', captionId)
      return
    }

    // 번역 중 표시 (중복 요청 방지)
    setTranslatedTexts(prev => ({
      ...prev,
      [captionId]: '번역 중...'
    }))

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLang: translationTargetLang,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const translatedText = data.translatedText

        setTranslatedTexts(prev => ({
          ...prev,
          [captionId]: translatedText
        }))

        // 완료된 강의에서만 DB 저장 (실시간은 저장 안 함 - caption ID가 UUID가 아님)
        if (isCompleted) {
          await updateCaptionTranslation(captionId, translatedText)
        } else if (!isCompleted && onTranslationComplete) {
          // 실시간 번역인 경우 콜백으로 전달
          onTranslationComplete(captionId, translatedText)
        }
      } else {
        // 실패 시 '번역 중...' 제거
        setTranslatedTexts(prev => {
          const newState = { ...prev }
          delete newState[captionId]
          return newState
        })
      }
    } catch (error) {
      console.error('Translation error:', error)
      // 에러 시 '번역 중...' 제거
      setTranslatedTexts(prev => {
        const newState = { ...prev }
        delete newState[captionId]
        return newState
      })
    }
  }

  // 자막 번역 업데이트
  const updateCaptionTranslation = async (captionId: string, translatedText: string) => {
    try {
      console.log('💾 DB에 번역 저장 시도:', captionId, translatedText.substring(0, 30))
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('captions')
        .update({ translated_text: translatedText })
        .eq('id', captionId)
        .select()

      if (error) {
        console.error('❌ 번역 저장 실패:', error)
        throw error
      }

      console.log('✅ 번역 DB 저장 성공:', captionId, data)
    } catch (error) {
      console.error('❌ 번역 저장 에러:', error)
    }
  }

  // 타임스탬프 포맷팅
  const formatTimestamp = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // 중복 제거 함수
  const removeDuplicates = (caps: SavedCaption[]): SavedCaption[] => {
    const result: SavedCaption[] = []
    let prevText = ''

    for (const cap of caps) {
      if (cap.text !== prevText) {
        result.push(cap)
        prevText = cap.text
      }
    }

    return result
  }

  // 표시할 자막 결정: 완료된 강의면 savedCaptions (중복 제거), 아니면 실시간 captions
  const displayCaptions = isCompleted
    ? removeDuplicates(savedCaptions)
    : captions.filter((c) => c.isFinal)

  // 완료된 강의에서 DB에 저장된 번역 로드 (초기 로드만)
  useEffect(() => {
    if (isCompleted && savedCaptions && savedCaptions.length > 0) {
      const translations: Record<string, string> = {}
      let hasTranslation = false

      savedCaptions.forEach(caption => {
        if (caption.translated_text) {
          translations[caption.id] = caption.translated_text
          hasTranslation = true
        }
      })

      if (hasTranslation) {
        setTranslatedTexts(translations)
        console.log('📥 DB에서 번역 로드:', Object.keys(translations).length, '개')
      }
    }
  }, [isCompleted, savedCaptions])

  // 번역 활성화 시 처리 - 완료된 강의 일괄 번역
  useEffect(() => {
    if (!translationEnabled) return

    // 완료된 강의: 번역 없는 자막만 번역
    if (isCompleted && savedCaptions) {
      const untranslatedCaptions = savedCaptions.filter(caption =>
        !caption.translated_text && !translatedTexts[caption.id]
      )

      if (untranslatedCaptions.length > 0) {
        console.log('🌐 완료된 강의 번역 시작:', untranslatedCaptions.length, '개 (미번역)')

        // 번역 진행중 상태 설정
        setIsTranslating(true)

        const allTranslations: Record<string, string> = {}
        let completed = 0

        // 순차적으로 번역 (API 부하 감소)
        untranslatedCaptions.forEach((caption, index) => {
          setTimeout(async () => {
            console.log('🌐 번역 요청 (완료된 강의):', caption.text)

            try {
              const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: caption.text, targetLang: translationTargetLang }),
              })

              if (response.ok) {
                const data = await response.json()
                const translatedText = data.translatedText

                // UI 업데이트
                setTranslatedTexts(prev => ({
                  ...prev,
                  [caption.id]: translatedText
                }))

                // 일괄 저장용 데이터 수집
                allTranslations[caption.id] = translatedText
                completed++

                // 모든 번역이 완료되면 콜백 호출
                if (completed === untranslatedCaptions.length) {
                  setIsTranslating(false) // 번역 완료
                  if (onBulkTranslationComplete) {
                    console.log('✅ 모든 번역 완료, 일괄 저장 시작')
                    onBulkTranslationComplete(allTranslations)
                  }
                }
              }
            } catch (error) {
              console.error('번역 실패:', error)
              completed++
              // 에러가 발생해도 모든 번역 시도가 끝났는지 확인
              if (completed === untranslatedCaptions.length) {
                setIsTranslating(false)
                if (onBulkTranslationComplete && Object.keys(allTranslations).length > 0) {
                  onBulkTranslationComplete(allTranslations)
                }
              }
            }
          }, index * 200) // 200ms 간격으로 요청
        })
      } else {
        console.log('✅ 모든 자막이 이미 번역되어 있습니다')
      }
    }
  }, [translationEnabled]) // savedCaptions 제거하여 중복 실행 방지

  // 실시간 번역은 console page에서 처리됨
  // CaptionPanel에서는 완료된 강의의 번역만 처리

  // 자동 스크롤
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [captions, savedCaptions, autoScroll])

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#202020] border-r border-gray-200 dark:border-gray-700">
      {/* Panel Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {isRecording ? t('caption.panel.realtime') : t('caption.panel.record')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* 완료된 강의에서는 번역 UI 숨김 */}
            {!isCompleted && (
              <>
                {/* 번역 토글 */}
                <div className="flex items-center gap-2">
                  {(() => {
                    // 버튼 텍스트 결정
                    let buttonText = t('console.translation.toggle')
                    if (translationEnabled) {
                      buttonText = t('console.translation.translating')
                    }

                    // 버튼 활성화 여부: 실시간 번역 중인 경우 비활성화
                    const isDisabled = translationEnabled

                    return (
                      <button
                        onClick={() => !isDisabled && onTranslationToggle(true)}
                        disabled={isDisabled}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                          translationEnabled
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 cursor-not-allowed'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer'
                        }`}
                      >
                        <Languages className="w-4 h-4" />
                        <span>{buttonText}</span>
                      </button>
                    )
                  })()}

                  {translationEnabled && (
                    <div className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {translationTargetLang === 'en' && 'English'}
                      {translationTargetLang === 'ko' && '한국어'}
                      {translationTargetLang === 'ja' && '日本語'}
                      {translationTargetLang === 'zh' && '中文'}
                      {translationTargetLang === 'es' && 'Español'}
                    </div>
                  )}
                </div>

                {/* 자동 스크롤 토글 */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 dark:text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('caption.panel.auto.scroll')}</span>
                </label>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Captions Display */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {displayCaptions.length === 0 && !isRecording ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                {isCompleted ? t('caption.panel.no.saved') : t('caption.panel.start.recording')}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Saved Captions (완료된 강의) */}
            {isCompleted &&
              displayCaptions.map((caption) => (
                <div
                  key={caption.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(caption.timestamp_seconds)}
                      </span>
                    </div>
                  </div>

                  {/* 자막 텍스트 */}
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                    {caption.text}
                  </p>

                  {/* 번역된 텍스트 */}
                  {(translatedTexts[caption.id] || caption.translated_text) && (
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-2 text-sm italic border-l-2 border-blue-400 pl-3">
                      {translatedTexts[caption.id] || caption.translated_text}
                    </p>
                  )}
                </div>
              ))}

            {/* Real-time Final Captions (녹음 중이거나 진행 중인 강의) */}
            {!isCompleted &&
              captions
                .filter((caption) => caption.isFinal)
                .map((caption) => (
                  <div
                    key={caption.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {caption.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* 자막 텍스트 */}
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                      {caption.text}
                    </p>

                    {/* 번역된 텍스트 */}
                    {translationEnabled && (realTimeTranslations[caption.id] || translatedTexts[caption.id]) && (
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-2 text-sm italic border-l-2 border-blue-400 pl-3">
                        {realTimeTranslations[caption.id] || translatedTexts[caption.id]}
                      </p>
                    )}
                  </div>
                ))}

            {/* Interim Caption (녹음 중일 때만) */}
            {isRecording &&
              captions
                .filter((caption) => !caption.isFinal)
                .map((caption) => (
                  <div
                    key={caption.id}
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-blue-700 dark:text-blue-400 font-semibold">
                        {t('caption.panel.live.input')}
                      </span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                      {caption.text}
                    </p>
                  </div>
                ))}
          </>
        )}
      </div>

      {/* Translation Progress Popup */}
      {isTranslating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center">
                번역이 진행중입니다. 화면을 종료하거나 나가지 마십시오
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
