import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useCaptions() {
  // 자막 저장
  const saveCaption = useCallback(
    async (
      lectureId: string,
      text: string,
      timestampSeconds: number,
      speaker?: string
    ) => {
      try {
        const { error } = await supabase.from('captions').insert({
          lecture_id: lectureId,
          text,
          timestamp_seconds: timestampSeconds,
          speaker: speaker || '화자',
          is_final: true,
        })

        if (error) throw error

        console.log('✅ 자막 저장 성공:', text.substring(0, 30))
      } catch (err: any) {
        console.error('❌ 자막 저장 실패:', err)
      }
    },
    []
  )

  // 강의의 자막 가져오기
  const fetchCaptions = useCallback(async (lectureId: string) => {
    try {
      const { data, error } = await supabase
        .from('captions')
        .select('*')
        .eq('lecture_id', lectureId)
        .order('timestamp_seconds', { ascending: true })

      if (error) throw error

      return data || []
    } catch (err: any) {
      console.error('자막 가져오기 실패:', err)
      return []
    }
  }, [])

  return {
    saveCaption,
    fetchCaptions,
  }
}
