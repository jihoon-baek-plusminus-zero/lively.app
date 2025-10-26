'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Shield, Users, UserCog, LogOut, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSelector } from '@/components/LanguageSelector'

type MenuItem = 'admin-settings' | 'user-settings' | 'bulk-user-settings'

interface MenuItemData {
  id: MenuItem
  label: string
  icon: React.ReactNode
  superAdminOnly?: boolean
}

interface AdminSidebarProps {
  selectedMenu: MenuItem
  onSelectMenu: (menu: MenuItem) => void
  isSuperAdmin: boolean
}

export default function AdminSidebar({ selectedMenu, onSelectMenu, isSuperAdmin }: AdminSidebarProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const menuItems: MenuItemData[] = [
    {
      id: 'admin-settings',
      label: '관리자 설정',
      icon: <Shield className="w-5 h-5" />,
      superAdminOnly: true,
    },
    {
      id: 'bulk-user-settings',
      label: '유저 일괄 설정',
      icon: <UserCog className="w-5 h-5" />,
    },
  ]

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  const handleBackToConsole = () => {
    router.push('/console')
  }

  return (
    <aside className="w-64 bg-[#F9F9F9] dark:bg-[#181818] border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <Image
            src="/logo.png"
            alt="Livey Logo"
            width={200}
            height={50}
            className="h-10 w-auto"
          />
        </div>

        {/* Back to Console Button */}
        <button
          onClick={handleBackToConsole}
          className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          콘솔로 돌아가기
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#F9F9F9] dark:bg-[#181818]">
        <div className="space-y-1">
          {menuItems.map((item) => {
            // Skip super admin only items if user is not super admin
            if (item.superAdminOnly && !isSuperAdmin) {
              return null
            }

            const isSelected = selectedMenu === item.id

            return (
              <button
                key={item.id}
                onClick={() => onSelectMenu(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                }`}
              >
                <div className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-[#F9F9F9] dark:bg-[#181818]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary dark:bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-semibold">
            {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {user?.user_metadata?.full_name || '관리자'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          </div>
          {/* Language Selector */}
          <div className="flex-shrink-0">
            <LanguageSelector position="top" />
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
