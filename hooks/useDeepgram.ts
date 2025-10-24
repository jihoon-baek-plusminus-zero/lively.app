import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk'

export interface Caption {
  id: string
  text: string
  isFinal: boolean
  timestamp: string
  speaker?: string
}

export interface UseDeepgramReturn {
  captions: Caption[]
  isConnected: boolean
  error: string | null
  connect: (stream: MediaStream, languages?: string[]) => Promise<void>
  disconnect: () => void
}

export function useDeepgram(): UseDeepgramReturn {
  const [captions, setCaptions] = useState<Caption[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deepgramRef = useRef<any>(null)
  const connectionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const connect = useCallback(async (stream: MediaStream, languages: string[] = ['ko']) => {
    try {
      setError(null)

      const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY

      if (!apiKey) {
        throw new Error('Deepgram API 키가 설정되지 않았습니다')
      }

      console.log('🔑 Deepgram API 키 확인됨')

      // Deepgram 클라이언트 생성
      const deepgram = createClient(apiKey)
      deepgramRef.current = deepgram

      console.log('📡 Deepgram 클라이언트 생성 완료')

      // Live Transcription 연결
      const languageCode = languages[0] || 'ko'

      // Deepgram 설정 객체
      const liveOptions: any = {
        model: 'nova-2',
        language: languageCode, // 'multi' 또는 'ko', 'en', 'ja', 'zh', 'es'
        smart_format: true,
        punctuate: true,
        interim_results: true, // 중간 결과 포함
        utterance_end_ms: 1000,
        vad_events: true,
      }

      const connection = deepgram.listen.live(liveOptions)

      console.log(`🌍 언어 설정: ${languageCode === 'multi' ? '다국어 자동감지' : languageCode}`)

      connectionRef.current = connection

      console.log('🎧 Live Transcription 설정 완료')

      // 연결 성공
      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log('✅ Deepgram 연결 성공')
        setIsConnected(true)

        // MediaRecorder로 오디오 청크 전송
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm',
        })

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && connection.getReadyState() === 1) {
            connection.send(event.data)
          }
        }

        mediaRecorder.start(250) // 250ms마다 청크 전송
        mediaRecorderRef.current = mediaRecorder
      })

      // 전사 결과 수신
      connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        const transcript = data.channel?.alternatives?.[0]?.transcript

        if (transcript && transcript.trim() !== '') {
          const isFinal = data.is_final
          const now = new Date()
          const timestamp = now.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })

          const newCaption: Caption = {
            id: isFinal ? `final-${Date.now()}` : 'interim',
            text: transcript,
            isFinal,
            timestamp,
            speaker: '교수', // TODO: 화자 인식 추가
          }

          setCaptions((prev) => {
            if (isFinal) {
              // Final 결과는 추가
              return [...prev.filter((c) => c.isFinal), newCaption]
            } else {
              // Interim 결과는 기존 interim 대체
              return [...prev.filter((c) => c.isFinal), newCaption]
            }
          })

          console.log(`${isFinal ? '✅ Final' : '⏳ Interim'}: ${transcript}`)
        }
      })

      // 에러 처리
      connection.on(LiveTranscriptionEvents.Error, (error: any) => {
        console.error('❌ Deepgram 오류:', error)
        setError('실시간 자막 생성 중 오류가 발생했습니다.')
      })

      // 연결 종료
      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log('🔌 Deepgram 연결 종료')
        setIsConnected(false)
      })
    } catch (err: any) {
      console.error('Deepgram 연결 오류:', err)
      setError('Deepgram 연결에 실패했습니다.')
    }
  }, [])

  const disconnect = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }

    if (connectionRef.current) {
      connectionRef.current.finish()
      connectionRef.current = null
    }

    setIsConnected(false)
    console.log('🛑 Deepgram 연결 해제')
  }, [])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    captions,
    isConnected,
    error,
    connect,
    disconnect,
  }
}
