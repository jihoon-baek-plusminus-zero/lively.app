import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'

export interface UserUsage {
  id: string
  user_id: string
  signed_up_date: string
  total_recordable_time: number // seconds - monthly subscription quota
  total_recorded_time: number // seconds - usage this month
  total_ai_credit: number // monthly subscription quota
  total_ai_used: number // usage this month
  purchased_recording_time: number // seconds - one-time purchased credits
  purchased_ai_credit: number // one-time purchased credits
  current_period_start: string
  created_at: string
  updated_at: string
}

export function useUserUsage() {
  const { user } = useAuth()
  const [usage, setUsage] = useState<UserUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = async () => {
    if (!user) {
      setLoading(false)
      return
    }
      try {
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
        // Silently fail if table doesn't exist yet (migration not run)
        const errorMessage = err instanceof Error ? err.message : ''
        if (!errorMessage.includes('relation "public.user_usages" does not exist')) {
          logger.error('Error fetching user usage:', err)
          setError(err instanceof Error ? err.message : 'Failed to load usage data')
        }
        // Set default usage data when table doesn't exist
        setUsage({
          id: '',
          user_id: user.id,
          signed_up_date: new Date().toISOString(),
          total_recordable_time: 10800,
          total_recorded_time: 0,
          total_ai_credit: 1000,
          total_ai_used: 0,
          purchased_recording_time: 0,
          purchased_ai_credit: 0,
          current_period_start: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
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

  // Get purchased recording time (in hours, minutes, seconds)
  const getPurchasedRecordingTime = () => {
    if (!usage) return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 }
    const totalSeconds = usage.purchased_recording_time || 0
    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      totalSeconds,
    }
  }

  // Get purchased AI credits
  const getPurchasedAICredit = () => {
    if (!usage) return 0
    return usage.purchased_ai_credit || 0
  }

  // Get total remaining recording time (monthly + purchased)
  const getTotalRemainingRecordingTime = () => {
    const monthly = getRemainingRecordingTime()
    const purchased = getPurchasedRecordingTime()
    const totalSeconds = monthly.totalSeconds + purchased.totalSeconds
    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      totalSeconds,
    }
  }

  // Get total remaining AI credits (monthly + purchased)
  const getTotalRemainingAICredit = () => {
    const monthly = getRemainingAICredit()
    const purchased = getPurchasedAICredit()
    return monthly + purchased
  }

  return {
    usage,
    loading,
    error,
    getRemainingRecordingTime,
    getRecordedTime,
    getTotalQuotaTime,
    getRemainingAICredit,
    getPurchasedRecordingTime,
    getPurchasedAICredit,
    getTotalRemainingRecordingTime,
    getTotalRemainingAICredit,
    refetchUsage: fetchUsage,
  }
}
