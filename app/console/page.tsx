'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Sidebar from '@/components/console/Sidebar'
import CaptionPanel from '@/components/console/CaptionPanel'
import ChatPanel from '@/components/console/ChatPanel'
import TranslationActivationModal from '@/components/console/TranslationActivationModal'
import { Play, Square, Mic, AlertCircle, Pause, Download, FileText, Loader2, MoreVertical, Edit2, Trash2, Check, X, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { useDeepgram } from '@/hooks/useDeepgram'
import { useLectures, type Lecture } from '@/hooks/useLectures'
import { useCaptions } from '@/hooks/useCaptions'
import { useCaptionsList } from '@/hooks/useCaptionsList'
import { useEmbeddingGenerator } from '@/hooks/useEmbeddingGenerator'
import { useSummaryGenerator } from '@/hooks/useSummaryGenerator'
import { useUserUsage } from '@/hooks/useUserUsage'
import { uploadAudioFile, downloadAudioFile, downloadTranscript } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export default function ConsolePage() {
  const { user, loading } = useAuth()
  const { usage, refetchUsage } = useUserUsage()
  const { t } = useLanguage()
  const router = useRouter()
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null)
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isSavingAudio, setIsSavingAudio] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [translationEnabled, setTranslationEnabled] = useState(false)
  const [translationTargetLang, setTranslationTargetLang] = useState<string>('en')
  const [showTranslationModal, setShowTranslationModal] = useState(false)
  const [realTimeTranslations, setRealTimeTranslations] = useState<Record<string, string>>({})
  const [captionIdMapping, setCaptionIdMapping] = useState<Record<string, string>>({}) // 임시ID -> DB ID 매핑
  const [isSavingTranslations, setIsSavingTranslations] = useState(false) // 번역 저장 중 상태
  const [processedCaptionIds, setProcessedCaptionIds] = useState<Set<string>>(new Set()) // 이미 처리된 자막 ID
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedMicId, setSelectedMicId] = useState<string>('')
  const menuRef = useRef<HTMLDivElement>(null)
  const creditTrackingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileDetail, setShowMobileDetail] = useState(false)
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false)

  // Fullscreen mode state
  const [isFullscreenMode, setIsFullscreenMode] = useState(false)

  // Hooks
  const audioRecorder = useAudioRecorder()
  const deepgram = useDeepgram()
  const { lectures, startLecture, endLecture, updateAudioUrl, updateLectureTitle, updateTranslateTo, deleteLecture, refetch: refetchLectures } = useLectures()
  const { saveCaption, updateCaptionTranslation } = useCaptions()
  const { captions: savedCaptions } = useCaptionsList(selectedLecture?.id || null)

  // 실시간 임베딩 생성 (30초마다)
  const activeRecording = audioRecorder.isRecording && (isPaused || deepgram.isConnected)
  useEmbeddingGenerator({
    lectureId: selectedLecture?.id || null,
    isRecording: activeRecording,
  })

  // 실시간 요약 생성 (100개 캡션마다)
  useSummaryGenerator({
    lectureId: selectedLecture?.id || null,
    isRecording: activeRecording,
    captionCount: savedCaptions.length,
  })

  // 녹음 중: 오디오 녹음 중이고 (일시정지 아니거나 Deepgram 연결됨)
  const isRecording = audioRecorder.isRecording && (isPaused || deepgram.isConnected)
  const isCompleted = selectedLecture?.status === 'completed' || selectedLecture?.status === 'not_recorded'
  // 실제 녹음 진행 중 (일시정지 아님)
  const isActiveRecording = isRecording && !isPaused

  // Breakpoint detection for mobile responsiveness (768px)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')

    const handleMediaQueryChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
      // When switching to desktop, reset mobile detail view
      if (!e.matches) {
        setShowMobileDetail(false)
      }
    }

    // Set initial value
    handleMediaQueryChange(mediaQuery)

    // Listen for changes
    mediaQuery.addEventListener('change', handleMediaQueryChange)

    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange)
    }
  }, [])

  // 페이지 로드 시 녹음 중인 항목 체크 (최초 1회만)
  useEffect(() => {
    const checkActiveRecording = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('lectures')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'recording')
          .limit(1)

        if (error) throw error

        if (data && data.length > 0) {
          logger.log('⚠️ 녹음 중인 항목 발견, multi_warning 페이지로 이동')
          router.push('/multi_warning')
        }
      } catch (error) {
        logger.error('녹음 중인 항목 체크 실패:', error)
      }
    }

    // 세션 스토리지로 이미 체크했는지 확인 (새로고침 시에만 체크)
    const hasChecked = sessionStorage.getItem('recording_checked')
    if (!hasChecked && user) {
      checkActiveRecording()
      sessionStorage.setItem('recording_checked', 'true')
    }
  }, [user, router])

  // Broadcast 채널 리스너 (다른 세션에서 강제 새로고침 명령 수신)
  useEffect(() => {
    if (!user) return

    const channel = supabase.channel('session_control')

    channel
      .on('broadcast', { event: 'force_refresh' }, (payload) => {
        if (payload.payload.userId === user.id) {
          logger.log('🔄 다른 세션에서 강제 새로고침 명령 수신')
          // 세션 체크 플래그 제거 후 새로고침
          sessionStorage.removeItem('recording_checked')
          window.location.reload()
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user])

  // selectedLecture 상태 동기화
  useEffect(() => {
    if (selectedLecture && lectures.length > 0) {
      const updated = lectures.find((l) => l.id === selectedLecture.id)
      if (updated) {
        setSelectedLecture(updated)
      }
    }
  }, [lectures, selectedLecture?.id])

  // 페이지 로드 시 마지막 완료된 강의 자동 선택
  useEffect(() => {
    const lastLectureId = sessionStorage.getItem('lastCompletedLecture')
    if (lastLectureId && lectures.length > 0 && !selectedLecture) {
      const lecture = lectures.find((l) => l.id === lastLectureId)
      if (lecture) {
        setSelectedLecture(lecture)
        sessionStorage.removeItem('lastCompletedLecture')
        logger.log('📋 마지막 완료된 강의 자동 선택:', lecture.title)
      }
    }
  }, [lectures, selectedLecture])

  // 오디오 디바이스 목록 로드
  useEffect(() => {
    const loadAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices.filter(device => device.kind === 'audioinput')
        setAudioDevices(audioInputs)
        logger.log('🎤 사용 가능한 마이크:', audioInputs.length, '개')
        audioInputs.forEach((device, idx) => {
          logger.log(`  ${idx + 1}. ${device.label || `마이크 ${idx + 1}`} (${device.deviceId})`)
        })
      } catch (error) {
        logger.error('오디오 디바이스 목록 로드 실패:', error)
      }
    }

    loadAudioDevices()

    // 디바이스 변경 감지 (플러그/언플러그)
    navigator.mediaDevices.addEventListener('devicechange', loadAudioDevices)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadAudioDevices)
    }
  }, [])

  // 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 녹음 시간 카운터
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActiveRecording && recordingStartTime > 0) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - recordingStartTime) / 1000))
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActiveRecording, recordingStartTime])

  // 크레딧 추적 cleanup (컴포넌트 unmount 시 interval 정리)
  useEffect(() => {
    return () => {
      if (creditTrackingIntervalRef.current) {
        clearInterval(creditTrackingIntervalRef.current)
        creditTrackingIntervalRef.current = null
      }
    }
  }, [])

  // 번역 상태 변경 시 크레딧 추적 재시작 (녹음 중이고 일시정지 상태가 아닐 때만)
  useEffect(() => {
    // 녹음 중이고 일시정지가 아닌 경우에만 interval 재시작
    if (isActiveRecording && !isPaused && creditTrackingIntervalRef.current) {
      logger.log('🔄 번역 상태 변경 감지! 크레딧 추적 재시작 - 새 번역 상태:', translationEnabled)
      startCreditTracking()
    }
  }, [translationEnabled])

  // 시간 포맷팅 (HH:MM:SS)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // 로그인하지 않은 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  // 강의 선택 시 번역 설정 자동 적용
  useEffect(() => {
    if (selectedLecture) {
      if (selectedLecture.translate_to) {
        setTranslationEnabled(true)
        setTranslationTargetLang(selectedLecture.translate_to)
      } else {
        setTranslationEnabled(false)
      }
    }
  }, [selectedLecture])


  // Final 자막을 Supabase에 저장 (한 번만 + 번역 동시 처리)
  useEffect(() => {
    if (!selectedLecture) return

    const finalCaptions = deepgram.captions.filter((c) => c.isFinal)

    // 새로운 자막만 처리 (중복 방지)
    const newCaptions = finalCaptions.filter(c => !processedCaptionIds.has(c.id))

    newCaptions.forEach(async (caption) => {
      // 중복 방지: 이미 처리된 것으로 표시
      setProcessedCaptionIds(prev => {
        const newSet = new Set(prev)
        newSet.add(caption.id)
        return newSet
      })

      // 녹음 시작 이후 경과 시간 계산
      const elapsedSeconds = recordingStartTime > 0
        ? (Date.now() - recordingStartTime) / 1000
        : 0

      logger.log('🎯 새 자막 처리 시작:', caption.id, caption.text.substring(0, 30))

      try {
        let translatedText: string | undefined = undefined

        // 번역이 활성화된 경우 먼저 번역 수행
        if (translationEnabled && translationTargetLang) {
          logger.log('🌐 번역 API 호출:', caption.text.substring(0, 30))

          try {
            const response = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: caption.text,
                targetLang: translationTargetLang
              }),
            })

            if (response.ok) {
              const data = await response.json()
              translatedText = data.translatedText
              logger.log('✅ 번역 완료:', translatedText?.substring(0, 30))

              // UI에 번역 즉시 표시
              setRealTimeTranslations(prev => ({
                ...prev,
                [caption.id]: translatedText!
              }))
            } else {
              logger.warn('⚠️ 번역 API 응답 실패:', response.status)
            }
          } catch (error) {
            logger.error('❌ 번역 API 오류:', error)
          }
        }

        // 자막과 번역을 동시에 저장
        logger.log('💾 자막 저장 (번역 포함):', {
          text: caption.text.substring(0, 30),
          translated: translatedText ? translatedText.substring(0, 30) : '없음'
        })

        const dbCaptionId = await saveCaption(
          selectedLecture.id,
          caption.text,
          elapsedSeconds,
          caption.speaker,
          translatedText // 번역과 함께 저장
        )

        if (dbCaptionId) {
          logger.log('✅ 자막 DB 저장 완료:', dbCaptionId, '번역 여부:', !!translatedText)

          // ID 매핑 저장 (나중에 필요한 경우를 위해)
          setCaptionIdMapping(prev => ({
            ...prev,
            [caption.id]: dbCaptionId
          }))
        }
      } catch (error) {
        logger.error('❌ 자막 처리 실패:', caption.id, error)
      }
    })
  }, [deepgram.captions, selectedLecture, saveCaption, recordingStartTime, translationEnabled, translationTargetLang])

  // 녹음 시작
  // 녹음 중 마이크 변경 핸들러
  const handleMicrophoneChange = async (newMicId: string) => {
    setSelectedMicId(newMicId)

    // 녹음 중이면 일시정지 → 마이크 변경 → 재개
    if (isRecording && selectedLecture) {
      logger.log('🔄 마이크 변경 프로세스 시작... 새 디바이스:', newMicId || 'default')

      // 현재 일시정지 상태 저장
      const wasRecording = !isPaused

      try {
        // 1. 녹음 중이었다면 기존 일시정지 로직 실행
        if (wasRecording) {
          logger.log('⏸️ 마이크 변경을 위해 일시정지')
          deepgram.disconnect()
          audioRecorder.pauseRecording()
          setIsPaused(true)
        }

        // 2. 오디오 스트림 중지
        logger.log('🛑 기존 오디오 스트림 중지')
        await audioRecorder.stopRecording()

        // 3. 새 마이크로 녹음 시작
        logger.log('🎤 새 마이크로 스트림 시작:', newMicId || 'default')
        const newStream = await audioRecorder.startRecording(newMicId || undefined)

        if (!newStream) {
          throw new Error('새 마이크 스트림을 가져올 수 없습니다')
        }

        // 4. 원래 녹음 중이었다면 기존 재개 로직 실행
        if (wasRecording) {
          logger.log('▶️ 마이크 변경 완료, 녹음 재개')
          const audioLanguages = selectedLecture.audio_languages || ['ko']
          await deepgram.connect(newStream, audioLanguages)
          audioRecorder.resumeRecording()
          setIsPaused(false)
        }

        logger.log('✅ 마이크 변경 완료')
      } catch (error) {
        logger.error('❌ 마이크 변경 실패:', error)
        alert('마이크 변경에 실패했습니다. 녹음을 중지하고 다시 시작해주세요.')
      }
    }
  }

  // 크레딧 추적 시작 (1초마다 크레딧 차감)
  const startCreditTracking = () => {
    // 기존 interval이 있다면 정리
    if (creditTrackingIntervalRef.current) {
      clearInterval(creditTrackingIntervalRef.current)
    }

    logger.log('🎬 크레딧 추적 시작 - 번역 상태:', translationEnabled)

    creditTrackingIntervalRef.current = setInterval(async () => {
      if (!user) return

      // 번역이 켜져있으면 2초 차감, 아니면 1초 차감
      const secondsToDeduct = translationEnabled ? 2 : 1

      logger.log(`⏱️ 크레딧 차감 중... | 차감량: ${secondsToDeduct}초 | 번역 상태: ${translationEnabled ? 'ON' : 'OFF'}`)

      try {
        const { data, error } = await supabase.rpc('increment_recording_usage', {
          p_user_id: user.id,
          p_seconds: secondsToDeduct
        })

        logger.log('[Recording Usage] RPC Response:', data)
        logger.log('[Recording Usage] RPC Error:', error)

        if (error) throw error

        // 서버에서 반환된 데이터 확인 (새 형식)
        if (data) {
          const {
            seconds_used,
            seconds_from_monthly,
            seconds_from_purchased,
            monthly_used,
            monthly_quota,
            monthly_remaining,
            purchased_remaining
          } = data

          const totalRemaining = (monthly_remaining || 0) + (purchased_remaining || 0)

          logger.log(`✅ 크레딧 차감 완료 | 차감: ${seconds_used}초 (월별:${seconds_from_monthly}초, 추가구매:${seconds_from_purchased}초) | 잔여: 월별 ${monthly_remaining}초 + 추가구매 ${purchased_remaining}초 = 총 ${totalRemaining}초`)

          // 크레딧 부족 시 자동 정지
          if (totalRemaining <= 0) {
            logger.warn('⚠️ 녹음 크레딧 소진! 자동 정지합니다.')
            alert('녹음 가능 시간이 모두 소진되었습니다. 녹음을 중지합니다.')

            // 크레딧 추적 중지
            if (creditTrackingIntervalRef.current) {
              clearInterval(creditTrackingIntervalRef.current)
              creditTrackingIntervalRef.current = null
            }

            // 녹음 중지
            await handleStopRecording()

            // UI 업데이트
            await refetchUsage()
          }
        }
      } catch (err) {
        logger.error('❌ 크레딧 차감 실패:', err)
        // 에러 발생 시에도 크레딧 추적 중지
        if (creditTrackingIntervalRef.current) {
          clearInterval(creditTrackingIntervalRef.current)
          creditTrackingIntervalRef.current = null
        }
      }
    }, 1000) // 1초마다 실행
  }

  const handleStartRecording = async () => {
    if (!selectedLecture) {
      alert(t('console.alert.select.lecture'))
      return
    }

    // 녹음 시작 전 크레딧 확인
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      // 크레딧 확인: 최소 1초 이상 있어야 녹음 시작 가능
      const { data: creditCheck, error: creditError } = await supabase.rpc('check_recording_time', {
        p_user_id: user.id,
        p_required_seconds: 1
      })

      logger.log('[Recording Credit Check] Response:', creditCheck)
      logger.log('[Recording Credit Check] Error:', creditError)

      if (creditError) throw creditError

      if (!creditCheck || !creditCheck.has_enough_time) {
        logger.log('[Recording Credit Check] Insufficient credits:', {
          has_enough_time: creditCheck?.has_enough_time,
          monthly_remaining: creditCheck?.monthly_remaining,
          purchased_remaining: creditCheck?.purchased_remaining,
          total_available: creditCheck?.total_available,
          required: creditCheck?.required
        })
        alert(`녹음 가능 시간이 부족합니다.\n월별 잔여: ${creditCheck?.monthly_remaining || 0}초\n추가구매 잔여: ${creditCheck?.purchased_remaining || 0}초\n총 사용 가능: ${creditCheck?.total_available || 0}초`)
        return
      }

      logger.log('✅ 크레딧 확인 완료:', {
        monthly_remaining: creditCheck.monthly_remaining,
        purchased_remaining: creditCheck.purchased_remaining,
        total_available: creditCheck.total_available
      })
    } catch (err) {
      logger.error('크레딧 확인 실패:', err)
      alert('녹음 크레딧을 확인하는 중 오류가 발생했습니다.')
      return
    }

    logger.log('🎬 녹음 시작 프로세스 시작...')

    // 실시간 번역 데이터, ID 매핑, 처리된 자막 초기화
    setRealTimeTranslations({})
    setCaptionIdMapping({})
    setProcessedCaptionIds(new Set())

    try {
      // 1. 오디오 녹음 시작 (선택된 마이크로 스트림 직접 반환)
      const stream = await audioRecorder.startRecording(selectedMicId || undefined)

      if (!stream) {
        throw new Error('오디오 스트림을 가져올 수 없습니다')
      }

      logger.log('📡 Deepgram 연결 시작...')

      // 2. Deepgram 연결 (강의의 언어 설정 사용, 없으면 기본값)
      const audioLanguages = selectedLecture.audio_languages || ['ko']
      await deepgram.connect(stream, audioLanguages)

      logger.log('✅ Deepgram 연결 완료')

      // 3. 강의 상태를 'recording'으로 변경
      await startLecture(selectedLecture.id)

      // 4. 녹음 시작 시간 기록
      setRecordingStartTime(Date.now())

      // 5. 크레딧 추적 시작
      startCreditTracking()

      logger.log('🎉 모든 설정 완료! 녹음 시작!')
    } catch (error) {
      logger.error('❌ 녹음 시작 실패:', error)
      // 실패 시 정리
      audioRecorder.stopRecording()
      deepgram.disconnect()

      // 크레딧 추적도 중지
      if (creditTrackingIntervalRef.current) {
        clearInterval(creditTrackingIntervalRef.current)
        creditTrackingIntervalRef.current = null
      }
    }
  }

  // 일시정지/재개
  const handlePauseResume = async () => {
    if (isPaused) {
      // 재개: Deepgram 재연결 + MediaRecorder 재개
      logger.log('▶️ 녹음 재개 - Deepgram 재연결 + MediaRecorder 재개')
      if (audioRecorder.audioStream && selectedLecture) {
        const audioLanguages = selectedLecture.audio_languages || ['ko']
        await deepgram.connect(audioRecorder.audioStream, audioLanguages)
        audioRecorder.resumeRecording()
        logger.log('✅ Deepgram 재연결 및 MediaRecorder 재개 완료')
      }

      // 크레딧 추적 재개
      logger.log('▶️ 크레딧 추적 재개')
      startCreditTracking()

      setIsPaused(false)
    } else {
      // 일시정지: Deepgram 연결 끊기 + MediaRecorder 일시정지
      logger.log('⏸️ 녹음 일시정지 - Deepgram 연결 해제 + MediaRecorder 일시정지')
      deepgram.disconnect()
      audioRecorder.pauseRecording()
      logger.log('✅ Deepgram 연결 해제 및 MediaRecorder 일시정지 완료')

      // 크레딧 추적 일시정지
      logger.log('⏸️ 크레딧 추적 일시정지')
      if (creditTrackingIntervalRef.current) {
        clearInterval(creditTrackingIntervalRef.current)
        creditTrackingIntervalRef.current = null
      }

      setIsPaused(true)
    }
  }

  // 녹음 종료
  const handleStopRecording = async () => {
    if (!selectedLecture || !user) return

    setIsSavingAudio(true)

    // 크레딧 추적 중지
    if (creditTrackingIntervalRef.current) {
      clearInterval(creditTrackingIntervalRef.current)
      creditTrackingIntervalRef.current = null
    }

    try {
      logger.log('🛑 녹음 종료 프로세스 시작...')

      // 0. 녹음 종료 전 아직 저장되지 않은 임시 자막(isFinal = false) 저장
      const pendingCaptions = deepgram.captions.filter(c => !c.isFinal && !processedCaptionIds.has(c.id))

      if (pendingCaptions.length > 0) {
        logger.log(`📝 저장되지 않은 임시 자막 ${pendingCaptions.length}개 발견, 저장 시작...`)

        for (const caption of pendingCaptions) {
          // 중복 방지: 이미 처리된 것으로 표시
          setProcessedCaptionIds(prev => {
            const newSet = new Set(prev)
            newSet.add(caption.id)
            return newSet
          })

          // 녹음 시작 이후 경과 시간 계산
          const elapsedSeconds = recordingStartTime > 0
            ? (Date.now() - recordingStartTime) / 1000
            : 0

          logger.log('💾 임시 자막 저장:', caption.text.substring(0, 30))

          try {
            let translatedText: string | undefined = undefined

            // 번역이 활성화된 경우 번역 수행
            if (translationEnabled && translationTargetLang) {
              logger.log('🌐 임시 자막 번역 API 호출:', caption.text.substring(0, 30))

              try {
                const response = await fetch('/api/translate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    text: caption.text,
                    targetLang: translationTargetLang
                  }),
                })

                if (response.ok) {
                  const data = await response.json()
                  translatedText = data.translatedText
                  logger.log('✅ 임시 자막 번역 완료:', translatedText?.substring(0, 30))
                } else {
                  logger.warn('⚠️ 임시 자막 번역 API 응답 실패:', response.status)
                }
              } catch (error) {
                logger.error('❌ 임시 자막 번역 API 오류:', error)
              }
            }

            // 자막과 번역 저장
            const dbCaptionId = await saveCaption(
              selectedLecture.id,
              caption.text,
              elapsedSeconds,
              caption.speaker,
              translatedText
            )

            if (dbCaptionId) {
              logger.log('✅ 임시 자막 DB 저장 완료:', dbCaptionId, '번역 여부:', !!translatedText)
            }
          } catch (error) {
            logger.error('❌ 임시 자막 저장 실패:', error)
          }
        }

        logger.log('✅ 모든 임시 자막 저장 완료')
      } else {
        logger.log('✅ 저장할 임시 자막 없음')
      }

      // 1. Deepgram 연결 해제
      deepgram.disconnect()

      // 2. 오디오 녹음 중지 및 Blob 가져오기
      const audioBlob = await audioRecorder.stopRecording()

      // 번역은 이미 실시간으로 자막과 함께 저장되었으므로 추가 저장 불필요
      logger.log('✅ 모든 자막과 번역이 실시간으로 저장됨')

      // 3. 오디오 파일 업로드
      if (audioBlob) {
        logger.log('📤 오디오 파일 업로드 중...')
        const audioUrl = await uploadAudioFile(selectedLecture.id, audioBlob, user.id)

        if (audioUrl) {
          // 오디오 URL 데이터베이스에 저장
          await updateAudioUrl(selectedLecture.id, audioUrl)
          logger.log('✅ 오디오 파일 저장 완료:', audioUrl)
        }
      }

      // 5. 강의 상태를 'completed'로 변경
      await endLecture(selectedLecture.id)

      // 5. 강의 목록 새로고침
      await refetchLectures()

      // 6. 상태 초기화
      setRecordingStartTime(0)
      setElapsedTime(0)
      setIsPaused(false)

      logger.log('✅ 녹음 종료 완료 - 3초 후 페이지 새로고침')

      // 7. 3초 대기 후 강의 ID를 URL에 저장하고 페이지 새로고침
      await new Promise(resolve => setTimeout(resolve, 3000))

      sessionStorage.setItem('lastCompletedLecture', selectedLecture.id)
      window.location.reload()
    } catch (error) {
      logger.error('❌ 녹음 종료 실패:', error)
      setIsSavingAudio(false)
    }
  }

  // 음성 다운로드
  const handleDownloadAudio = async () => {
    if (!selectedLecture?.audio_file_url) {
      alert(t('console.alert.no.audio'))
      return
    }

    try {
      const fileName = `${selectedLecture.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.webm`
      await downloadAudioFile(selectedLecture.audio_file_url, fileName)
    } catch (error) {
      logger.error('음성 다운로드 실패:', error)
      alert(t('console.alert.audio.download.failed'))
    }
  }

  // 대본 다운로드
  const handleDownloadTranscript = () => {
    if (savedCaptions.length === 0) {
      alert(t('console.alert.no.transcript'))
      return
    }

    try {
      const fileName = `${selectedLecture?.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_대본.txt`
      downloadTranscript(savedCaptions, fileName)
    } catch (error) {
      logger.error('대본 다운로드 실패:', error)
      alert(t('console.alert.transcript.download.failed'))
    }
  }

  // 제목 수정 시작
  const handleEditTitle = () => {
    if (selectedLecture) {
      setEditedTitle(selectedLecture.title)
      setIsEditingTitle(true)
      setShowMenu(false)
    }
  }

  // 제목 수정 저장
  const handleSaveTitle = async () => {
    if (selectedLecture && editedTitle.trim()) {
      await updateLectureTitle(selectedLecture.id, editedTitle.trim())
      setIsEditingTitle(false)
    }
  }

  // 제목 수정 취소
  const handleCancelEdit = () => {
    setIsEditingTitle(false)
    setEditedTitle('')
  }

  // 제목 더블클릭
  const handleTitleDoubleClick = () => {
    if (selectedLecture && !isRecording) {
      setEditedTitle(selectedLecture.title)
      setIsEditingTitle(true)
    }
  }

  // 강의 삭제
  const handleDeleteLecture = async () => {
    if (selectedLecture && confirm(t('console.delete.confirm'))) {
      await deleteLecture(selectedLecture.id)
      setSelectedLecture(null)
      setShowMenu(false)
    }
  }

  // 새 강의 생성 핸들러
  const handleCreateLecture = (lecture: Lecture) => {
    setSelectedLecture(lecture)
    // On mobile, show detail view when new lecture is created
    if (isMobile) {
      setShowMobileDetail(true)
    }
  }

  // 강의 선택 핸들러
  const handleSelectLecture = (lectureId: string) => {
    const lecture = lectures.find((l) => l.id === lectureId)
    if (lecture) {
      setSelectedLecture(lecture)
      logger.log('📋 강의 선택:', lecture.title, '(상태:', lecture.status, ')')

      // On mobile, show detail view when lecture is selected
      if (isMobile) {
        setShowMobileDetail(true)
      }
    }
  }

  // Mobile back button handler
  const handleMobileBack = () => {
    setShowMobileDetail(false)
  }

  // 번역 토글 핸들러 (비활성화 상태에서만 모달 띄움)
  const handleTranslationToggle = (enabled: boolean) => {
    if (!selectedLecture) return

    // 이미 번역이 설정되어 있으면 변경 불가
    if (selectedLecture.translate_to) return

    // 번역을 켜려고 하면 모달 표시
    if (enabled) {
      setShowTranslationModal(true)
    }
  }

  // 번역 완료 콜백 - CaptionPanel에서 번역 완료 시 호출됨 (메모리에만 저장)
  const handleTranslationComplete = (captionId: string, translatedText: string) => {
    logger.log('🔄 번역 완료 (메모리 저장):', captionId, '→', translatedText.substring(0, 30))

    // 실시간 번역 상태 업데이트 (메모리에만 저장, DB 저장은 녹음 종료 시)
    setRealTimeTranslations(prev => ({
      ...prev,
      [captionId]: translatedText
    }))
  }

  // 일괄 번역 완료 콜백 - 완료된 강의 번역 시
  const handleBulkTranslationComplete = async (translations: Record<string, string>) => {
    logger.log('💾 완료된 강의 번역 일괄 저장 시작...')
    setIsSavingTranslations(true)

    try {
      // 모든 번역 업데이트 실행
      const updates = Object.entries(translations).map(([captionId, translatedText]) =>
        updateCaptionTranslation(captionId, translatedText)
      )

      await Promise.all(updates)
      logger.log('✅ 번역 일괄 저장 완료:', updates.length, '개')
    } catch (error) {
      logger.error('❌ 번역 저장 실패:', error)
    } finally {
      setIsSavingTranslations(false)
    }
  }

  // 번역 활성화 확인 핸들러
  const handleConfirmTranslation = async (targetLang: string) => {
    if (!selectedLecture) return

    await updateTranslateTo(selectedLecture.id, targetLang)
    setTranslationEnabled(true)
    setTranslationTargetLang(targetLang)
    setShowTranslationModal(false)

    // selectedLecture 업데이트
    setSelectedLecture({
      ...selectedLecture,
      translate_to: targetLang
    })
  }

  // 로딩 중이거나 사용자가 없으면 로딩 화면
  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary dark:bg-[#3B82F6] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">{t('console.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Mobile Layout */}
      {isMobile ? (
        showMobileDetail && selectedLecture ? (
          /* Mobile Detail View - Fullscreen with back button */
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
            {/* Mobile Header with Back Button (전체화면 모드에서는 숨김) */}
            {!isFullscreenMode && (
            <header className="bg-white dark:bg-[#202020] border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={handleMobileBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* 전체화면 모드에서는 livey_icon.png, 아니면 icon.png */}
                  <div className="w-6 h-6 flex-shrink-0">
                    <Image
                      src={isFullscreenMode ? "/livey_icon.png" : "/icon.png"}
                      alt="Livey Icon"
                      width={24}
                      height={24}
                      className="w-full h-full"
                    />
                  </div>
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTitle()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveTitle}
                        className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 bg-gray-500 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <h1
                      className="text-base font-bold text-gray-800 dark:text-gray-200 truncate"
                      onDoubleClick={handleTitleDoubleClick}
                    >
                      {selectedLecture.title}
                    </h1>
                  )}
                  {selectedLecture && !isEditingTitle && (
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenu(!showMenu)
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                      {showMenu && (
                        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                          <button
                            onClick={handleEditTitle}
                            className="w-full px-4 py-2 text-left text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            {t('console.menu.edit')}
                          </button>
                          <button
                            onClick={handleDeleteLecture}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            {t('console.menu.delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Recording Controls - Mobile */}
              <div className="flex flex-wrap items-center gap-2">
                {!isCompleted && !isSavingAudio && (
                  <select
                    value={selectedMicId}
                    onChange={(e) => handleMicrophoneChange(e.target.value)}
                    disabled={!selectedLecture}
                    className="flex-1 min-w-[120px] px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{t('console.microphone.default')}</option>
                    {audioDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `${t('console.microphone.label')} ${device.deviceId.substring(0, 8)}`}
                      </option>
                    ))}
                  </select>
                )}

                {!isRecording && !isCompleted && !isSavingAudio && (
                  <button
                    onClick={handleStartRecording}
                    disabled={!selectedLecture || audioRecorder.isRecording || deepgram.isConnected}
                    className="flex-1 px-3 py-1.5 text-xs bg-primary dark:bg-[#3B82F6] hover:bg-primary-600 dark:hover:bg-blue-500 text-white rounded font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-3 h-3" />
                    {t('console.button.start.recording')}
                  </button>
                )}

                {isRecording && (
                  <>
                    <button
                      onClick={handlePauseResume}
                      className="flex-1 px-3 py-1.5 text-xs bg-yellow-500 text-white rounded font-medium transition-all flex items-center justify-center gap-1.5"
                    >
                      {isPaused ? (
                        <>
                          <Play className="w-3 h-3" />
                          {t('console.button.resume')}
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3" />
                          {t('console.button.pause')}
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleStopRecording}
                      className="flex-1 px-3 py-1.5 text-xs bg-red-500 text-white rounded font-medium transition-all flex items-center justify-center gap-1.5"
                    >
                      <Square className="w-3 h-3" />
                      {t('console.button.stop.recording')}
                    </button>
                  </>
                )}

                {isSavingAudio ? (
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                    <span className="text-gray-600 dark:text-gray-400 text-xs">{t('console.status.saving')}</span>
                  </div>
                ) : (
                  isCompleted && (
                    <>
                      {selectedLecture.status === 'not_recorded' ? (
                        <div className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-300">
                          {t('console.audio.not.saved')}
                        </div>
                      ) : (
                        selectedLecture.audio_file_url && (
                          <button
                            onClick={handleDownloadAudio}
                            className="flex-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded font-medium transition-all flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-3 h-3" />
                            {t('console.button.download.audio')}
                          </button>
                        )
                      )}
                      <button
                        onClick={handleDownloadTranscript}
                        disabled={savedCaptions.length === 0}
                        className="flex-1 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileText className="w-3 h-3" />
                        {t('console.button.download.transcript')}
                      </button>
                    </>
                  )
                )}
              </div>

              {/* Recording Status - Mobile */}
              {isRecording && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    {isPaused ? (
                      <>
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">{t('console.status.paused')}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">{t('console.status.recording')}</span>
                      </>
                    )}
                  </div>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">
                    {formatTime(elapsedTime)}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {deepgram.captions.filter((c) => c.isFinal).length} {t('console.status.captions')}
                  </span>
                </div>
              )}

              {/* Error Messages - Mobile */}
              {(audioRecorder.error || deepgram.error) && (
                <div className="mt-2 flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800 dark:text-red-300">
                    {audioRecorder.error || deepgram.error}
                  </p>
                </div>
              )}
            </header>
            )}

            {/* Mobile Vertical Stack - CaptionPanel (top) + ChatPanel (bottom) */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className={isFullscreenMode ? "h-full overflow-hidden" : "h-[50%] min-h-0 overflow-hidden"}>
                <CaptionPanel
                  isRecording={isActiveRecording}
                  isCompleted={isCompleted}
                  captions={deepgram.captions}
                  savedCaptions={savedCaptions}
                  translationEnabled={translationEnabled}
                  translationTargetLang={translationTargetLang}
                  onTranslationToggle={handleTranslationToggle}
                  onTranslationTargetChange={setTranslationTargetLang}
                  onTranslationComplete={isCompleted ? undefined : handleTranslationComplete}
                  onBulkTranslationComplete={handleBulkTranslationComplete}
                  realTimeTranslations={realTimeTranslations}
                  isFullscreenMode={isFullscreenMode}
                  onToggleFullscreen={() => setIsFullscreenMode(!isFullscreenMode)}
                />
              </div>
              {!isFullscreenMode && (
                <div className="h-[50%] min-h-0 overflow-hidden border-t border-gray-200 dark:border-gray-700">
                  <ChatPanel lectureId={selectedLecture.id} />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Mobile Lecture List - Fullscreen */
          <div className="w-full h-full overflow-hidden">
            <Sidebar
              selectedLectureId={selectedLecture?.id || null}
              onSelectLecture={handleSelectLecture}
              onCreateLecture={handleCreateLecture}
            />
          </div>
        )
      ) : (
        /* Desktop Layout */
        <>
          {/* Left Sidebar - 강의 리스트 (전체화면 모드에서는 숨김) */}
          {!isFullscreenMode && (
            <Sidebar
              selectedLectureId={selectedLecture?.id || null}
              onSelectLecture={handleSelectLecture}
              onCreateLecture={handleCreateLecture}
              isCollapsed={isDesktopSidebarCollapsed}
              onToggleCollapse={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            />
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
        {/* Top Header (전체화면 모드에서는 숨김) */}
        {!isFullscreenMode && (
        <header className="bg-white dark:bg-[#202020] border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {/* 전체화면 모드에서 livey_icon.png 표시 */}
                {isFullscreenMode && (
                  <div className="w-8 h-8 flex-shrink-0">
                    <Image
                      src="/livey_icon.png"
                      alt="Livey"
                      width={32}
                      height={32}
                      className="w-full h-full"
                    />
                  </div>
                )}

                {/* 제목 (편집 모드 / 일반 모드) */}
                {isEditingTitle && selectedLecture ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      className="px-3 py-1 border border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveTitle}
                      className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 bg-gray-500 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <h1
                    className="text-xl font-bold text-gray-800 dark:text-gray-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    onDoubleClick={handleTitleDoubleClick}
                    title={selectedLecture && !isRecording ? t('console.edit.double.click') : ''}
                  >
                    {selectedLecture?.title || t('console.select.lecture')}
                  </h1>
                )}

                {/* 세 점 메뉴 */}
                {selectedLecture && !isEditingTitle && (
                  <div className="relative ml-2" ref={menuRef}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(!showMenu)
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>

                    {showMenu && (
                      <div className="absolute left-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                        <button
                          onClick={handleEditTitle}
                          className="w-full px-4 py-2 text-left text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          {t('console.menu.edit')}
                        </button>
                        <button
                          onClick={handleDeleteLecture}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('console.menu.delete')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recording Controls */}
            <div className="flex items-center gap-3">
              {/* Microphone Selection Dropdown - 항상 표시 */}
              {!isCompleted && !isSavingAudio && (
                <select
                  value={selectedMicId}
                  onChange={(e) => handleMicrophoneChange(e.target.value)}
                  disabled={!selectedLecture}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:border-gray-400 dark:hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {t('console.microphone.default')}
                  </option>
                  {audioDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `${t('console.microphone.label')} ${device.deviceId.substring(0, 8)}`}
                    </option>
                  ))}
                </select>
              )}

              {!isRecording && !isCompleted && !isSavingAudio && (
                <button
                  onClick={handleStartRecording}
                  disabled={!selectedLecture || audioRecorder.isRecording || deepgram.isConnected}
                  className="px-4 py-2 bg-primary dark:bg-[#3B82F6] hover:bg-primary-600 dark:hover:bg-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden lg:inline whitespace-nowrap">{t('console.button.start.recording')}</span>
                </button>
              )}

              {isRecording && (
                <>
                  <button
                    onClick={handlePauseResume}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-4 h-4" />
                        {t('console.button.resume')}
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4" />
                        {t('console.button.pause')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleStopRecording}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    {t('console.button.stop.recording')}
                  </button>
                </>
              )}

              {/* 다운로드 버튼 (종료된 강의만) 또는 로딩 */}
              {isSavingAudio ? (
                <div className="flex items-center gap-2 px-4 py-2">
                  <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">{t('console.status.saving')}</span>
                </div>
              ) : (
                isCompleted && (
                  <>
                    {selectedLecture.status === 'not_recorded' ? (
                      <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-300">
                        {t('console.audio.not.saved')}
                      </div>
                    ) : (
                      selectedLecture.audio_file_url && (
                        <button
                          onClick={handleDownloadAudio}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <Download className="w-4 h-4 flex-shrink-0" />
                          <span className="hidden lg:inline whitespace-nowrap">{t('console.button.download.audio')}</span>
                        </button>
                      )
                    )}
                    <button
                      onClick={handleDownloadTranscript}
                      disabled={savedCaptions.length === 0}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden lg:inline whitespace-nowrap">{t('console.button.download.transcript')}</span>
                    </button>
                  </>
                )
              )}
            </div>
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div className="mt-3 flex items-center gap-4 text-sm">
              {/* 녹음 상태 */}
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{t('console.status.paused')}</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{t('console.status.recording')}</span>
                  </>
                )}
              </div>

              <span className="text-gray-300 dark:text-gray-600">|</span>

              {/* 경과 시간 */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">{t('console.status.elapsed.time')}</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono font-bold text-lg">
                  {formatTime(elapsedTime)}
                </span>
              </div>

              <span className="text-gray-300 dark:text-gray-600">|</span>

              {/* 자막 개수 */}
              <span className="text-gray-600 dark:text-gray-400">
                {deepgram.captions.filter((c) => c.isFinal).length} {t('console.status.captions')}
              </span>
            </div>
          )}

          {/* Error Messages */}
          {(audioRecorder.error || deepgram.error) && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">
                {audioRecorder.error || deepgram.error}
              </p>
            </div>
          )}

          {/* No Lecture Selected */}
          {!selectedLecture && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {t('console.info.select.or.create')}
              </p>
            </div>
          )}
        </header>
        )}

        {/* Main 2-Pane Layout */}
        <div className="flex-1 flex overflow-hidden">
          {selectedLecture ? (
            <>
              {/* Left Pane - 자막 */}
              <CaptionPanel
                isRecording={isActiveRecording}
                isCompleted={isCompleted}
                captions={deepgram.captions}
                savedCaptions={savedCaptions}
                translationEnabled={translationEnabled}
                translationTargetLang={translationTargetLang}
                onTranslationToggle={handleTranslationToggle}
                onTranslationTargetChange={setTranslationTargetLang}
                onTranslationComplete={isCompleted ? undefined : handleTranslationComplete}
                onBulkTranslationComplete={handleBulkTranslationComplete}
                realTimeTranslations={realTimeTranslations}
                isFullscreenMode={isFullscreenMode}
                onToggleFullscreen={() => setIsFullscreenMode(!isFullscreenMode)}
              />

              {/* Right Pane - 채팅 (전체화면 모드에서는 숨김) */}
              {!isFullscreenMode && <ChatPanel lectureId={selectedLecture?.id || null} />}
            </>
          ) : (
            /* Welcome Screen - No lecture selected */
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#202020]">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-200">
                  {t('console.welcome.title')}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {t('console.welcome.select')}
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {t('console.welcome.create')}
                </p>
              </div>
            </div>
          )}
        </div>
          </div>
        </>
      )}

      {/* Translation Activation Modal */}
      {showTranslationModal && selectedLecture && (
        <TranslationActivationModal
          recordingLanguage={selectedLecture.audio_languages?.[0] || 'ko'}
          onConfirm={handleConfirmTranslation}
          onClose={() => setShowTranslationModal(false)}
        />
      )}

      {/* Saving Process Popup - 녹음 종료 시 */}
      {isSavingAudio && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]" style={{ pointerEvents: 'none' }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4 shadow-2xl">
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
              <div className="text-center space-y-3">
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t('console.saving.title')}
                </p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {t('console.saving.warning')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('console.saving.detail')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
