import { useCallback } from 'react'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

export function useCaptions() {
  // 자막 저장 (저장된 자막 ID 반환)
  const saveCaption = useCallback(
    async (
      lectureId: string,
      text: string,
      timestampSeconds: number,
      speaker?: string,
      translatedText?: string
    ): Promise<string | null> => {
      try {
        const { data, error } = await supabase
          .from('captions')
          .insert({
            lecture_id: lectureId,
            text,
            timestamp_seconds: timestampSeconds,
            speaker: speaker || '화자',
            is_final: true,
            translated_text: translatedText || null,
          })
          .select('id')
          .single()

        if (error) throw error

        logger.log('✅ 자막 저장 성공:', text.substring(0, 30), translatedText ? '(번역 포함)' : '', 'ID:', data.id)
        return data.id
      } catch (err: any) {
        logger.error('❌ 자막 저장 실패:', err)
        return null
      }
    },
    []
  )

  // 자막 번역 업데이트
  const updateCaptionTranslation = useCallback(
    async (captionId: string, translatedText: string) => {
      try {
        const { error } = await supabase
          .from('captions')
          .update({ translated_text: translatedText })
          .eq('id', captionId)

        if (error) throw error
        logger.log('✅ 번역 DB 업데이트 성공:', captionId.substring(0, 10))
      } catch (err: any) {
        logger.error('❌ 번역 DB 업데이트 실패:', err)
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
      logger.error('자막 가져오기 실패:', err)
      return []
    }
  }, [])

  return {
    saveCaption,
    updateCaptionTranslation,
    fetchCaptions,
  }
}
