'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Clock, ChevronRight, Mic, LogOut, Loader2, MoreVertical, Edit2, Trash2, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLectures, type Lecture } from '@/hooks/useLectures'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useLanguage } from '@/contexts/LanguageContext'
import Image from 'next/image'
import LanguageSettingsModal from './LanguageSettingsModal'

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
  const { t } = useLanguage()
  const router = useRouter()
  const { lectures, loading, createLecture, deleteLecture, updateLectureTitle } = useLectures()
  const [creating, setCreating] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  const handleCreateLecture = async (audioLanguages: string[], translateTo?: string) => {
    setCreating(true)
    setShowLanguageModal(false)

    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = now.getHours()
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'pm' : 'am'
    const displayHours = hours % 12 || 12

    const title = `${year}.${month}.${day} ${displayHours}:${minutes} ${ampm} ${t('sidebar.default.title.recording')}`

    const newLecture = await createLecture(title, audioLanguages, translateTo)
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
      return `${hours}${t('sidebar.duration.hours')} ${minutes}${t('sidebar.duration.minutes')}`
    }
    return `${minutes}${t('sidebar.duration.minutes')}`
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
    if (confirm(t('sidebar.delete.confirm'))) {
      await deleteLecture(lecture.id)
      setOpenMenuId(null)
    }
  }

  return (
    <aside className="w-80 bg-white dark:bg-[#202020] border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <Image
            src="/logo.png"
            alt="Livey Logo"
            width={200}
            height={50}
            className="h-10 w-auto"
          />
        </div>

        <button
          onClick={() => setShowLanguageModal(true)}
          disabled={creating}
          className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('sidebar.creating')}
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              {t('sidebar.new.lecture')}
            </>
          )}
        </button>
      </div>

      {/* Lectures List */}
      <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-[#202020]">

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 dark:text-gray-500" />
          </div>
        ) : lectures.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('sidebar.no.lectures')}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('sidebar.start.new')}</p>
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
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : lecture.status === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : lecture.status === 'not_recorded'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {lecture.status === 'recording'
                          ? t('sidebar.status.recording')
                          : lecture.status === 'completed'
                          ? t('sidebar.status.completed')
                          : lecture.status === 'not_recorded'
                          ? t('sidebar.status.not.recorded')
                          : t('sidebar.status.pending')}
                      </span>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
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
                          {t('sidebar.menu.edit')}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(lecture)}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('sidebar.menu.delete')}
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#202020]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary dark:bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-semibold">
            {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {user?.user_metadata?.full_name || t('profile.user.default')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          </div>
          {/* Language Selector - Compact Square */}
          <div className="flex-shrink-0">
            <LanguageSelector position="top" />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleLogout}
            className="flex-1 py-2 px-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {t('sidebar.logout')}
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="flex-1 py-2 px-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            {t('sidebar.my.profile')}
          </button>
        </div>
      </div>

      {/* Language Settings Modal */}
      {showLanguageModal && (
        <LanguageSettingsModal
          onConfirm={handleCreateLecture}
          onClose={() => setShowLanguageModal(false)}
        />
      )}
    </aside>
  )
}
