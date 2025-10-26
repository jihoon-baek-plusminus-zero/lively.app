'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/hooks/useAdmin'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSettings from '@/components/admin/AdminSettings'
import UserSettings from '@/components/admin/UserSettings'
import BulkUserSettings from '@/components/admin/BulkUserSettings'
import { Loader2, Shield } from 'lucide-react'

type MenuItem = 'admin-settings' | 'user-settings' | 'bulk-user-settings'

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, isSuperAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()
  const [selectedMenu, setSelectedMenu] = useState<MenuItem>('user-settings')

  // Show loading state
  if (authLoading || adminLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary dark:bg-[#3B82F6] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">관리자 권한 확인 중...</p>
        </div>
      </div>
    )
  }

  // If not admin, show access denied message
  if (!user || !isAdmin) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            You don't have access to this page or this page does not exist.
          </p>
          <button
            onClick={() => router.push('/console')}
            className="px-6 py-3 bg-primary dark:bg-[#3B82F6] text-white rounded-lg hover:bg-primary-600 dark:hover:bg-blue-500 transition-colors"
          >
            콘솔로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  // Render content based on selected menu
  const renderContent = () => {
    switch (selectedMenu) {
      case 'admin-settings':
        return <AdminSettings />
      case 'user-settings':
        return <UserSettings />
      case 'bulk-user-settings':
        return <BulkUserSettings />
      default:
        return <UserSettings />
    }
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Left Sidebar */}
      <AdminSidebar
        selectedMenu={selectedMenu}
        onSelectMenu={setSelectedMenu}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-white dark:bg-[#212121]">
        {renderContent()}
      </div>
    </div>
  )
}
