import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface UserUsage {
  id: string
  user_id: string
  signed_up_date: string
  total_recordable_time: number // seconds
  total_recorded_time: number // seconds
  total_ai_credit: number
  total_ai_used: number
  current_period_start: string
  created_at: string
  updated_at: string
}

export function useUserUsage() {
  const { user } = useAuth()
  const [usage, setUsage] = useState<UserUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchUsage = async () => {
      try {
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('user_usages')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (fetchError) {
          // If no usage record exists, create one
          if (fetchError.code === 'PGRST116') {
            const { data: newData, error: insertError } = await supabase
              .from('user_usages')
              .insert({
                user_id: user.id,
                signed_up_date: new Date().toISOString(),
                total_recordable_time: 10800, // 3 hours
                total_recorded_time: 0,
                total_ai_credit: 1000,
                total_ai_used: 0,
                current_period_start: new Date(new Date().setDate(1)).toISOString(),
              })
              .select()
              .single()

            if (insertError) throw insertError
            setUsage(newData)
          } else {
            throw fetchError
          }
        } else {
          setUsage(data)
        }
      } catch (err) {
        console.error('Error fetching user usage:', err)
        setError(err instanceof Error ? err.message : 'Failed to load usage data')
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
  }, [user])

  // Helper functions to format time
  const getRemainingRecordingTime = () => {
    if (!usage) return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 }
    const remainingSeconds = Math.max(0, usage.total_recordable_time - usage.total_recorded_time)
    return {
      hours: Math.floor(remainingSeconds / 3600),
      minutes: Math.floor((remainingSeconds % 3600) / 60),
      seconds: remainingSeconds % 60,
      totalSeconds: remainingSeconds,
    }
  }

  const getRecordedTime = () => {
    if (!usage) return { hours: 0, minutes: 0, seconds: 0 }
    return {
      hours: Math.floor(usage.total_recorded_time / 3600),
      minutes: Math.floor((usage.total_recorded_time % 3600) / 60),
      seconds: usage.total_recorded_time % 60,
    }
  }

  const getTotalQuotaTime = () => {
    if (!usage) return { hours: 0, minutes: 0, seconds: 0 }
    return {
      hours: Math.floor(usage.total_recordable_time / 3600),
      minutes: Math.floor((usage.total_recordable_time % 3600) / 60),
      seconds: usage.total_recordable_time % 60,
    }
  }

  const getRemainingAICredit = () => {
    if (!usage) return 0
    return Math.max(0, usage.total_ai_credit - usage.total_ai_used)
  }

  return {
    usage,
    loading,
    error,
    getRemainingRecordingTime,
    getRecordedTime,
    getTotalQuotaTime,
    getRemainingAICredit,
  }
}
