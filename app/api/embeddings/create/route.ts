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
  try {
    const { lectureId, captionIds } = await request.json()

    if (!lectureId) {
      return NextResponse.json(
        { error: 'lectureId is required' },
        { status: 400 }
      )
    }

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
      return NextResponse.json({
        message: 'No captions to embed',
        count: 0
      })
    }

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

    if (captionsToEmbed.length === 0) {
      return NextResponse.json({
        message: 'All captions already embedded',
        count: 0
      })
    }

    // 임베딩 생성
    const embeddingsToInsert = []

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
        console.error(`Failed to create embedding for caption ${caption.id}:`, error)
      }
    }

    // DB에 저장
    if (embeddingsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('embeddings')
        .insert(embeddingsToInsert)

      if (insertError) {
        console.error('Embeddings insert error:', insertError)
        return NextResponse.json(
          { error: 'Failed to save embeddings' },
          { status: 500 }
        )
      }
    }

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
