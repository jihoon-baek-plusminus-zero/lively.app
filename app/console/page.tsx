'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/console/Sidebar'
import CaptionPanel from '@/components/console/CaptionPanel'
import ChatPanel from '@/components/console/ChatPanel'
import { Play, Square, Mic, AlertCircle, Pause, Download, FileText, Loader2, MoreVertical, Edit2, Trash2, Check, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { useDeepgram } from '@/hooks/useDeepgram'
import { useLectures, type Lecture } from '@/hooks/useLectures'
import { useCaptions } from '@/hooks/useCaptions'
import { useCaptionsList } from '@/hooks/useCaptionsList'
import { uploadAudioFile, downloadAudioFile, downloadTranscript } from '@/lib/storage'

export default function ConsolePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null)
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isSavingAudio, setIsSavingAudio] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  // Hooks
  const audioRecorder = useAudioRecorder()
  const deepgram = useDeepgram()
  const { lectures, startLecture, endLecture, updateAudioUrl, updateLectureTitle, deleteLecture, refetch: refetchLectures } = useLectures()
  const { saveCaption } = useCaptions()
  const { captions: savedCaptions } = useCaptionsList(selectedLecture?.id || null)

  // 녹음 중: 오디오 녹음 중이고 (일시정지 아니거나 Deepgram 연결됨)
  const isRecording = audioRecorder.isRecording && (isPaused || deepgram.isConnected)
  const isCompleted = selectedLecture?.status === 'completed'
  // 실제 녹음 진행 중 (일시정지 아님)
  const isActiveRecording = isRecording && !isPaused

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
        console.log('📋 마지막 완료된 강의 자동 선택:', lecture.title)
      }
    }
  }, [lectures, selectedLecture])

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

  // Final 자막을 Supabase에 저장
  useEffect(() => {
    if (!selectedLecture) return

    const finalCaptions = deepgram.captions.filter((c) => c.isFinal)
    if (finalCaptions.length > 0) {
      const lastCaption = finalCaptions[finalCaptions.length - 1]

      // 녹음 시작 이후 경과 시간 계산
      const elapsedSeconds = recordingStartTime > 0
        ? (Date.now() - recordingStartTime) / 1000
        : 0

      saveCaption(
        selectedLecture.id,
        lastCaption.text,
        elapsedSeconds,
        lastCaption.speaker
      )
    }
  }, [deepgram.captions, selectedLecture, saveCaption, recordingStartTime])

  // 녹음 시작
  const handleStartRecording = async () => {
    if (!selectedLecture) {
      alert('강의를 선택하거나 새로 생성해주세요')
      return
    }

    console.log('🎬 녹음 시작 프로세스 시작...')

    try {
      // 1. 오디오 녹음 시작 (스트림 직접 반환)
      const stream = await audioRecorder.startRecording()

      if (!stream) {
        throw new Error('오디오 스트림을 가져올 수 없습니다')
      }

      console.log('📡 Deepgram 연결 시작...')

      // 2. Deepgram 연결
      await deepgram.connect(stream)

      console.log('✅ Deepgram 연결 완료')

      // 3. 강의 상태를 'recording'으로 변경
      await startLecture(selectedLecture.id)

      // 4. 녹음 시작 시간 기록
      setRecordingStartTime(Date.now())

      console.log('🎉 모든 설정 완료! 녹음 시작!')
    } catch (error) {
      console.error('❌ 녹음 시작 실패:', error)
      // 실패 시 정리
      audioRecorder.stopRecording()
      deepgram.disconnect()
    }
  }

  // 일시정지/재개
  const handlePauseResume = async () => {
    if (isPaused) {
      // 재개: Deepgram 재연결 + MediaRecorder 재개
      console.log('▶️ 녹음 재개 - Deepgram 재연결 + MediaRecorder 재개')
      if (audioRecorder.audioStream) {
        await deepgram.connect(audioRecorder.audioStream)
        audioRecorder.resumeRecording()
        console.log('✅ Deepgram 재연결 및 MediaRecorder 재개 완료')
      }
      setIsPaused(false)
    } else {
      // 일시정지: Deepgram 연결 끊기 + MediaRecorder 일시정지
      console.log('⏸️ 녹음 일시정지 - Deepgram 연결 해제 + MediaRecorder 일시정지')
      deepgram.disconnect()
      audioRecorder.pauseRecording()
      console.log('✅ Deepgram 연결 해제 및 MediaRecorder 일시정지 완료')
      setIsPaused(true)
    }
  }

  // 녹음 종료
  const handleStopRecording = async () => {
    if (!selectedLecture || !user) return

    setIsSavingAudio(true)

    try {
      console.log('🛑 녹음 종료 프로세스 시작...')

      // 1. Deepgram 연결 해제
      deepgram.disconnect()

      // 2. 오디오 녹음 중지 및 Blob 가져오기
      const audioBlob = await audioRecorder.stopRecording()

      // 3. 오디오 파일 업로드
      if (audioBlob) {
        console.log('📤 오디오 파일 업로드 중...')
        const audioUrl = await uploadAudioFile(selectedLecture.id, audioBlob, user.id)

        if (audioUrl) {
          // 오디오 URL 데이터베이스에 저장
          await updateAudioUrl(selectedLecture.id, audioUrl)
          console.log('✅ 오디오 파일 저장 완료:', audioUrl)
        }
      }

      // 4. 강의 상태를 'completed'로 변경
      await endLecture(selectedLecture.id)

      // 5. 강의 목록 새로고침
      await refetchLectures()

      // 6. 상태 초기화
      setRecordingStartTime(0)
      setElapsedTime(0)
      setIsPaused(false)

      console.log('✅ 녹음 종료 완료 - 페이지 새로고침')

      // 7. 강의 ID를 URL에 저장하고 페이지 새로고침
      sessionStorage.setItem('lastCompletedLecture', selectedLecture.id)
      window.location.reload()
    } catch (error) {
      console.error('❌ 녹음 종료 실패:', error)
      setIsSavingAudio(false)
    }
  }

  // 음성 다운로드
  const handleDownloadAudio = async () => {
    if (!selectedLecture?.audio_file_url) {
      alert('음성 파일이 없습니다')
      return
    }

    try {
      const fileName = `${selectedLecture.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.webm`
      await downloadAudioFile(selectedLecture.audio_file_url, fileName)
    } catch (error) {
      console.error('음성 다운로드 실패:', error)
      alert('음성 다운로드에 실패했습니다')
    }
  }

  // 대본 다운로드
  const handleDownloadTranscript = () => {
    if (savedCaptions.length === 0) {
      alert('대본이 없습니다')
      return
    }

    try {
      const fileName = `${selectedLecture?.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_대본.txt`
      downloadTranscript(savedCaptions, fileName)
    } catch (error) {
      console.error('대본 다운로드 실패:', error)
      alert('대본 다운로드에 실패했습니다')
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
    if (selectedLecture && confirm('정말 삭제하시겠습니까?')) {
      await deleteLecture(selectedLecture.id)
      setSelectedLecture(null)
      setShowMenu(false)
    }
  }

  // 새 강의 생성 핸들러
  const handleCreateLecture = (lecture: Lecture) => {
    setSelectedLecture(lecture)
  }

  // 강의 선택 핸들러
  const handleSelectLecture = (lectureId: string) => {
    const lecture = lectures.find((l) => l.id === lectureId)
    if (lecture) {
      setSelectedLecture(lecture)
      console.log('📋 강의 선택:', lecture.title, '(상태:', lecture.status, ')')
    }
  }

  // 로딩 중이거나 사용자가 없으면 로딩 화면
  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Left Sidebar - 강의 리스트 */}
      <Sidebar
        selectedLectureId={selectedLecture?.id || null}
        onSelectLecture={handleSelectLecture}
        onCreateLecture={handleCreateLecture}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>

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
                    title={selectedLecture && !isRecording ? '더블클릭하여 수정' : ''}
                  >
                    {selectedLecture?.title || '강의를 선택하세요'}
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
                      disabled={isRecording}
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
                          이름 수정
                        </button>
                        <button
                          onClick={handleDeleteLecture}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recording Controls */}
            <div className="flex items-center gap-3">
              {!isRecording && !isCompleted && !isSavingAudio && (
                <button
                  onClick={handleStartRecording}
                  disabled={!selectedLecture || audioRecorder.isRecording || deepgram.isConnected}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                  녹음 시작
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
                        재개
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4" />
                        일시정지
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleStopRecording}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    녹음 종료
                  </button>
                </>
              )}

              {/* 다운로드 버튼 (종료된 강의만) 또는 로딩 */}
              {isSavingAudio ? (
                <div className="flex items-center gap-2 px-4 py-2">
                  <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">저장 중...</span>
                </div>
              ) : (
                isCompleted && (
                  <>
                    {selectedLecture.audio_file_url && (
                      <button
                        onClick={handleDownloadAudio}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        음성 다운로드
                      </button>
                    )}
                    <button
                      onClick={handleDownloadTranscript}
                      disabled={savedCaptions.length === 0}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileText className="w-4 h-4" />
                      대본 다운로드
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
                    <span className="text-gray-600 font-medium">일시정지</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600 font-medium">녹음 중</span>
                  </>
                )}
              </div>

              <span className="text-gray-300 dark:text-gray-600">|</span>

              {/* 경과 시간 */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">경과 시간:</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono font-bold text-lg">
                  {formatTime(elapsedTime)}
                </span>
              </div>

              <span className="text-gray-300 dark:text-gray-600">|</span>

              {/* 자막 개수 */}
              <span className="text-gray-600 dark:text-gray-400">
                Deepgram 연결됨 • {deepgram.captions.filter((c) => c.isFinal).length}개 자막
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
                좌측에서 강의를 선택하거나 "새 강의 시작" 버튼을 클릭하세요
              </p>
            </div>
          )}
        </header>

        {/* Main 2-Pane Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Pane - 자막 */}
          <CaptionPanel
            isRecording={isActiveRecording}
            isCompleted={isCompleted}
            captions={deepgram.captions}
            savedCaptions={savedCaptions}
          />

          {/* Right Pane - 채팅 */}
          <ChatPanel />
        </div>
      </div>
    </div>
  )
}
