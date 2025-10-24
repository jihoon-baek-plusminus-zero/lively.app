'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="w-full h-9 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setTheme('light')}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${
          theme === 'light'
            ? 'bg-blue-500 text-white shadow-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title="라이트 모드"
      >
        <Sun className="w-4 h-4" />
        <span className="text-sm font-medium">Light</span>
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${
          theme === 'dark'
            ? 'bg-blue-500 text-white shadow-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title="다크 모드"
      >
        <Moon className="w-4 h-4" />
        <span className="text-sm font-medium">Dark</span>
      </button>
    </div>
  )
}
