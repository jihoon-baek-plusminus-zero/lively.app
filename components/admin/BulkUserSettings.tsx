'use client'

import { useState, useEffect, useMemo } from 'react'
import { UserCog, Clock, Coins, Loader2, ChevronRight, UserX, AlertTriangle } from 'lucide-react'
import { useUserManagement, UserWithUsage } from '@/hooks/useUserManagement'

export default function BulkUserSettings() {
  const { loading, getAllUsers, bulkUpdateRecordingQuota, bulkUpdateAIQuota, bulkUpdatePurchasedRecordingTime, bulkUpdatePurchasedAICredit, updateRecordingQuota, updateAIQuota, updatePurchasedRecordingTime, updatePurchasedAICredit, deleteUser } =
    useUserManagement()

  // State
  const [users, setUsers] = useState<UserWithUsage[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  // Individual user detail view
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserWithUsage | null>(null)

  // Modal states
  const [showRecordingModal, setShowRecordingModal] = useState(false)
  const [showPurchasedRecordingModal, setShowPurchasedRecordingModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [showPurchasedAIModal, setShowPurchasedAIModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Recording modal state (monthly)
  const [recordingOperation, setRecordingOperation] = useState<'add' | 'subtract'>('add')
  const [recordingHours, setRecordingHours] = useState('')
  const [isUpdatingRecording, setIsUpdatingRecording] = useState(false)

  // Purchased recording modal state
  const [purchasedRecordingOperation, setPurchasedRecordingOperation] = useState<'add' | 'subtract'>('add')
  const [purchasedRecordingHours, setPurchasedRecordingHours] = useState('')
  const [isUpdatingPurchasedRecording, setIsUpdatingPurchasedRecording] = useState(false)

  // AI modal state (monthly)
  const [aiOperation, setAIOperation] = useState<'add' | 'subtract'>('add')
  const [aiCredits, setAICredits] = useState('')
  const [isUpdatingAI, setIsUpdatingAI] = useState(false)

  // Purchased AI modal state
  const [purchasedAIOperation, setPurchasedAIOperation] = useState<'add' | 'subtract'>('add')
  const [purchasedAICredits, setPurchasedAICredits] = useState('')
  const [isUpdatingPurchasedAI, setIsUpdatingPurchasedAI] = useState(false)

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

  // Handle bulk purchased recording update
  const handleUpdatePurchasedRecording = async () => {
    if (!purchasedRecordingHours || selectedUserIds.length === 0) {
      showAlert('error', '시간을 입력해주세요')
      return
    }

    const hours = parseFloat(purchasedRecordingHours)
    if (isNaN(hours) || hours <= 0) {
      showAlert('error', '올바른 시간을 입력해주세요')
      return
    }

    setIsUpdatingPurchasedRecording(true)
    try {
      const success = await bulkUpdatePurchasedRecordingTime(selectedUserIds, purchasedRecordingOperation, hours)
      if (success) {
        showAlert('success', `${selectedUserIds.length}명의 유저 추가구매 녹음 시간이 업데이트되었습니다`)
        setShowPurchasedRecordingModal(false)
        setPurchasedRecordingHours('')
        setSelectedUserIds([])
        // Refresh user list
        const allUsers = await getAllUsers()
        setUsers(allUsers)
      } else {
        showAlert('error', '추가구매 녹음 시간 업데이트에 실패했습니다')
      }
    } catch (err) {
      showAlert('error', '업데이트 중 오류가 발생했습니다')
    } finally {
      setIsUpdatingPurchasedRecording(false)
    }
  }

  // Handle bulk purchased AI update
  const handleUpdatePurchasedAI = async () => {
    if (!purchasedAICredits || selectedUserIds.length === 0) {
      showAlert('error', '크레딧을 입력해주세요')
      return
    }

    const credits = parseInt(purchasedAICredits)
    if (isNaN(credits) || credits <= 0) {
      showAlert('error', '올바른 크레딧을 입력해주세요')
      return
    }

    setIsUpdatingPurchasedAI(true)
    try {
      const success = await bulkUpdatePurchasedAICredit(selectedUserIds, purchasedAIOperation, credits)
      if (success) {
        showAlert('success', `${selectedUserIds.length}명의 유저 추가구매 AI 크레딧이 업데이트되었습니다`)
        setShowPurchasedAIModal(false)
        setPurchasedAICredits('')
        setSelectedUserIds([])
        // Refresh user list
        const allUsers = await getAllUsers()
        setUsers(allUsers)
      } else {
        showAlert('error', '추가구매 AI 크레딧 업데이트에 실패했습니다')
      }
    } catch (err) {
      showAlert('error', '업데이트 중 오류가 발생했습니다')
    } finally {
      setIsUpdatingPurchasedAI(false)
    }
  }

  // Handle individual user recording update
  const handleUpdateIndividualRecording = async () => {
    if (!selectedUserForDetail || !recordingHours) {
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
      const success = await updateRecordingQuota(selectedUserForDetail.id, recordingOperation, hours)
      if (success) {
        showAlert('success', '녹음 한도가 업데이트되었습니다')
        setShowRecordingModal(false)
        setRecordingHours('')
        // Refresh user list and update selected user
        const allUsers = await getAllUsers()
        setUsers(allUsers)
        const updatedUser = allUsers.find(u => u.id === selectedUserForDetail.id)
        if (updatedUser) setSelectedUserForDetail(updatedUser)
      } else {
        showAlert('error', '녹음 한도 업데이트에 실패했습니다')
      }
    } catch (err) {
      showAlert('error', '업데이트 중 오류가 발생했습니다')
    } finally {
      setIsUpdatingRecording(false)
    }
  }

  // Handle individual user AI update
  const handleUpdateIndividualAI = async () => {
    if (!selectedUserForDetail || !aiCredits) {
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
      const success = await updateAIQuota(selectedUserForDetail.id, aiOperation, credits)
      if (success) {
        showAlert('success', 'AI 크레딧이 업데이트되었습니다')
        setShowAIModal(false)
        setAICredits('')
        // Refresh user list and update selected user
        const allUsers = await getAllUsers()
        setUsers(allUsers)
        const updatedUser = allUsers.find(u => u.id === selectedUserForDetail.id)
        if (updatedUser) setSelectedUserForDetail(updatedUser)
      } else {
        showAlert('error', 'AI 크레딧 업데이트에 실패했습니다')
      }
    } catch (err) {
      showAlert('error', '업데이트 중 오류가 발생했습니다')
    } finally {
      setIsUpdatingAI(false)
    }
  }

  // Handle individual user purchased recording update
  const handleUpdateIndividualPurchasedRecording = async () => {
    if (!selectedUserForDetail || !purchasedRecordingHours) {
      showAlert('error', '시간을 입력해주세요')
      return
    }

    const hours = parseFloat(purchasedRecordingHours)
    if (isNaN(hours) || hours <= 0) {
      showAlert('error', '올바른 시간을 입력해주세요')
      return
    }

    setIsUpdatingPurchasedRecording(true)
    try {
      const success = await updatePurchasedRecordingTime(selectedUserForDetail.id, purchasedRecordingOperation, hours)
      if (success) {
        showAlert('success', '추가구매 녹음 시간이 업데이트되었습니다')
        setShowPurchasedRecordingModal(false)
        setPurchasedRecordingHours('')
        // Refresh user list and update selected user
        const allUsers = await getAllUsers()
        setUsers(allUsers)
        const updatedUser = allUsers.find(u => u.id === selectedUserForDetail.id)
        if (updatedUser) setSelectedUserForDetail(updatedUser)
      } else {
        showAlert('error', '추가구매 녹음 시간 업데이트에 실패했습니다')
      }
    } catch (err) {
      showAlert('error', '업데이트 중 오류가 발생했습니다')
    } finally {
      setIsUpdatingPurchasedRecording(false)
    }
  }

  // Handle individual user purchased AI update
  const handleUpdateIndividualPurchasedAI = async () => {
    if (!selectedUserForDetail || !purchasedAICredits) {
      showAlert('error', '크레딧을 입력해주세요')
      return
    }

    const credits = parseInt(purchasedAICredits)
    if (isNaN(credits) || credits <= 0) {
      showAlert('error', '올바른 크레딧을 입력해주세요')
      return
    }

    setIsUpdatingPurchasedAI(true)
    try {
      const success = await updatePurchasedAICredit(selectedUserForDetail.id, purchasedAIOperation, credits)
      if (success) {
        showAlert('success', '추가구매 AI 크레딧이 업데이트되었습니다')
        setShowPurchasedAIModal(false)
        setPurchasedAICredits('')
        // Refresh user list and update selected user
        const allUsers = await getAllUsers()
        setUsers(allUsers)
        const updatedUser = allUsers.find(u => u.id === selectedUserForDetail.id)
        if (updatedUser) setSelectedUserForDetail(updatedUser)
      } else {
        showAlert('error', '추가구매 AI 크레딧 업데이트에 실패했습니다')
      }
    } catch (err) {
      showAlert('error', '업데이트 중 오류가 발생했습니다')
    } finally {
      setIsUpdatingPurchasedAI(false)
    }
  }

  // Handle delete individual user
  const handleDeleteIndividualUser = async () => {
    if (!selectedUserForDetail) return

    setIsDeleting(true)
    try {
      const success = await deleteUser(selectedUserForDetail.id)
      if (success) {
        showAlert('success', '사용자가 삭제되었습니다')
        setShowDeleteModal(false)
        setSelectedUserForDetail(null)
        // Refresh user list
        const allUsers = await getAllUsers()
        setUsers(allUsers)
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
                  className={`flex items-center gap-3 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                    selectedUserIds.includes(user.id)
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  } ${
                    index !== filteredUsers.length - 1
                      ? 'border-b border-gray-200 dark:border-gray-700'
                      : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => handleToggleUser(user.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span
                    className="flex-1 text-gray-900 dark:text-gray-100 cursor-pointer"
                    onClick={() => handleToggleUser(user.id)}
                  >
                    {user.email}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedUserForDetail(user)
                    }}
                    className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>개별 설정</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setShowRecordingModal(true)
            setRecordingOperation('add')
            setRecordingHours('')
          }}
          disabled={selectedUserIds.length === 0}
          className="px-4 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Clock className="w-4 h-4" />
          <span className="text-sm">월별 녹음 추가/차감</span>
        </button>
        <button
          onClick={() => {
            setShowPurchasedRecordingModal(true)
            setPurchasedRecordingOperation('add')
            setPurchasedRecordingHours('')
          }}
          disabled={selectedUserIds.length === 0}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Clock className="w-4 h-4" />
          <span className="text-sm">추가구매 녹음 추가/차감</span>
        </button>
        <button
          onClick={() => {
            setShowAIModal(true)
            setAIOperation('add')
            setAICredits('')
          }}
          disabled={selectedUserIds.length === 0}
          className="px-4 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Coins className="w-4 h-4" />
          <span className="text-sm">월별 AI 추가/차감</span>
        </button>
        <button
          onClick={() => {
            setShowPurchasedAIModal(true)
            setPurchasedAIOperation('add')
            setPurchasedAICredits('')
          }}
          disabled={selectedUserIds.length === 0}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Coins className="w-4 h-4" />
          <span className="text-sm">추가구매 AI 추가/차감</span>
        </button>
      </div>

      {/* Individual User Detail Modal */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">개별 유저 설정</h3>
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                사용자 정보
              </h4>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                {selectedUserForDetail.email}
              </p>
            </div>

            {/* Recording Quota */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                녹음 한도
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    월별 녹음 한도:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {Math.floor(selectedUserForDetail.usage.total_recordable_time / 3600)}시간
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    이번달 녹음 시간:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatTime(selectedUserForDetail.usage.total_recorded_time)}
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
                        selectedUserForDetail.usage.total_recordable_time -
                          selectedUserForDetail.usage.total_recorded_time
                      )
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    추가구매 시간:
                  </span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {formatTime(selectedUserForDetail.usage.purchased_recording_time || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Credit */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                AI 질문 크레딧
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    월별 AI 질문 credit:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedUserForDetail.usage.total_ai_credit}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    이번달 사용한 크레딧:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedUserForDetail.usage.total_ai_used}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    이번달 잔여 크레딧:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {Math.max(0, selectedUserForDetail.usage.total_ai_credit - selectedUserForDetail.usage.total_ai_used)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    추가구매 credit:
                  </span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {selectedUserForDetail.usage.purchased_ai_credit || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <button
                onClick={() => {
                  setShowRecordingModal(true)
                  setRecordingOperation('add')
                  setRecordingHours('')
                }}
                className="px-3 py-2.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span className="text-xs">월별 녹음</span>
              </button>
              <button
                onClick={() => {
                  setShowPurchasedRecordingModal(true)
                  setPurchasedRecordingOperation('add')
                  setPurchasedRecordingHours('')
                }}
                className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span className="text-xs">추가구매 녹음</span>
              </button>
              <button
                onClick={() => {
                  setShowAIModal(true)
                  setAIOperation('add')
                  setAICredits('')
                }}
                className="px-3 py-2.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Coins className="w-4 h-4" />
                <span className="text-xs">월별 AI</span>
              </button>
              <button
                onClick={() => {
                  setShowPurchasedAIModal(true)
                  setPurchasedAIOperation('add')
                  setPurchasedAICredits('')
                }}
                className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Coins className="w-4 h-4" />
                <span className="text-xs">추가구매 AI</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <UserX className="w-4 h-4" />
                <span className="text-xs">계정 삭제</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Recording Modal */}
      {showRecordingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              월별 녹음 한도 추가/차감
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {selectedUserForDetail
                ? `${selectedUserForDetail.email}에게 적용`
                : `${selectedUserIds.length}명의 유저에게 적용`}
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
                onClick={selectedUserForDetail ? handleUpdateIndividualRecording : handleUpdateRecording}
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

      {/* Purchased Recording Modal */}
      {showPurchasedRecordingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              추가구매 녹음 시간 추가/차감
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {selectedUserForDetail
                ? `${selectedUserForDetail.email}에게 적용`
                : `${selectedUserIds.length}명의 유저에게 적용`}
            </p>

            {/* Toggle Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setPurchasedRecordingOperation('add')}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  purchasedRecordingOperation === 'add'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                추가
              </button>
              <button
                onClick={() => setPurchasedRecordingOperation('subtract')}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  purchasedRecordingOperation === 'subtract'
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
                value={purchasedRecordingHours}
                onChange={(e) => setPurchasedRecordingHours(e.target.value)}
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
                  setShowPurchasedRecordingModal(false)
                  setPurchasedRecordingHours('')
                }}
                disabled={isUpdatingPurchasedRecording}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={selectedUserForDetail ? handleUpdateIndividualPurchasedRecording : handleUpdatePurchasedRecording}
                disabled={isUpdatingPurchasedRecording}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdatingPurchasedRecording ? (
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

      {/* Purchased AI Credit Modal */}
      {showPurchasedAIModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              추가구매 AI 크레딧 추가/차감
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {selectedUserForDetail
                ? `${selectedUserForDetail.email}에게 적용`
                : `${selectedUserIds.length}명의 유저에게 적용`}
            </p>

            {/* Toggle Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setPurchasedAIOperation('add')}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  purchasedAIOperation === 'add'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                추가
              </button>
              <button
                onClick={() => setPurchasedAIOperation('subtract')}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  purchasedAIOperation === 'subtract'
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
                value={purchasedAICredits}
                onChange={(e) => setPurchasedAICredits(e.target.value)}
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
                  setShowPurchasedAIModal(false)
                  setPurchasedAICredits('')
                }}
                disabled={isUpdatingPurchasedAI}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={selectedUserForDetail ? handleUpdateIndividualPurchasedAI : handleUpdatePurchasedAI}
                disabled={isUpdatingPurchasedAI}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdatingPurchasedAI ? (
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

      {/* Monthly AI Credit Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              월별 AI 질문 크레딧 추가/차감
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {selectedUserForDetail
                ? `${selectedUserForDetail.email}에게 적용`
                : `${selectedUserIds.length}명의 유저에게 적용`}
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
                onClick={selectedUserForDetail ? handleUpdateIndividualAI : handleUpdateAI}
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
      {showDeleteModal && selectedUserForDetail && (
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
                {selectedUserForDetail.email} 계정을 삭제하시겠습니까?
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
                onClick={handleDeleteIndividualUser}
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
