'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Clock, ChevronRight, Mic, LogOut, Loader2, MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLectures, type Lecture } from '@/hooks/useLectures'
import { ThemeToggle } from '@/components/ThemeToggle'

interface SidebarProps {
  selectedLectureId: string | null
  onSelectLecture: (lectureId: string) => void
  onCreateLecture: (lecture: Lecture) => void
}

export default function Sidebar({
  selectedLectureId,
  onSelectLecture,
  onCreateLecture,
}: SidebarProps) {
  const { user, signOut } = useAuth()
  const { lectures, loading, createLecture, deleteLecture, updateLectureTitle } = useLectures()
  const [creating, setCreating] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  const handleCreateLecture = async () => {
    setCreating(true)
    const now = new Date()
    const title = `강의 ${now.toLocaleDateString('ko-KR')} ${now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`

    const newLecture = await createLecture(title)
    setCreating(false)

    if (newLecture) {
      onCreateLecture(newLecture)
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`
    }
    return `${minutes}분`
  }

  // 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleEditClick = (lecture: Lecture) => {
    setEditingId(lecture.id)
    setEditingTitle(lecture.title)
    setOpenMenuId(null)
  }

  const handleTitleDoubleClick = (lecture: Lecture) => {
    setEditingId(lecture.id)
    setEditingTitle(lecture.title)
  }

  const handleTitleSave = async () => {
    if (editingId && editingTitle.trim()) {
      await updateLectureTitle(editingId, editingTitle.trim())
      setEditingId(null)
    }
  }

  const handleTitleCancel = () => {
    setEditingId(null)
    setEditingTitle('')
  }

  const handleDeleteClick = async (lecture: Lecture) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await deleteLecture(lecture.id)
      setOpenMenuId(null)
    }
  }

  return (
    <aside className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Livey
          </span>
        </div>

        <button
          onClick={handleCreateLecture}
          disabled={creating}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              새 강의 시작
            </>
          )}
        </button>
      </div>

      {/* Recent Lectures */}
      <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2 px-2 mb-3">
          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            최근 강의
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 dark:text-gray-500" />
          </div>
        ) : lectures.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">강의가 없습니다</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">새 강의를 시작하세요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lectures.map((lecture) => (
              <div
                key={lecture.id}
                className={`relative p-3 rounded-lg transition-all group ${
                  selectedLectureId === lecture.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => !editingId && onSelectLecture(lecture.id)}
                  >
                    {editingId === lecture.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleTitleSave()
                          if (e.key === 'Escape') handleTitleCancel()
                        }}
                        className="w-full px-2 py-1 text-sm font-medium border border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <h3
                        onDoubleClick={() => handleTitleDoubleClick(lecture)}
                        className={`font-medium truncate mb-1 ${
                          selectedLectureId === lecture.id
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {lecture.title}
                      </h3>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(lecture.created_at).toLocaleDateString('ko-KR')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          lecture.status === 'recording'
                            ? 'bg-red-100 text-red-700'
                            : lecture.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {lecture.status === 'recording'
                          ? '녹음 중'
                          : lecture.status === 'completed'
                          ? '완료'
                          : '대기'}
                      </span>
                      <p className="text-xs text-gray-400">
                        {formatDuration(lecture.duration_seconds)}
                      </p>
                    </div>
                  </div>

                  {/* 점 3개 메뉴 */}
                  <div className="relative" ref={openMenuId === lecture.id ? menuRef : null}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === lecture.id ? null : lecture.id)
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>

                    {openMenuId === lecture.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                        <button
                          onClick={() => handleEditClick(lecture)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          이름 수정
                        </button>
                        <button
                          onClick={() => handleDeleteClick(lecture)}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {user?.user_metadata?.full_name || '사용자'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full py-2 px-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
