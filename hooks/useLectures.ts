import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface Lecture {
  id: string
  user_id: string
  title: string
  description: string | null
  status: 'draft' | 'recording' | 'completed'
  audio_file_url: string | null
  started_at: string | null
  ended_at: string | null
  duration_seconds: number
  audio_languages?: string[] // STT 인식 언어들
  translate_to?: string // 번역 타겟 언어 (optional)
  created_at: string
  updated_at: string
}

export function useLectures() {
  const { user } = useAuth()
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 강의 목록 가져오기
  const fetchLectures = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setLectures(data || [])
    } catch (err: any) {
      console.error('강의 목록 가져오기 실패:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  // 초기 로드
  useEffect(() => {
    fetchLectures()
  }, [fetchLectures])

  // 새 강의 생성
  const createLecture = useCallback(
    async (title: string, audioLanguages?: string[], translateTo?: string) => {
      if (!user) return null

      try {
        const { data, error } = await supabase
          .from('lectures')
          .insert({
            user_id: user.id,
            title,
            status: 'draft',
            audio_languages: audioLanguages,
            translate_to: translateTo,
          })
          .select()
          .single()

        if (error) throw error

        // 목록 새로고침
        await fetchLectures()

        return data
      } catch (err: any) {
        console.error('강의 생성 실패:', err)
        setError(err.message)
        return null
      }
    },
    [user, fetchLectures]
  )

  // 강의 시작 (녹음 시작)
  const startLecture = useCallback(
    async (lectureId: string) => {
      try {
        const { error } = await supabase
          .from('lectures')
          .update({
            status: 'recording',
            started_at: new Date().toISOString(),
          })
          .eq('id', lectureId)

        if (error) throw error

        await fetchLectures()
      } catch (err: any) {
        console.error('강의 시작 실패:', err)
        setError(err.message)
      }
    },
    [fetchLectures]
  )

  // 강의 종료 (녹음 종료)
  const endLecture = useCallback(
    async (lectureId: string) => {
      try {
        // 시작 시간 가져오기
        const { data: lecture } = await supabase
          .from('lectures')
          .select('started_at')
          .eq('id', lectureId)
          .single()

        const endedAt = new Date()
        const startedAt = lecture?.started_at ? new Date(lecture.started_at) : endedAt
        const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)

        const { error } = await supabase
          .from('lectures')
          .update({
            status: 'completed',
            ended_at: endedAt.toISOString(),
            duration_seconds: durationSeconds,
          })
          .eq('id', lectureId)

        if (error) throw error

        await fetchLectures()
      } catch (err: any) {
        console.error('강의 종료 실패:', err)
        setError(err.message)
      }
    },
    [fetchLectures]
  )

  // 강의 삭제
  const deleteLecture = useCallback(
    async (lectureId: string) => {
      try {
        const { error } = await supabase
          .from('lectures')
          .delete()
          .eq('id', lectureId)

        if (error) throw error

        await fetchLectures()
      } catch (err: any) {
        console.error('강의 삭제 실패:', err)
        setError(err.message)
      }
    },
    [fetchLectures]
  )

  // 오디오 파일 URL 업데이트
  const updateAudioUrl = useCallback(
    async (lectureId: string, audioUrl: string) => {
      try {
        const { error } = await supabase
          .from('lectures')
          .update({
            audio_file_url: audioUrl,
          })
          .eq('id', lectureId)

        if (error) throw error

        await fetchLectures()
      } catch (err: any) {
        console.error('오디오 URL 업데이트 실패:', err)
        setError(err.message)
      }
    },
    [fetchLectures]
  )

  // 강의 이름 수정
  const updateLectureTitle = useCallback(
    async (lectureId: string, title: string) => {
      try {
        const { error } = await supabase
          .from('lectures')
          .update({
            title,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lectureId)

        if (error) throw error

        await fetchLectures()
      } catch (err: any) {
        console.error('강의 이름 수정 실패:', err)
        setError(err.message)
      }
    },
    [fetchLectures]
  )

  return {
    lectures,
    loading,
    error,
    createLecture,
    startLecture,
    endLecture,
    deleteLecture,
    updateAudioUrl,
    updateLectureTitle,
    refetch: fetchLectures,
  }
}
