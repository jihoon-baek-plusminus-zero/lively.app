import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface ChatMessage {
  id: string
  lecture_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export function useChatMessages(lectureId: string | null) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 채팅 메시지 불러오기
  const fetchMessages = useCallback(async () => {
    if (!lectureId || !user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('lecture_id', lectureId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])
    } catch (err: any) {
      console.error('채팅 메시지 불러오기 실패:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [lectureId, user])

  // 초기 로드
  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // 메시지 저장
  const saveMessage = useCallback(
    async (role: 'user' | 'assistant', content: string) => {
      if (!lectureId || !user) return null

      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .insert({
            lecture_id: lectureId,
            user_id: user.id,
            role,
            content,
          })
          .select()
          .single()

        if (error) throw error

        // 로컬 상태에 추가
        setMessages(prev => [...prev, data])
        return data
      } catch (err: any) {
        console.error('메시지 저장 실패:', err)
        setError(err.message)
        return null
      }
    },
    [lectureId, user]
  )

  return {
    messages,
    loading,
    error,
    saveMessage,
    refetch: fetchMessages,
  }
}
