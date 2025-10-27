import { useState, useRef, useCallback } from 'react'
import { logger } from '@/lib/logger'

export interface UseAudioRecorderReturn {
  isRecording: boolean
  startRecording: (deviceId?: string) => Promise<MediaStream | null>
  stopRecording: () => Promise<Blob | null>
  pauseRecording: () => void
  resumeRecording: () => void
  audioStream: MediaStream | null
  error: string | null
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async (deviceId?: string): Promise<MediaStream | null> => {
    try {
      setError(null)
      audioChunksRef.current = [] // 녹음 청크 초기화

      logger.log('🎤 마이크 권한 요청...', deviceId ? `Device: ${deviceId}` : 'Default device')

      // 마이크 권한 요청
      const audioConstraints: MediaTrackConstraints = {
        channelCount: 1, // 모노
        sampleRate: 16000, // Deepgram 권장
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }

      // deviceId가 지정된 경우 해당 디바이스 사용
      if (deviceId) {
        audioConstraints.deviceId = { exact: deviceId }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      })

      audioStreamRef.current = stream

      // 오디오 저장을 위한 MediaRecorder 생성
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // 1초마다 데이터 수집

      setIsRecording(true)

      logger.log('✅ 오디오 스트림 획득 성공:', stream.id)
      logger.log('🎙️ MediaRecorder 녹음 시작')
      return stream
    } catch (err: any) {
      logger.error('❌ 마이크 접근 오류:', err)
      setError(
        err.name === 'NotAllowedError'
          ? '마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.'
          : '마이크에 접근할 수 없습니다.'
      )
      return null
    }
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      logger.log('⏸️ MediaRecorder 일시정지')
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      logger.log('▶️ MediaRecorder 재개')
    }
  }, [])

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          logger.log('💾 오디오 Blob 생성:', audioBlob.size, 'bytes')

          // 스트림 정리
          if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach((track) => track.stop())
            audioStreamRef.current = null
          }

          mediaRecorderRef.current = null
          audioChunksRef.current = []
          setIsRecording(false)
          logger.log('🛑 오디오 녹음 중지')

          resolve(audioBlob)
        }

        mediaRecorderRef.current.stop()
      } else {
        // 이미 중지된 경우
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop())
          audioStreamRef.current = null
        }
        setIsRecording(false)
        resolve(null)
      }
    })
  }, [])

  return {
    isRecording,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    audioStream: audioStreamRef.current,
    error,
  }
}
