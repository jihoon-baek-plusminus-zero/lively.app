import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UserUsage } from './useUserUsage'
import { logger } from '@/lib/logger'

export interface UserWithUsage {
  id: string
  email: string
  usage: UserUsage
}

export function useUserManagement() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchUserByEmail = async (email: string): Promise<UserWithUsage | null> => {
    try {
      setLoading(true)
      setError(null)

      logger.log(`[searchUserByEmail] Searching for user: ${email}`)

      // Get user by email using RPC function
      const { data: userData, error: userError } = await supabase.rpc(
        'get_user_by_email',
        { user_email: email }
      )

      if (userError) {
        logger.log('[searchUserByEmail] RPC error, trying direct query:', userError)
        // If RPC doesn't exist, try direct query on user_usages
        const { data: usageData, error: usageError } = await supabase
          .from('user_usages')
          .select(`
            *,
            users:user_id (
              email
            )
          `)
          .eq('users.email', email)
          .single()

        if (usageError) {
          logger.error('[searchUserByEmail] Direct query error:', usageError)
          if (usageError.code === 'PGRST116') {
            setError('해당 이메일의 사용자를 찾을 수 없습니다.')
            return null
          }
          throw usageError
        }

        logger.log('[searchUserByEmail] Direct query result:', usageData)

        return {
          id: usageData.user_id,
          email: email,
          usage: usageData,
        }
      }

      if (!userData) {
        logger.log('[searchUserByEmail] No user data found')
        setError('해당 이메일의 사용자를 찾을 수 없습니다.')
        return null
      }

      logger.log('[searchUserByEmail] User data from RPC:', userData)

      // Get user usage data
      const { data: usageData, error: usageError } = await supabase
        .from('user_usages')
        .select('*')
        .eq('user_id', userData.id)
        .single()

      if (usageError) {
        logger.error('[searchUserByEmail] Usage query error:', usageError)
        if (usageError.code === 'PGRST116') {
          setError('사용자 정보를 찾을 수 없습니다.')
          return null
        }
        throw usageError
      }

      logger.log('[searchUserByEmail] Usage data:', usageData)
      logger.log('[searchUserByEmail] Purchased credits:', {
        purchased_recording_time: usageData.purchased_recording_time,
        purchased_ai_credit: usageData.purchased_ai_credit
      })

      return {
        id: userData.id,
        email: userData.email,
        usage: usageData,
      }
    } catch (err) {
      logger.error('[searchUserByEmail] Error:', err)
      setError(err instanceof Error ? err.message : '사용자 검색 중 오류가 발생했습니다.')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateRecordingQuota = async (
    userId: string,
    operation: 'add' | 'subtract',
    hours: number
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const seconds = Math.round(hours * 3600) // Round to integer

      // Get current quota
      const { data: currentData, error: fetchError } = await supabase
        .from('user_usages')
        .select('total_recordable_time')
        .eq('user_id', userId)
        .single()

      if (fetchError) throw fetchError

      const newQuota =
        operation === 'add'
          ? currentData.total_recordable_time + seconds
          : Math.max(0, currentData.total_recordable_time - seconds)

      // Update quota
      const { error: updateError } = await supabase
        .from('user_usages')
        .update({
          total_recordable_time: newQuota,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (updateError) throw updateError

      return true
    } catch (err) {
      logger.error('Error updating recording quota:', err)
      setError(err instanceof Error ? err.message : '녹음 한도 업데이트 중 오류가 발생했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateAIQuota = async (
    userId: string,
    operation: 'add' | 'subtract',
    credits: number
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      // Get current quota
      const { data: currentData, error: fetchError } = await supabase
        .from('user_usages')
        .select('total_ai_credit')
        .eq('user_id', userId)
        .single()

      if (fetchError) throw fetchError

      const newQuota =
        operation === 'add'
          ? currentData.total_ai_credit + credits
          : Math.max(0, currentData.total_ai_credit - credits)

      // Update quota
      const { error: updateError } = await supabase
        .from('user_usages')
        .update({
          total_ai_credit: newQuota,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (updateError) throw updateError

      return true
    } catch (err) {
      logger.error('Error updating AI quota:', err)
      setError(err instanceof Error ? err.message : 'AI 크레딧 업데이트 중 오류가 발생했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      // Use the admin delete user RPC if available
      const { error: rpcError } = await supabase.rpc('admin_delete_user', {
        target_user_id: userId,
      })

      if (rpcError) {
        // Fallback: manually delete user data
        // Delete in order: embeddings, captions, chat_messages, lectures, user_usages, admin_users (if exists)
        const { error: deleteError } = await supabase
          .from('user_usages')
          .delete()
          .eq('user_id', userId)

        if (deleteError) throw deleteError

        // Note: Actual user deletion from auth.users requires admin privileges
        // This will need to be handled server-side or with proper admin RPC
        throw new Error('사용자 삭제를 위해서는 관리자 권한이 필요합니다.')
      }

      return true
    } catch (err) {
      logger.error('Error deleting user:', err)
      setError(err instanceof Error ? err.message : '사용자 삭제 중 오류가 발생했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const getAllUsers = async (): Promise<UserWithUsage[]> => {
    try {
      setLoading(true)
      setError(null)

      logger.log('[getAllUsers] Starting to fetch all users...')

      // Use RPC function to get all users with usage data
      const { data, error: rpcError } = await supabase.rpc('get_all_users_with_usage')

      if (rpcError) {
        logger.error('[getAllUsers] RPC error:', rpcError)
        throw rpcError
      }

      logger.log('[getAllUsers] RPC returned data:', data)

      if (!data || data.length === 0) {
        logger.log('[getAllUsers] No users found')
        return []
      }

      // Transform the data
      const users: UserWithUsage[] = data.map((item: any) => {
        const user = {
          id: item.user_id,
          email: item.email,
          usage: {
            id: '', // RPC doesn't return this, but it's not used in UI
            user_id: item.user_id,
            signed_up_date: item.signed_up_date,
            total_recordable_time: item.total_recordable_time,
            total_recorded_time: item.total_recorded_time,
            total_ai_credit: item.total_ai_credit,
            total_ai_used: item.total_ai_used,
            purchased_recording_time: item.purchased_recording_time || 0,
            purchased_ai_credit: item.purchased_ai_credit || 0,
            current_period_start: item.current_period_start,
            created_at: item.created_at,
            updated_at: item.updated_at,
          },
        }
        logger.log(`[getAllUsers] Mapped user ${item.email}:`, {
          purchased_recording_time: user.usage.purchased_recording_time,
          purchased_ai_credit: user.usage.purchased_ai_credit
        })
        return user
      })

      logger.log('[getAllUsers] Successfully fetched and mapped', users.length, 'users')

      return users
    } catch (err) {
      logger.error('[getAllUsers] Error:', err)
      setError(err instanceof Error ? err.message : '사용자 목록을 불러오는 중 오류가 발생했습니다.')
      return []
    } finally {
      setLoading(false)
    }
  }

  const bulkUpdateRecordingQuota = async (
    userIds: string[],
    operation: 'add' | 'subtract',
    hours: number
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const seconds = Math.round(hours * 3600) // Round to integer

      // Update each user
      for (const userId of userIds) {
        // Get current quota
        const { data: currentData, error: fetchError } = await supabase
          .from('user_usages')
          .select('total_recordable_time')
          .eq('user_id', userId)
          .single()

        if (fetchError) {
          logger.error(`Error fetching quota for user ${userId}:`, fetchError)
          continue
        }

        const newQuota =
          operation === 'add'
            ? currentData.total_recordable_time + seconds
            : Math.max(0, currentData.total_recordable_time - seconds)

        // Update quota
        const { error: updateError } = await supabase
          .from('user_usages')
          .update({
            total_recordable_time: newQuota,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        if (updateError) {
          logger.error(`Error updating quota for user ${userId}:`, updateError)
        }
      }

      return true
    } catch (err) {
      logger.error('Error bulk updating recording quota:', err)
      setError(err instanceof Error ? err.message : '녹음 한도 일괄 업데이트 중 오류가 발생했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const bulkUpdateAIQuota = async (
    userIds: string[],
    operation: 'add' | 'subtract',
    credits: number
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      // Update each user
      for (const userId of userIds) {
        // Get current quota
        const { data: currentData, error: fetchError } = await supabase
          .from('user_usages')
          .select('total_ai_credit')
          .eq('user_id', userId)
          .single()

        if (fetchError) {
          logger.error(`Error fetching AI quota for user ${userId}:`, fetchError)
          continue
        }

        const newQuota =
          operation === 'add'
            ? currentData.total_ai_credit + credits
            : Math.max(0, currentData.total_ai_credit - credits)

        // Update quota
        const { error: updateError } = await supabase
          .from('user_usages')
          .update({
            total_ai_credit: newQuota,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        if (updateError) {
          logger.error(`Error updating AI quota for user ${userId}:`, updateError)
        }
      }

      return true
    } catch (err) {
      logger.error('Error bulk updating AI quota:', err)
      setError(err instanceof Error ? err.message : 'AI 크레딧 일괄 업데이트 중 오류가 발생했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const updatePurchasedRecordingTime = async (
    userId: string,
    operation: 'add' | 'subtract',
    hours: number
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const seconds = Math.round(hours * 3600) // Round to integer
      logger.log(`[updatePurchasedRecordingTime] Starting - userId: ${userId}, operation: ${operation}, hours: ${hours}, seconds: ${seconds}`)

      // Get current purchased time
      const { data: currentData, error: fetchError } = await supabase
        .from('user_usages')
        .select('purchased_recording_time')
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        logger.error('[updatePurchasedRecordingTime] Fetch error:', fetchError)
        throw fetchError
      }

      logger.log('[updatePurchasedRecordingTime] Current data:', currentData)

      const currentValue = currentData.purchased_recording_time || 0
      const newTime =
        operation === 'add'
          ? currentValue + seconds
          : Math.max(0, currentValue - seconds)

      logger.log(`[updatePurchasedRecordingTime] Current value: ${currentValue}, New value: ${newTime}`)

      // Update purchased time
      const { data: updateData, error: updateError } = await supabase
        .from('user_usages')
        .update({
          purchased_recording_time: newTime,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()

      if (updateError) {
        logger.error('[updatePurchasedRecordingTime] Update error:', updateError)
        throw updateError
      }

      logger.log('[updatePurchasedRecordingTime] Update successful:', updateData)

      return true
    } catch (err) {
      logger.error('[updatePurchasedRecordingTime] Error:', err)
      setError(err instanceof Error ? err.message : '추가구매 녹음 시간 업데이트 중 오류가 발생했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const updatePurchasedAICredit = async (
    userId: string,
    operation: 'add' | 'subtract',
    credits: number
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      logger.log(`[updatePurchasedAICredit] Starting - userId: ${userId}, operation: ${operation}, credits: ${credits}`)

      // Get current purchased credits
      const { data: currentData, error: fetchError } = await supabase
        .from('user_usages')
        .select('purchased_ai_credit')
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        logger.error('[updatePurchasedAICredit] Fetch error:', fetchError)
        throw fetchError
      }

      logger.log('[updatePurchasedAICredit] Current data:', currentData)

      const currentValue = currentData.purchased_ai_credit || 0
      const newCredits =
        operation === 'add'
          ? currentValue + credits
          : Math.max(0, currentValue - credits)

      logger.log(`[updatePurchasedAICredit] Current value: ${currentValue}, New value: ${newCredits}`)

      // Update purchased credits
      const { data: updateData, error: updateError } = await supabase
        .from('user_usages')
        .update({
          purchased_ai_credit: newCredits,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()

      if (updateError) {
        logger.error('[updatePurchasedAICredit] Update error:', updateError)
        throw updateError
      }

      logger.log('[updatePurchasedAICredit] Update successful:', updateData)

      return true
    } catch (err) {
      logger.error('[updatePurchasedAICredit] Error:', err)
      setError(err instanceof Error ? err.message : '추가구매 AI 크레딧 업데이트 중 오류가 발생했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const bulkUpdatePurchasedRecordingTime = async (
    userIds: string[],
    operation: 'add' | 'subtract',
    hours: number
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const seconds = Math.round(hours * 3600) // Round to integer

      // Update each user
      for (const userId of userIds) {
        // Get current purchased time
        const { data: currentData, error: fetchError } = await supabase
          .from('user_usages')
          .select('purchased_recording_time')
          .eq('user_id', userId)
          .single()

        if (fetchError) {
          logger.error(`Error fetching purchased time for user ${userId}:`, fetchError)
          continue
        }

        const newTime =
          operation === 'add'
            ? (currentData.purchased_recording_time || 0) + seconds
            : Math.max(0, (currentData.purchased_recording_time || 0) - seconds)

        // Update purchased time
        const { error: updateError } = await supabase
          .from('user_usages')
          .update({
            purchased_recording_time: newTime,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        if (updateError) {
          logger.error(`Error updating purchased time for user ${userId}:`, updateError)
        }
      }

      return true
    } catch (err) {
      logger.error('Error bulk updating purchased recording time:', err)
      setError(err instanceof Error ? err.message : '추가구매 녹음 시간 일괄 업데이트 중 오류가 발생했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const bulkUpdatePurchasedAICredit = async (
    userIds: string[],
    operation: 'add' | 'subtract',
    credits: number
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      // Update each user
      for (const userId of userIds) {
        // Get current purchased credits
        const { data: currentData, error: fetchError } = await supabase
          .from('user_usages')
          .select('purchased_ai_credit')
          .eq('user_id', userId)
          .single()

        if (fetchError) {
          logger.error(`Error fetching purchased AI credit for user ${userId}:`, fetchError)
          continue
        }

        const newCredits =
          operation === 'add'
            ? (currentData.purchased_ai_credit || 0) + credits
            : Math.max(0, (currentData.purchased_ai_credit || 0) - credits)

        // Update purchased credits
        const { error: updateError } = await supabase
          .from('user_usages')
          .update({
            purchased_ai_credit: newCredits,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        if (updateError) {
          logger.error(`Error updating purchased AI credit for user ${userId}:`, updateError)
        }
      }

      return true
    } catch (err) {
      logger.error('Error bulk updating purchased AI credit:', err)
      setError(err instanceof Error ? err.message : '추가구매 AI 크레딧 일괄 업데이트 중 오류가 발생했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    searchUserByEmail,
    updateRecordingQuota,
    updateAIQuota,
    updatePurchasedRecordingTime,
    updatePurchasedAICredit,
    deleteUser,
    getAllUsers,
    bulkUpdateRecordingQuota,
    bulkUpdateAIQuota,
    bulkUpdatePurchasedRecordingTime,
    bulkUpdatePurchasedAICredit,
  }
}
