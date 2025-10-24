'use client'

import { useState, useEffect, useRef } from 'react'
import { Languages, Mic } from 'lucide-react'

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
}

interface CaptionPanelProps {
  isRecording: boolean
  isCompleted: boolean
  captions: Caption[]
  savedCaptions?: SavedCaption[]
}

export default function CaptionPanel({ isRecording, isCompleted, captions, savedCaptions = [] }: CaptionPanelProps) {
  const [showTranslation, setShowTranslation] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

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

  // 자동 스크롤
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [captions, savedCaptions, autoScroll])

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Panel Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {isRecording ? '실시간 자막' : '기록'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* 번역 토글 */}
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                showTranslation
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Languages className="w-4 h-4" />
              {showTranslation ? '한 ↔ 영' : '번역'}
            </button>

            {/* 자동 스크롤 토글 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-4 h-4 text-blue-600 dark:text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">자동스크롤</span>
            </label>
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
                {isCompleted ? '저장된 자막이 없습니다' : '녹음을 시작하면 자막이 표시됩니다'}
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
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded">
                        {caption.speaker || '화자'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(caption.timestamp_seconds)}
                      </span>
                    </div>
                  </div>

                  {/* 자막 텍스트 */}
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                    {caption.text}
                  </p>
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
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded">
                          {caption.speaker || '화자'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {caption.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* 자막 텍스트 */}
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                      {caption.text}
                    </p>
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
                        실시간 입력 중...
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

      {/* Bottom Info */}
      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          총 {displayCaptions.length}개의 자막 | Powered by Deepgram Nova-2
        </p>
      </div>
    </div>
  )
}
