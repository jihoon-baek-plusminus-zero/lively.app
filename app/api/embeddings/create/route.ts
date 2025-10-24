import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[API/EMBEDDINGS/CREATE] 🚀 요청 시작')

  try {
    const { lectureId, captionIds } = await request.json()

    if (!lectureId) {
      console.log('[API/EMBEDDINGS/CREATE] ❌ lectureId 누락')
      return NextResponse.json(
        { error: 'lectureId is required' },
        { status: 400 }
      )
    }

    console.log(`[API/EMBEDDINGS/CREATE] 📝 lectureId: ${lectureId}`)

    // caption_ids가 제공되면 해당 자막들만, 아니면 아직 임베딩되지 않은 자막들을 가져옴
    let query = supabase
      .from('captions')
      .select('id, text, created_at')
      .eq('lecture_id', lectureId)
      .eq('is_final', true)
      .order('created_at', { ascending: true })

    if (captionIds && Array.isArray(captionIds) && captionIds.length > 0) {
      query = query.in('id', captionIds)
    }

    const { data: captions, error: captionsError } = await query

    if (captionsError) {
      console.error('Captions fetch error:', captionsError)
      return NextResponse.json(
        { error: 'Failed to fetch captions' },
        { status: 500 }
      )
    }

    if (!captions || captions.length === 0) {
      console.log('[API/EMBEDDINGS/CREATE] ℹ️ 임베딩할 자막 없음')
      return NextResponse.json({
        message: 'No captions to embed',
        count: 0
      })
    }

    console.log(`[API/EMBEDDINGS/CREATE] 📊 전체 자막: ${captions.length}개`)

    // 이미 임베딩된 caption_id 필터링
    const { data: existingEmbeddings } = await supabase
      .from('embeddings')
      .select('caption_id')
      .eq('lecture_id', lectureId)
      .in('caption_id', captions.map(c => c.id))

    const existingCaptionIds = new Set(
      existingEmbeddings?.map(e => e.caption_id) || []
    )

    const captionsToEmbed = captions.filter(
      c => !existingCaptionIds.has(c.id)
    )

    console.log(`[API/EMBEDDINGS/CREATE] 🔍 이미 임베딩됨: ${existingCaptionIds.size}개, 새로 생성할 것: ${captionsToEmbed.length}개`)

    if (captionsToEmbed.length === 0) {
      console.log('[API/EMBEDDINGS/CREATE] ✅ 모든 자막이 이미 임베딩됨')
      return NextResponse.json({
        message: 'All captions already embedded',
        count: 0
      })
    }

    // 임베딩 생성
    console.log(`[API/EMBEDDINGS/CREATE] 🔄 OpenAI 임베딩 생성 시작...`)
    const embeddingsToInsert = []
    const embeddingStartTime = Date.now()

    for (const caption of captionsToEmbed) {
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: caption.text,
        })

        const embedding = response.data[0].embedding

        embeddingsToInsert.push({
          lecture_id: lectureId,
          caption_id: caption.id,
          content: caption.text,
          embedding: embedding,
        })
      } catch (error) {
        console.error(`[API/EMBEDDINGS/CREATE] ❌ 임베딩 생성 실패 (caption ${caption.id}):`, error)
      }
    }

    const embeddingDuration = Date.now() - embeddingStartTime
    console.log(`[API/EMBEDDINGS/CREATE] ✅ OpenAI 임베딩 생성 완료: ${embeddingsToInsert.length}개 (${embeddingDuration}ms)`)

    // DB에 저장
    if (embeddingsToInsert.length > 0) {
      console.log(`[API/EMBEDDINGS/CREATE] 💾 DB 저장 시작...`)
      const dbStartTime = Date.now()

      const { error: insertError } = await supabase
        .from('embeddings')
        .insert(embeddingsToInsert)

      if (insertError) {
        console.error('[API/EMBEDDINGS/CREATE] ❌ DB 저장 실패:', insertError)
        return NextResponse.json(
          { error: 'Failed to save embeddings' },
          { status: 500 }
        )
      }

      const dbDuration = Date.now() - dbStartTime
      console.log(`[API/EMBEDDINGS/CREATE] ✅ DB 저장 완료 (${dbDuration}ms)`)
    }

    const totalDuration = Date.now() - startTime
    console.log(`[API/EMBEDDINGS/CREATE] 🎉 전체 완료: ${embeddingsToInsert.length}개 임베딩 (총 ${totalDuration}ms)`)

    return NextResponse.json({
      message: 'Embeddings created successfully',
      count: embeddingsToInsert.length
    })

  } catch (error: any) {
    console.error('Embeddings creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create embeddings' },
      { status: 500 }
    )
  }
}
