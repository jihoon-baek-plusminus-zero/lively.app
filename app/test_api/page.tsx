'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { UserCheck, Globe2, Clock } from 'lucide-react'
import { logger } from '@/lib/logger'

interface Notification {
  id: string
  name: string
  nationality: string
  created_at: string
}

export default function TestApiDashboard() {
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null)
  const [allNotifications, setAllNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch initial data
  useEffect(() => {
    fetchNotifications()
  }, [])

  // Subscribe to real-time updates
  useEffect(() => {
    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      logger.log('[TEST-DASHBOARD] 🔌 Setting up realtime subscription')

      channel = supabase
        .channel('test-notifications-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'test_notifications',
          },
          (payload) => {
            logger.log('[TEST-DASHBOARD] 📨 New notification received:', payload.new)
            const newNotification = payload.new as Notification

            // Update latest notification with animation
            setLatestNotification(newNotification)

            // Add to all notifications list
            setAllNotifications((prev) => [newNotification, ...prev])

            // Reset to default state after 5 seconds
            setTimeout(() => {
              setLatestNotification(null)
            }, 5000)
          }
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    // Cleanup
    return () => {
      if (channel) {
        logger.log('[TEST-DASHBOARD] 🔌 Unsubscribing from realtime channel')
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      logger.log('[TEST-DASHBOARD] 📊 Fetching notifications')

      const { data, error } = await supabase
        .from('test_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        logger.error('[TEST-DASHBOARD] ❌ Error fetching notifications:', error)
        return
      }

      logger.log('[TEST-DASHBOARD] ✅ Fetched notifications:', data.length)

      setAllNotifications(data)
      if (data.length > 0) {
        setLatestNotification(data[0])
      }
    } catch (error) {
      logger.error('[TEST-DASHBOARD] ❌ Unexpected error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Livey Welcome Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Real-time visitor notifications from Bubble.io
          </p>
        </div>

        {/* Latest Notification - Big Display */}
        {latestNotification ? (
          <div className="mb-12 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12 border-4 border-blue-500 dark:border-blue-600">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full mb-6">
                  <UserCheck className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>

                <h2 className="text-6xl font-bold text-gray-900 dark:text-white mb-8 animate-slide-up">
                  Welcome, {latestNotification.name}!
                </h2>

                <div className="flex items-center justify-center gap-3 text-4xl text-gray-700 dark:text-gray-300 mb-6">
                  <Globe2 className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold">from {latestNotification.nationality}</span>
                </div>

                <div className="flex items-center justify-center gap-2 text-xl text-gray-500 dark:text-gray-400">
                  <Clock className="w-6 h-6" />
                  <span>{formatTime(latestNotification.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full mb-6">
                  <UserCheck className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h2 className="text-4xl font-bold text-gray-400 dark:text-gray-500 mb-4">
                  Waiting for visitors...
                </h2>
                <p className="text-xl text-gray-500 dark:text-gray-400">
                  Notifications will appear here in real-time
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Notifications History */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Recent Visitors
          </h3>

          {allNotifications.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                    index === 0
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        index === 0
                          ? 'bg-blue-200 dark:bg-blue-800'
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <UserCheck
                        className={`w-6 h-6 ${
                          index === 0
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {notification.name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Globe2 className="w-4 h-4" />
                        <span>{notification.nationality}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(notification.created_at)}
                    </p>
                    {index === 0 && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        Latest
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-400 dark:text-gray-500">No visitors yet</p>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="mt-8 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Total Visitors: <span className="font-bold text-blue-600 dark:text-blue-400">{allNotifications.length}</span>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}
