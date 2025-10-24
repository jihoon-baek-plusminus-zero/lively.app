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
    const { lectureId, query, threshold = 0.5, limit = 5 } = await request.json()

    if (!lectureId || !query) {
      return NextResponse.json(
        { error: 'lectureId and query are required' },
        { status: 400 }
      )
    }

    // 쿼리 임베딩 생성
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })

    const queryEmbedding = embeddingResponse.data[0].embedding

    // Supabase 함수를 사용한 유사도 검색
    const { data, error } = await supabase.rpc('match_embeddings', {
      query_embedding: queryEmbedding,
      match_lecture_id: lectureId,
      match_threshold: threshold,
      match_count: limit,
    })

    if (error) {
      console.error('Similarity search error:', error)
      return NextResponse.json(
        { error: 'Failed to search similar content' },
        { status: 500 }
      )
    }

    // 시간 가중치 적용 (최근 것일수록 가중치 높임)
    const now = new Date().getTime()
    const results = (data || []).map((item: any, index: number) => {
      const createdAt = new Date(item.created_at).getTime()
      const ageInHours = (now - createdAt) / (1000 * 60 * 60)

      // 시간 감쇠 계수 (1시간 = 0.9, 2시간 = 0.81, ...)
      const timeDecay = Math.exp(-ageInHours * 0.1)

      // 최종 점수 = 유사도 * 시간 가중치
      const finalScore = item.similarity * (0.7 + 0.3 * timeDecay)

      return {
        content: item.content,
        similarity: item.similarity,
        timeDecay,
        finalScore,
        created_at: item.created_at,
      }
    })

    // 최종 점수로 재정렬
    results.sort((a: any, b: any) => b.finalScore - a.finalScore)

    return NextResponse.json({
      results,
      count: results.length
    })

  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform search' },
      { status: 500 }
    )
  }
}
