import { supabase } from '@/lib/supabase'

export async function uploadAudioFile(
  lectureId: string,
  audioBlob: Blob,
  userId: string
): Promise<string | null> {
  try {

    // 파일명 생성: lectures/{userId}/{lectureId}.webm
    const fileName = `${lectureId}.webm`
    const filePath = `lectures/${userId}/${fileName}`

    console.log('📤 오디오 파일 업로드 시작:', filePath)

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('audio-recordings')
      .upload(filePath, audioBlob, {
        contentType: 'audio/webm',
        upsert: true, // 이미 존재하면 덮어쓰기
      })

    if (error) {
      console.error('❌ 오디오 업로드 실패:', error)
      console.error('❌ 에러 상세:', {
        message: error.message,
        statusCode: error.statusCode,
        error: error.error,
      })
      alert(`오디오 업로드 실패: ${error.message}`)
      return null
    }

    console.log('✅ 오디오 업로드 성공:', data.path)

    // Public URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from('audio-recordings').getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('❌ 오디오 업로드 오류:', error)
    return null
  }
}

export async function downloadAudioFile(audioUrl: string, fileName: string) {
  try {
    console.log('📥 오디오 파일 다운로드 시작:', audioUrl)

    const response = await fetch(audioUrl)
    const blob = await response.blob()

    // Blob을 다운로드
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    console.log('✅ 오디오 다운로드 완료')
  } catch (error) {
    console.error('❌ 오디오 다운로드 오류:', error)
    throw error
  }
}

export function downloadTranscript(captions: Array<{ text: string; timestamp_seconds: number }>, fileName: string) {
  try {
    console.log('📥 대본 다운로드 시작')

    // 중복 제거
    const uniqueCaptions: Array<{ text: string; timestamp_seconds: number }> = []
    let prevText = ''

    for (const caption of captions) {
      if (caption.text !== prevText) {
        uniqueCaptions.push(caption)
        prevText = caption.text
      }
    }

    // 대본 텍스트 생성
    let transcript = '='.repeat(50) + '\n'
    transcript += 'LIVEY 강의 대본\n'
    transcript += '='.repeat(50) + '\n\n'

    uniqueCaptions.forEach((caption) => {
      const time = formatTimestamp(caption.timestamp_seconds)
      transcript += `[${time}] ${caption.text}\n\n`
    })

    // Blob 생성
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    console.log('✅ 대본 다운로드 완료')
  } catch (error) {
    console.error('❌ 대본 다운로드 오류:', error)
    throw error
  }
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
