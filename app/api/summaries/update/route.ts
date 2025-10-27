// ================================================================
import { logger } from '@/lib/logger'
// 강의 요약 업데이트 API
// ================================================================
// 100개의 새로운 캡션마다 요약을 생성/업데이트합니다
// ================================================================

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { lectureId } = await req.json()

    if (!lectureId) {
      return NextResponse.json(
        { error: 'lectureId is required' },
        { status: 400 }
      )
    }

    logger.log(`\n[SUMMARY] 📝 강의 ${lectureId.substring(0, 8)} 요약 업데이트 시작`)

    // 1. 기존 요약 가져오기
    const { data: existingSummary } = await supabase
      .from('lecture_summaries')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    logger.log(`[SUMMARY] 기존 요약: ${existingSummary ? '있음' : '없음'}`)

    // 2. 마지막 요약 이후의 캡션 개수 확인
    let newCaptionsQuery = supabase
      .from('captions')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('timestamp_seconds', { ascending: true })

    if (existingSummary?.last_caption_id) {
      // 마지막 요약 캡션 이후의 캡션만
      const { data: lastCaption } = await supabase
        .from('captions')
        .select('timestamp_seconds')
        .eq('id', existingSummary.last_caption_id)
        .single()

      if (lastCaption) {
        newCaptionsQuery = newCaptionsQuery.gt('timestamp_seconds', lastCaption.timestamp_seconds)
      }
    }

    const { data: newCaptions, error: captionsError } = await newCaptionsQuery

    if (captionsError) throw captionsError

    const newCaptionCount = newCaptions?.length || 0
    logger.log(`[SUMMARY] 새로운 캡션 개수: ${newCaptionCount}개`)

    // 3. 100개 미만이면 업데이트 불필요
    if (newCaptionCount < 100) {
      logger.log(`[SUMMARY] ⏸️  100개 미만이므로 업데이트 생략 (${newCaptionCount}/100)`)
      return NextResponse.json({
        message: 'Not enough new captions',
        newCaptionCount,
        threshold: 100,
      })
    }

    // 4. GPT-4o-mini로 요약 생성/업데이트
    const captionsText = newCaptions
      .map((c, idx) => `[${idx + 1}] ${c.text}`)
      .join('\n')

    let prompt: string

    if (existingSummary) {
      // 기존 요약 업데이트
      prompt = `다음은 강의의 기존 요약입니다:

${existingSummary.summary}

---

이제 새로운 100개의 캡션이 추가되었습니다:

${captionsText}

위의 새로운 내용을 기반으로 기존 요약을 업데이트해주세요. 전체 강의 내용을 포괄하는 통합된 요약을 작성해주세요.`
    } else {
      // 첫 요약 생성
      prompt = `다음은 강의의 처음 100개 캡션입니다:

${captionsText}

위 내용을 요약해주세요. 핵심 내용과 주요 포인트를 포함해주세요.`
    }

    logger.log(`[SUMMARY] 🤖 GPT-4o-mini 요약 생성 중...`)
    const startTime = Date.now()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 강의 내용을 정확하고 간결하게 요약하는 전문가입니다. 핵심 내용을 놓치지 않으면서도 이해하기 쉽게 요약해주세요.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const summary = completion.choices[0].message.content || ''
    const elapsedMs = Date.now() - startTime

    logger.log(`[SUMMARY] ✅ 요약 생성 완료 (${elapsedMs}ms)`)
    logger.log(`[SUMMARY] 요약 길이: ${summary.length}자`)

    // 5. 데이터베이스에 저장/업데이트
    const lastCaptionId = newCaptions[newCaptions.length - 1].id
    const totalCaptionCount = (existingSummary?.caption_count || 0) + newCaptionCount

    if (existingSummary) {
      // 업데이트
      const { error: updateError } = await supabase
        .from('lecture_summaries')
        .update({
          summary,
          caption_count: totalCaptionCount,
          last_caption_id: lastCaptionId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSummary.id)

      if (updateError) throw updateError
      logger.log(`[SUMMARY] 💾 기존 요약 업데이트 완료 (총 ${totalCaptionCount}개 캡션)`)
    } else {
      // 새로 생성
      const { error: insertError } = await supabase
        .from('lecture_summaries')
        .insert({
          lecture_id: lectureId,
          summary,
          caption_count: totalCaptionCount,
          last_caption_id: lastCaptionId,
        })

      if (insertError) throw insertError
      logger.log(`[SUMMARY] 💾 새 요약 생성 완료 (${totalCaptionCount}개 캡션)`)
    }

    return NextResponse.json({
      success: true,
      summary,
      newCaptionCount,
      totalCaptionCount,
      processingTimeMs: elapsedMs,
    })
  } catch (error: any) {
    logger.error('[SUMMARY] ❌ 오류:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update summary' },
      { status: 500 }
    )
  }
}
