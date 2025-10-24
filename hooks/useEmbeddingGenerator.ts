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

    setIsGenerating(true)
    try {
      const response = await fetch('/api/embeddings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`Embeddings generated: ${data.count} new embeddings`)
        setLastProcessedCount(savedCaptionsCount)
        setLastProcessedTime(Date.now())
      } else {
        console.error('Failed to generate embeddings')
      }
    } catch (error) {
      console.error('Embedding generation error:', error)
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

      // 조건 1: 1분 경과 (60,000ms)
      const oneMinutePassed = timeSinceLastProcess >= 60000

      // 조건 2: 5문장 이상 저장됨
      const fiveSentencesReached = captionsSinceLastProcess >= 5

      // 두 조건 중 더 긴 것이 만족되면 실행
      // 즉, 5문장이 먼저 채워져도 1분을 기다리고,
      // 1분이 먼저 됐어도 5문장이 안되면 5문장까지 기다림
      if (oneMinutePassed && fiveSentencesReached) {
        console.log(`Generating embeddings: ${captionsSinceLastProcess} captions, ${Math.floor(timeSinceLastProcess / 1000)}s passed`)
        generateEmbeddings()
      }
    }

    // 10초마다 체크
    timerRef.current = setInterval(checkAndGenerate, 10000)

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
