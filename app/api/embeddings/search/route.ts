import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
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
  logger.log('[API/EMBEDDINGS/SEARCH] 🔍 벡터 검색 시작')

  try {
    const { lectureId, query, threshold = 0.5, limit = 5 } = await request.json()

    if (!lectureId || !query) {
      logger.log('[API/EMBEDDINGS/SEARCH] ❌ 필수 파라미터 누락')
      return NextResponse.json(
        { error: 'lectureId and query are required' },
        { status: 400 }
      )
    }

    logger.log(`[API/EMBEDDINGS/SEARCH] 📝 Query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`)

    // 쿼리 임베딩 생성
    const embStartTime = Date.now()
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })

    const queryEmbedding = embeddingResponse.data[0].embedding
    logger.log(`[API/EMBEDDINGS/SEARCH] ✅ 쿼리 임베딩 생성 완료 (${Date.now() - embStartTime}ms)`)

    // Supabase 함수를 사용한 유사도 검색
    const searchStartTime = Date.now()
    const { data, error } = await supabase.rpc('match_embeddings', {
      query_embedding: queryEmbedding,
      match_lecture_id: lectureId,
      match_threshold: threshold,
      match_count: limit,
    })

    if (error) {
      logger.error('[API/EMBEDDINGS/SEARCH] ❌ 유사도 검색 실패:', error)
      return NextResponse.json(
        { error: 'Failed to search similar content' },
        { status: 500 }
      )
    }

    logger.log(`[API/EMBEDDINGS/SEARCH] ✅ 벡터 검색 완료: ${data?.length || 0}개 결과 (${Date.now() - searchStartTime}ms)`)

    // 순수 유사도만 사용 (시간 가중치 제거, 상위 5개만)
    const results = (data || []).slice(0, 5).map((item: any) => {
      return {
        content: item.content,
        similarity: item.similarity,
        created_at: item.created_at,
      }
    })

    const totalDuration = Date.now() - startTime
    logger.log(`[API/EMBEDDINGS/SEARCH] 🎉 검색 완료: ${results.length}개 결과 (순수 유사도, 상위 5개) (총 ${totalDuration}ms)`)

    // 상위 결과 로깅
    if (results.length > 0) {
      logger.log(`[API/EMBEDDINGS/SEARCH] 📊 상위 결과:`)
      results.forEach((r: any, i: number) => {
        logger.log(`  ${i + 1}. 유사도: ${(r.similarity * 100).toFixed(1)}%, 내용: "${r.content.substring(0, 40)}..."`)
      })
    }

    return NextResponse.json({
      results,
      count: results.length
    })

  } catch (error: any) {
    logger.error('Search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform search' },
      { status: 500 }
    )
  }
}
