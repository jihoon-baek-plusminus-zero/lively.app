import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface AdminUser {
  id: string
  user_id: string
  email: string
  is_super_admin: boolean
  created_at: string
  updated_at: string
}

export function useAdmin() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      setIsSuperAdmin(false)
      setLoading(false)
      return
    }

    const checkAdminStatus = async () => {
      try {
        console.log('🔍 Checking admin status for user:', user.id, user.email)

        // Check by user_id first
        const { data: dataById, error: errorById } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .limit(1)

        console.log('📊 Admin query by user_id:', { dataById, errorById })

        // If not found by user_id, try by email
        if (!dataById || dataById.length === 0) {
          const { data: dataByEmail, error: errorByEmail } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', user.email)
            .limit(1)

          console.log('📊 Admin query by email:', { dataByEmail, errorByEmail })

          if (dataByEmail && dataByEmail.length > 0) {
            console.log('✅ User is admin (by email)! Super admin:', dataByEmail[0].is_super_admin)
            setIsAdmin(true)
            setIsSuperAdmin(dataByEmail[0].is_super_admin)
          } else {
            console.log('❌ User is not an admin')
            setIsAdmin(false)
            setIsSuperAdmin(false)
          }
        } else {
          console.log('✅ User is admin (by user_id)! Super admin:', dataById[0].is_super_admin)
          setIsAdmin(true)
          setIsSuperAdmin(dataById[0].is_super_admin)
        }
      } catch (err) {
        console.error('Error checking admin status:', err)
        setIsAdmin(false)
        setIsSuperAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [user])

  return { isAdmin, isSuperAdmin, loading }
}

export function useAdminUsers() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAdminUsers = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setAdminUsers(data || [])
    } catch (err: any) {
      console.error('Error fetching admin users:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminUsers()
  }, [])

  const addAdmin = async (email: string, isSuperAdmin: boolean = false) => {
    try {
      // Try to get user_id from auth.users by querying directly
      // This avoids relying on RPC function which might not exist
      const { data: users, error: queryError } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', email)
        .limit(1)

      // Check if admin already exists
      if (users && users.length > 0) {
        setError('이미 관리자로 등록된 이메일입니다.')
        return false
      }

      // Use RPC to call get_user_by_email function
      const { data: userData, error: rpcError } = await supabase.rpc(
        'get_user_by_email',
        { user_email: email }
      )

      console.log('RPC get_user_by_email result:', { userData, rpcError })

      let userId = null
      if (userData && userData.length > 0) {
        userId = userData[0].id
      }

      console.log('Inserting admin with user_id:', userId, 'email:', email)

      // Insert admin user
      const insertData: any = {
        email,
        is_super_admin: isSuperAdmin,
      }

      // Only add user_id if it exists
      if (userId) {
        insertData.user_id = userId
      }

      const { error: insertError } = await supabase
        .from('admin_users')
        .insert(insertData)

      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }

      await fetchAdminUsers()
      return true
    } catch (err: any) {
      console.error('Error adding admin:', err)
      setError(err.message || 'Failed to add admin')
      return false
    }
  }

  const removeAdmin = async (id: string) => {
    try {
      const { error } = await supabase.from('admin_users').delete().eq('id', id)

      if (error) throw error

      await fetchAdminUsers()
      return true
    } catch (err: any) {
      console.error('Error removing admin:', err)
      setError(err.message)
      return false
    }
  }

  return {
    adminUsers,
    loading,
    error,
    addAdmin,
    removeAdmin,
    refetch: fetchAdminUsers,
  }
}
