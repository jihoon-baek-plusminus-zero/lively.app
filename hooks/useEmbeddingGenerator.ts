import { useEffect, useRef, useState, useCallback } from 'react'

interface UseEmbeddingGeneratorProps {
  lectureId: string | null
  isRecording: boolean
  savedCaptionsCount: number
}

export function useEmbeddingGenerator({
  lectureId,
  isRecording,
  savedCaptionsCount,
}: UseEmbeddingGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastProcessedCount, setLastProcessedCount] = useState(0)
  const [lastProcessedTime, setLastProcessedTime] = useState(Date.now())
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const generateEmbeddings = useCallback(async () => {
    if (!lectureId || isGenerating) return

    console.log('[EMBEDDING] 🚀 임베딩 생성 시작...')
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
        console.log(`[EMBEDDING] ✅ 임베딩 생성 완료: ${data.count}개 생성 (${duration}ms 소요)`)
        setLastProcessedCount(savedCaptionsCount)
        setLastProcessedTime(Date.now())
      } else {
        console.error('[EMBEDDING] ❌ 임베딩 생성 실패:', response.status)
      }
    } catch (error) {
      console.error('[EMBEDDING] ❌ 임베딩 생성 에러:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [lectureId, isGenerating, savedCaptionsCount])

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
      const captionsSinceLastProcess = savedCaptionsCount - lastProcessedCount

      // 조건 1: 15초 경과 (15,000ms)
      const fifteenSecondsPassed = timeSinceLastProcess >= 15000

      // 조건 2: 5문장 이상 저장됨
      const fiveSentencesReached = captionsSinceLastProcess >= 5

      console.log(`[EMBEDDING] 📊 체크: ${captionsSinceLastProcess}문장, ${Math.floor(timeSinceLastProcess / 1000)}초 경과`)

      // 두 조건 중 더 긴 것이 만족되면 실행
      // 즉, 5문장이 먼저 채워져도 15초를 기다리고,
      // 15초가 먼저 됐어도 5문장이 안되면 5문장까지 기다림
      if (fifteenSecondsPassed && fiveSentencesReached) {
        console.log(`[EMBEDDING] 🎯 트리거 조건 충족! (${captionsSinceLastProcess}문장, ${Math.floor(timeSinceLastProcess / 1000)}초)`)
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
  }, [isRecording, lectureId, savedCaptionsCount, lastProcessedCount, lastProcessedTime, generateEmbeddings])

  return {
    isGenerating,
    generateEmbeddings,
  }
}
