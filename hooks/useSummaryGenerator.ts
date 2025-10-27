import { useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'

interface UseSummaryGeneratorProps {
  lectureId: string | null
  isRecording: boolean
  captionCount: number
}

/**
 * 100개 캡션마다 자동으로 요약을 생성/업데이트하는 훅
 */
export function useSummaryGenerator({
  lectureId,
  isRecording,
  captionCount,
}: UseSummaryGeneratorProps) {
  const lastProcessedCountRef = useRef<number>(0)
  const isProcessingRef = useRef<boolean>(false)

  useEffect(() => {
    if (!lectureId || !isRecording) {
      return
    }

    // 100개 단위로 요약 생성
    const shouldGenerate =
      captionCount >= 100 &&
      Math.floor(captionCount / 100) > Math.floor(lastProcessedCountRef.current / 100) &&
      !isProcessingRef.current

    if (shouldGenerate) {
      isProcessingRef.current = true
      logger.log(`[SUMMARY-GEN] 📝 100개 캡션 도달 (${captionCount}개), 요약 생성 시작`)

      fetch('/api/summaries/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            logger.log(`[SUMMARY-GEN] ✅ 요약 업데이트 성공 (총 ${data.totalCaptionCount}개 캡션)`)
            lastProcessedCountRef.current = captionCount
          } else {
            logger.log(`[SUMMARY-GEN] ℹ️ ${data.message || '요약 생성 조건 미달'}`)
          }
        })
        .catch(err => {
          logger.error('[SUMMARY-GEN] ❌ 요약 생성 실패:', err)
        })
        .finally(() => {
          isProcessingRef.current = false
        })
    }
  }, [lectureId, isRecording, captionCount])

  // 녹화 시작 시 초기화
  useEffect(() => {
    if (isRecording) {
      lastProcessedCountRef.current = 0
    }
  }, [isRecording])
}
