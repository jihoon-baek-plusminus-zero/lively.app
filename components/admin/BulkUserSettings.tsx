'use client'

import { useState, useEffect, useMemo } from 'react'
import { UserCog, Clock, Coins, Loader2 } from 'lucide-react'
import { useUserManagement, UserWithUsage } from '@/hooks/useUserManagement'

export default function BulkUserSettings() {
  const { loading, getAllUsers, bulkUpdateRecordingQuota, bulkUpdateAIQuota } =
    useUserManagement()

  // State
  const [users, setUsers] = useState<UserWithUsage[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  // Modal states
  const [showRecordingModal, setShowRecordingModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)

  // Recording modal state
  const [recordingOperation, setRecordingOperation] = useState<'add' | 'subtract'>('add')
  const [recordingHours, setRecordingHours] = useState('')
  const [isUpdatingRecording, setIsUpdatingRecording] = useState(false)

  // AI modal state
  const [aiOperation, setAIOperation] = useState<'add' | 'subtract'>('add')
  const [aiCredits, setAICredits] = useState('')
  const [isUpdatingAI, setIsUpdatingAI] = useState(false)

  // Alert state
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 3000)
  }

  // Load all users on mount
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoadingUsers(true)
      try {
        const allUsers = await getAllUsers()
        setUsers(allUsers)
      } catch (err) {
        showAlert('error', '사용자 목록을 불러오는데 실패했습니다')
      } finally {
        setIsLoadingUsers(false)
      }
    }

    loadUsers()
  }, [])

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users

    const query = searchQuery.toLowerCase()
    return users.filter((user) => user.email.toLowerCase().includes(query))
  }, [users, searchQuery])

  // Select all / Deselect all
  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(filteredUsers.map((user) => user.id))
    }
  }

  // Toggle individual user selection
  const handleToggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId))
    } else {
      setSelectedUserIds([...selectedUserIds, userId])
    }
  }

  // Handle bulk recording update
  const handleUpdateRecording = async () => {
    if (!recordingHours || selectedUserIds.length === 0) {
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
      const success = await bulkUpdateRecordingQuota(selectedUserIds, recordingOperation, hours)
      if (success) {
        showAlert('success', `${selectedUserIds.length}명의 유저 녹음 한도가 업데이트되었습니다`)
        setShowRecordingModal(false)
        setRecordingHours('')
        setSelectedUserIds([])
        // Refresh user list
        const allUsers = await getAllUsers()
        setUsers(allUsers)
      } else {
        showAlert('error', '녹음 한도 업데이트에 실패했습니다')
      }
    } catch (err) {
      showAlert('error', '업데이트 중 오류가 발생했습니다')
    } finally {
      setIsUpdatingRecording(false)
    }
  }

  // Handle bulk AI update
  const handleUpdateAI = async () => {
    if (!aiCredits || selectedUserIds.length === 0) {
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
      const success = await bulkUpdateAIQuota(selectedUserIds, aiOperation, credits)
      if (success) {
        showAlert('success', `${selectedUserIds.length}명의 유저 AI 크레딧이 업데이트되었습니다`)
        setShowAIModal(false)
        setAICredits('')
        setSelectedUserIds([])
        // Refresh user list
        const allUsers = await getAllUsers()
        setUsers(allUsers)
      } else {
        showAlert('error', 'AI 크레딧 업데이트에 실패했습니다')
      }
    } catch (err) {
      showAlert('error', '업데이트 중 오류가 발생했습니다')
    } finally {
      setIsUpdatingAI(false)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <UserCog className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">유저 일괄 설정</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">여러 사용자에 대한 일괄 작업 수행</p>
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
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="이메일로 검색"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
      </div>

      {/* User List Section */}
      <div className="bg-white dark:bg-[#202020] rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        {/* Header with Select All */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="checkbox"
            checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
            onChange={handleSelectAll}
            className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            전체 선택 ({selectedUserIds.length}/{filteredUsers.length})
          </span>
        </div>

        {/* User List */}
        <div className="max-h-96 overflow-y-auto">
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 dark:text-gray-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? '검색 결과가 없습니다' : '사용자가 없습니다'}
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredUsers.map((user, index) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${
                    selectedUserIds.includes(user.id)
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  } ${
                    index !== filteredUsers.length - 1
                      ? 'border-b border-gray-200 dark:border-gray-700'
                      : ''
                  }`}
                  onClick={() => handleToggleUser(user.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => handleToggleUser(user.id)}
                    className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-gray-900 dark:text-gray-100">{user.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => {
            setShowRecordingModal(true)
            setRecordingOperation('add')
            setRecordingHours('')
          }}
          disabled={selectedUserIds.length === 0}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          disabled={selectedUserIds.length === 0}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Coins className="w-5 h-5" />
          <span>AI 질문 크레딧 한도 추가/차감</span>
        </button>
      </div>

      {/* Recording Modal */}
      {showRecordingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              녹음 한도 추가/차감
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {selectedUserIds.length}명의 유저에게 적용
            </p>

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
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              AI 질문 크레딧 한도 추가/차감
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {selectedUserIds.length}명의 유저에게 적용
            </p>

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
    </div>
  )
}
