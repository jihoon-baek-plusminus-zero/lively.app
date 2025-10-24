import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Caption {
  id: string
  lecture_id: string
  text: string
  speaker: string
  language: string
  timestamp_seconds: number
  is_final: boolean
  translated_text?: string // 번역된 텍스트 (optional)
  created_at: string
}

export function useCaptionsList(lectureId: string | null) {
  const [captions, setCaptions] = useState<Caption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCaptions = useCallback(async () => {
    if (!lectureId) {
      setCaptions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('captions')
        .select('*')
        .eq('lecture_id', lectureId)
        .eq('is_final', true)
        .order('timestamp_seconds', { ascending: true })

      if (error) throw error

      setCaptions(data || [])
    } catch (err: any) {
      console.error('자막 목록 가져오기 실패:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [lectureId])

  useEffect(() => {
    fetchCaptions()
  }, [fetchCaptions])

  return {
    captions,
    loading,
    error,
    refetch: fetchCaptions,
  }
}
