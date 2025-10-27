import { useEffect, useRef, useState, useCallback } from 'react'
import { logger } from '@/lib/logger'

interface UseEmbeddingGeneratorProps {
  lectureId: string | null
  isRecording: boolean
}

export function useEmbeddingGenerator({
  lectureId,
  isRecording,
}: UseEmbeddingGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastProcessedTime, setLastProcessedTime] = useState(Date.now())
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const generateEmbeddings = useCallback(async () => {
    if (!lectureId || isGenerating) return

    logger.log('[EMBEDDING] 🚀 임베딩 생성 시작...')
    setIsGenerating(true)
    const startTime = Date.now()

    try {
      const response = await fetch('/api/embeddings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId }),
      })

      if (response.ok) {
        const data = await response.json()
        const duration = Date.now() - startTime
        logger.log(`[EMBEDDING] ✅ 임베딩 생성 완료: ${data.count}개 생성 (${duration}ms 소요)`)
        setLastProcessedTime(Date.now())
      } else {
        logger.error('[EMBEDDING] ❌ 임베딩 생성 실패:', response.status)
      }
    } catch (error) {
      logger.error('[EMBEDDING] ❌ 임베딩 생성 에러:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [lectureId, isGenerating])

  useEffect(() => {
    if (!isRecording || !lectureId) {
      // 녹음이 멈추면 타이머 정리
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const checkAndGenerate = () => {
      const now = Date.now()
      const timeSinceLastProcess = now - lastProcessedTime
      const secondsElapsed = Math.floor(timeSinceLastProcess / 1000)

      logger.log(`[EMBEDDING] 📊 체크: ${secondsElapsed}초 경과`)

      // 30초마다 무조건 실행
      if (timeSinceLastProcess >= 30000) {
        logger.log(`[EMBEDDING] 🎯 30초 경과! 임베딩 생성 시작`)
        generateEmbeddings()
      }
    }

    // 5초마다 체크
    timerRef.current = setInterval(checkAndGenerate, 5000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording, lectureId, lastProcessedTime, generateEmbeddings])

  return {
    isGenerating,
    generateEmbeddings,
  }
}
