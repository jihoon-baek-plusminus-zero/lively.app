'use client'

import { useState } from 'react'
import { Shield, Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { useAdminUsers } from '@/hooks/useAdmin'

export default function AdminSettings() {
  const { adminUsers, loading, error, addAdmin, removeAdmin } = useAdminUsers()
  const [newEmail, setNewEmail] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<{ id: string; email: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 3000)
  }

  const handleAddAdmin = async () => {
    if (!newEmail.trim()) {
      showAlert('error', '이메일을 입력해주세요')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      showAlert('error', '올바른 이메일 형식을 입력해주세요')
      return
    }

    setIsAdding(true)
    try {
      const success = await addAdmin(newEmail, false)
      if (success) {
        showAlert('success', '관리자가 추가되었습니다')
        setNewEmail('')
      } else {
        showAlert('error', '관리자 추가에 실패했습니다')
      }
    } catch (err) {
      showAlert('error', '관리자 추가 중 오류가 발생했습니다')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteClick = (admin: { id: string; email: string }) => {
    setSelectedAdmin(admin)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedAdmin) return

    setIsDeleting(true)
    try {
      const success = await removeAdmin(selectedAdmin.id)
      if (success) {
        showAlert('success', '관리자 권한이 삭제되었습니다')
        setShowDeleteModal(false)
        setSelectedAdmin(null)
      } else {
        showAlert('error', '관리자 권한 삭제에 실패했습니다')
      }
    } catch (err) {
      showAlert('error', '삭제 중 오류가 발생했습니다')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddAdmin()
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">관리자 설정</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          관리자 권한 관리 및 설정 (슈퍼 관리자 전용)
        </p>
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

      {/* Add Admin Section */}
      <div className="bg-white dark:bg-[#202020] rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          관리자 추가
        </h2>
        <div className="flex gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="관리자 이메일 입력"
            disabled={isAdding}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
          />
          <button
            onClick={handleAddAdmin}
            disabled={isAdding}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Admin List Section */}
      <div className="bg-white dark:bg-[#202020] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          관리자 목록
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 dark:text-gray-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">오류: {error}</p>
          </div>
        ) : adminUsers.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">등록된 관리자가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-0">
            {adminUsers.map((admin, index) => (
              <div
                key={admin.id}
                className={`flex items-center justify-between py-4 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  index !== adminUsers.length - 1
                    ? 'border-b border-gray-200 dark:border-gray-700'
                    : ''
                }`}
              >
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {admin.email}
                  </p>
                  {admin.is_super_admin && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded">
                      슈퍼 관리자
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteClick(admin)}
                  className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                관리자 권한 삭제
              </h3>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                해당 유저의 관리자 권한을 삭제하시겠습니까?
              </p>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selectedAdmin.email}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedAdmin(null)
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
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
