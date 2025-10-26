import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UserUsage } from './useUserUsage'

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

      // Get user by email using RPC function
      const { data: userData, error: userError } = await supabase.rpc(
        'get_user_by_email',
        { user_email: email }
      )

      if (userError) {
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
          if (usageError.code === 'PGRST116') {
            setError('해당 이메일의 사용자를 찾을 수 없습니다.')
            return null
          }
          throw usageError
        }

        return {
          id: usageData.user_id,
          email: email,
          usage: usageData,
        }
      }

      if (!userData) {
        setError('해당 이메일의 사용자를 찾을 수 없습니다.')
        return null
      }

      // Get user usage data
      const { data: usageData, error: usageError } = await supabase
        .from('user_usages')
        .select('*')
        .eq('user_id', userData.id)
        .single()

      if (usageError) {
        if (usageError.code === 'PGRST116') {
          setError('사용자 정보를 찾을 수 없습니다.')
          return null
        }
        throw usageError
      }

      return {
        id: userData.id,
        email: userData.email,
        usage: usageData,
      }
    } catch (err) {
      console.error('Error searching user:', err)
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

      const seconds = hours * 3600

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
      console.error('Error updating recording quota:', err)
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
      console.error('Error updating AI quota:', err)
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
      console.error('Error deleting user:', err)
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

      // Get all users from auth.users via RPC or join with user_usages
      const { data, error: queryError } = await supabase
        .from('user_usages')
        .select(`
          *,
          users:user_id (
            id,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (queryError) throw queryError

      if (!data) return []

      // Transform the data
      const users: UserWithUsage[] = data
        .filter((item: any) => item.users && item.users.email)
        .map((item: any) => ({
          id: item.user_id,
          email: item.users.email,
          usage: {
            id: item.id,
            user_id: item.user_id,
            signed_up_date: item.signed_up_date,
            total_recordable_time: item.total_recordable_time,
            total_recorded_time: item.total_recorded_time,
            total_ai_credit: item.total_ai_credit,
            total_ai_used: item.total_ai_used,
            current_period_start: item.current_period_start,
            created_at: item.created_at,
            updated_at: item.updated_at,
          },
        }))

      return users
    } catch (err) {
      console.error('Error fetching all users:', err)
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

      const seconds = hours * 3600

      // Update each user
      for (const userId of userIds) {
        // Get current quota
        const { data: currentData, error: fetchError } = await supabase
          .from('user_usages')
          .select('total_recordable_time')
          .eq('user_id', userId)
          .single()

        if (fetchError) {
          console.error(`Error fetching quota for user ${userId}:`, fetchError)
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
          console.error(`Error updating quota for user ${userId}:`, updateError)
        }
      }

      return true
    } catch (err) {
      console.error('Error bulk updating recording quota:', err)
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
          console.error(`Error fetching AI quota for user ${userId}:`, fetchError)
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
          console.error(`Error updating AI quota for user ${userId}:`, updateError)
        }
      }

      return true
    } catch (err) {
      console.error('Error bulk updating AI quota:', err)
      setError(err instanceof Error ? err.message : 'AI 크레딧 일괄 업데이트 중 오류가 발생했습니다.')
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
    deleteUser,
    getAllUsers,
    bulkUpdateRecordingQuota,
    bulkUpdateAIQuota,
  }
}
