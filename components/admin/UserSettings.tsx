'use client'

import { useState } from 'react'
import { Users, Search, Loader2, Clock, Coins, UserX, AlertTriangle } from 'lucide-react'
import { useUserManagement, UserWithUsage } from '@/hooks/useUserManagement'

export default function UserSettings() {
  const { loading, error, searchUserByEmail, updateRecordingQuota, updateAIQuota, deleteUser } =
    useUserManagement()

  // Search state
  const [searchEmail, setSearchEmail] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserWithUsage | null>(null)

  // Modal states
  const [showRecordingModal, setShowRecordingModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Recording modal state
  const [recordingOperation, setRecordingOperation] = useState<'add' | 'subtract'>('add')
  const [recordingHours, setRecordingHours] = useState('')
  const [isUpdatingRecording, setIsUpdatingRecording] = useState(false)

  // AI modal state
  const [aiOperation, setAIOperation] = useState<'add' | 'subtract'>('add')
  const [aiCredits, setAICredits] = useState('')
  const [isUpdatingAI, setIsUpdatingAI] = useState(false)

  // Delete modal state
  const [isDeleting, setIsDeleting] = useState(false)

  // Alert state
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 3000)
  }

  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      setSearchError('이메일을 입력해주세요')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(searchEmail)) {
      setSearchError('올바른 이메일 형식을 입력해주세요')
      return
    }

    setIsSearching(true)
    setSearchError(null)
    setSelectedUser(null)

    try {
      const user = await searchUserByEmail(searchEmail)
      if (user) {
        setSelectedUser(user)
        setSearchError(null)
      } else {
        setSearchError(error || '사용자를 찾을 수 없습니다')
      }
    } catch (err) {
      setSearchError('검색 중 오류가 발생했습니다')
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleUpdateRecording = async () => {
    if (!selectedUser || !recordingHours) {
      showAlert('error', '시간을 입력해주세요')
      return
    }

    const hours = parseFloat(recordingHours)
    if (isNaN(hours) || hours <= 0) {
      showAlert('error', '올바른 시간을 입력해주세요')
      return
    }

    setIsUpdatingRecording(true)
    try {
      const success = await updateRecordingQuota(selectedUser.id, recordingOperation, hours)
      if (success) {
        showAlert('success', '녹음 한도가 업데이트되었습니다')
        setShowRecordingModal(false)
        setRecordingHours('')
        // Refresh user data
        const updatedUser = await searchUserByEmail(selectedUser.email)
        if (updatedUser) setSelectedUser(updatedUser)
      } else {
        showAlert('error', '녹음 한도 업데이트에 실패했습니다')
      }
    } catch (err) {
      showAlert('error', '업데이트 중 오류가 발생했습니다')
    } finally {
      setIsUpdatingRecording(false)
    }
  }

  const handleUpdateAI = async () => {
    if (!selectedUser || !aiCredits) {
      showAlert('error', '크레딧을 입력해주세요')
      return
    }

    const credits = parseInt(aiCredits)
    if (isNaN(credits) || credits <= 0) {
      showAlert('error', '올바른 크레딧을 입력해주세요')
      return
    }

    setIsUpdatingAI(true)
    try {
      const success = await updateAIQuota(selectedUser.id, aiOperation, credits)
      if (success) {
        showAlert('success', 'AI 크레딧이 업데이트되었습니다')
        setShowAIModal(false)
        setAICredits('')
        // Refresh user data
        const updatedUser = await searchUserByEmail(selectedUser.email)
        if (updatedUser) setSelectedUser(updatedUser)
      } else {
        showAlert('error', 'AI 크레딧 업데이트에 실패했습니다')
      }
    } catch (err) {
      showAlert('error', '업데이트 중 오류가 발생했습니다')
    } finally {
      setIsUpdatingAI(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setIsDeleting(true)
    try {
      const success = await deleteUser(selectedUser.id)
      if (success) {
        showAlert('success', '사용자가 삭제되었습니다')
        setShowDeleteModal(false)
        setSelectedUser(null)
        setSearchEmail('')
      } else {
        showAlert('error', '사용자 삭제에 실패했습니다')
      }
    } catch (err) {
      showAlert('error', '삭제 중 오류가 발생했습니다')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">유저 설정</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">개별 사용자 관리 및 설정</p>
      </div>

      {/* Alert */}
      {alert && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            alert.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
        >
          {alert.message}
        </div>
      )}

      {/* Email Search Section */}
      <div className="bg-white dark:bg-[#202020] rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          사용자 검색
        </h2>
        <div className="flex gap-3">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => {
              setSearchEmail(e.target.value)
              setSearchError(null)
            }}
            onKeyPress={handleKeyPress}
            placeholder="이메일 검색"
            disabled={isSearching}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>
        {searchError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{searchError}</p>
        )}
      </div>

      {/* User Info Display */}
      {selectedUser && (
        <>
          <div className="bg-white dark:bg-[#202020] rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              사용자 정보
            </h2>

            {/* Email */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">유저 이메일</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                {selectedUser.email}
              </p>
            </div>

            {/* Recording Quota */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                녹음 한도
              </p>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    내 녹음 한도:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {Math.floor(selectedUser.usage.total_recordable_time / 3600)}시간
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    이번달 녹음 시간:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatTime(selectedUser.usage.total_recorded_time)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    이번달 잔여 시간:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatTime(
                      Math.max(
                        0,
                        selectedUser.usage.total_recordable_time -
                          selectedUser.usage.total_recorded_time
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Credit */}
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                AI 질문 크레딧
              </p>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    내 AI 질문 credit:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedUser.usage.total_ai_credit}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    이번달 사용한 크레딧:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedUser.usage.total_ai_used}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    이번달 잔여 크레딧:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {Math.max(0, selectedUser.usage.total_ai_credit - selectedUser.usage.total_ai_used)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setShowRecordingModal(true)
                setRecordingOperation('add')
                setRecordingHours('')
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Clock className="w-5 h-5" />
              <span>녹음 한도 추가/차감</span>
            </button>
            <button
              onClick={() => {
                setShowAIModal(true)
                setAIOperation('add')
                setAICredits('')
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Coins className="w-5 h-5" />
              <span>AI 질문 크레딧 한도 추가/차감</span>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <UserX className="w-5 h-5" />
              <span>계정 수정/삭제</span>
            </button>
          </div>
        </>
      )}

      {/* Recording Modal */}
      {showRecordingModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">
              녹음 한도 추가/차감
            </h3>

            {/* Toggle Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setRecordingOperation('add')}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  recordingOperation === 'add'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                추가
              </button>
              <button
                onClick={() => setRecordingOperation('subtract')}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  recordingOperation === 'subtract'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                차감
              </button>
            </div>

            {/* Input Field */}
            <div className="mb-6">
              <input
                type="number"
                value={recordingHours}
                onChange={(e) => setRecordingHours(e.target.value)}
                placeholder="시간 입력"
                min="0"
                step="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">1시간 단위로 입력</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRecordingModal(false)
                  setRecordingHours('')
                }}
                disabled={isUpdatingRecording}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleUpdateRecording}
                disabled={isUpdatingRecording}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdatingRecording ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>적용 중...</span>
                  </>
                ) : (
                  <span>적용</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Credit Modal */}
      {showAIModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">
              AI 질문 크레딧 한도 추가/차감
            </h3>

            {/* Toggle Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setAIOperation('add')}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  aiOperation === 'add'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                추가
              </button>
              <button
                onClick={() => setAIOperation('subtract')}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  aiOperation === 'subtract'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                차감
              </button>
            </div>

            {/* Input Field */}
            <div className="mb-6">
              <input
                type="number"
                value={aiCredits}
                onChange={(e) => setAICredits(e.target.value)}
                placeholder="크레딧 입력"
                min="0"
                step="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">1크레딧 단위로 입력</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAIModal(false)
                  setAICredits('')
                }}
                disabled={isUpdatingAI}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleUpdateAI}
                disabled={isUpdatingAI}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdatingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>적용 중...</span>
                  </>
                ) : (
                  <span>적용</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">계정 삭제</h3>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {selectedUser.email} 계정을 삭제하시겠습니까?
              </p>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  경고: 모든 데이터가 삭제됩니다
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>삭제 중...</span>
                  </>
                ) : (
                  <span>삭제</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
