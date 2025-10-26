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

// 언어 감지 함수
function detectLanguage(text: string): string {
  // 한글
  if (/[\u3131-\u318E\uAC00-\uD7A3]/.test(text)) return 'ko'
  // 일본어
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja'
  // 중국어
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh'
  // 스페인어 특수문자
  if (/[áéíóúüñ¿¡]/i.test(text)) return 'es'
  // 기본 영어
  return 'en'
}

// 다국어 시스템 프롬프트
const systemPrompts: Record<string, string> = {
  ko: `당신은 Livey의 실시간 속기록 기반 채팅 서비스입니다.

역할:
- 제공된 속기록 내용을 이해하고 사용자를 돕는 친절한 AI 도우미
- 제공된 속기록(컨텍스트)을 기반으로만 답변
- 답변은 간결하고 명확하게 (최대 10문장, 기본 5문장)

중요한 규칙:
1. 반드시 제공된 컨텍스트 내용만을 사용하여 답변하세요
2. 컨텍스트에 관련 정보가 없으면 "제공된 내용에서 해당 정보를 찾을 수 없습니다"라고 답변하세요
3. 주제와 완전히 무관한 질문은 "저는 주제와 관련된 질문에만 답변할 수 있어요"라고 답변하세요
4. 질문자의 언어로 답변하세요 (한국어 질문 → 한국어 답변)`,

  en: `You are Livey's real-time transcript-based chat service.

Role:
- A friendly AI assistant that helps users understand the provided transcript content
- Answer only based on the provided transcript (context)
- Keep answers concise and clear (max 10 sentences, default 5 sentences)

Important rules:
1. Answer ONLY using the provided context
2. If relevant information is not in the context, respond: "I cannot find that information in the provided content"
3. For completely off-topic questions, respond: "I can only answer questions related to the topic"
4. Respond in the same language as the question (English question → English answer)`,

  ja: `あなたはLiveyのリアルタイム文字起こしベースのチャットサービスです。

役割:
- 提供された文字起こし内容を理解し、ユーザーを助ける親切なAIアシスタント
- 提供された文字起こし（コンテキスト）のみに基づいて回答
- 回答は簡潔で明確に（最大10文、デフォルト5文）

重要なルール:
1. 提供されたコンテキストの内容のみを使用して回答してください
2. コンテキストに関連情報がない場合は「提供された内容からその情報を見つけることができません」と回答してください
3. トピックと完全に無関係な質問には「トピックに関連する質問にのみ回答できます」と回答してください
4. 質問者の言語で回答してください（日本語の質問→日本語の回答）`,

  zh: `您是Livey的实时转录聊天服务。

角色:
- 理解提供的转录内容并帮助用户的友好AI助手
- 仅基于提供的转录（上下文）进行回答
- 保持回答简洁明了（最多10句，默认5句）

重要规则:
1. 仅使用提供的上下文内容进行回答
2. 如果上下文中没有相关信息，请回答："我在提供的内容中找不到该信息"
3. 对于完全不相关的问题，请回答："我只能回答与主题相关的问题"
4. 用提问者的语言回答（中文问题→中文回答）`,

  es: `Eres el servicio de chat basado en transcripciones en tiempo real de Livey.

Rol:
- Un asistente AI amigable que ayuda a los usuarios a comprender el contenido de la transcripción proporcionada
- Responde solo basándote en la transcripción proporcionada (contexto)
- Mantén las respuestas concisas y claras (máximo 10 oraciones, predeterminado 5 oraciones)

Reglas importantes:
1. Responde SOLO usando el contexto proporcionado
2. Si no hay información relevante en el contexto, responde: "No puedo encontrar esa información en el contenido proporcionado"
3. Para preguntas completamente fuera del tema, responde: "Solo puedo responder preguntas relacionadas con el tema"
4. Responde en el mismo idioma que la pregunta (pregunta en español → respuesta en español)`,
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[API/CHAT] 💬 채팅 요청 시작')

  try {
    const { messages, lectureId, userLanguage } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      console.log('[API/CHAT] ❌ 메시지 배열 누락')
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // 마지막 사용자 메시지에서 언어 감지
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()
    const detectedLang = lastUserMessage ? detectLanguage(lastUserMessage.content) : userLanguage || 'ko'

    console.log(`[API/CHAT] 📝 사용자 질문: "${lastUserMessage?.content.substring(0, 50)}${lastUserMessage?.content.length > 50 ? '...' : ''}"`)
    console.log(`[API/CHAT] 🌐 감지된 언어: ${detectedLang}`)

    let contextMessages = [...messages]

    // lectureId가 있으면 하이브리드 RAG 수행
    if (lectureId && lastUserMessage) {
      console.log(`[API/CHAT] 🔍 하이브리드 RAG 모드: lectureId = ${lectureId}`)
      try {
        // 1. 최근 50개 캡션 가져오기 (무조건)
        console.log('[API/CHAT] 📥 최근 50개 캡션 가져오는 중...')
        const { data: recentCaptions, error: captionsError } = await supabase
          .from('captions')
          .select('text, timestamp_seconds')
          .eq('lecture_id', lectureId)
          .order('timestamp_seconds', { ascending: false })
          .limit(50)

        if (captionsError) throw captionsError

        const recentContext = recentCaptions
          ?.reverse()
          .map((c: any, idx: number) => `[${idx + 1}] ${c.text}`)
          .join('\n') || ''

        console.log(`[API/CHAT] ✅ 최근 캡션: ${recentCaptions?.length || 0}개`)

        // 2. RAG 유사도 검색 (상위 5개)
        console.log('[API/CHAT] 🔍 RAG 유사도 검색 중...')
        const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/embeddings/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lectureId,
            query: lastUserMessage.content,
            threshold: 0.4,
            limit: 5,
          }),
        })

        let ragContext = ''
        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          const results = searchData.results || []
          ragContext = results
            .map((r: any, idx: number) => `[${idx + 1}] ${r.content}`)
            .join('\n')
          console.log(`[API/CHAT] ✅ RAG 검색: ${results.length}개 결과`)
        } else {
          console.log('[API/CHAT] ⚠️ RAG 검색 실패, 계속 진행')
        }

        // 3. 강의 요약 가져오기
        console.log('[API/CHAT] 📝 강의 요약 가져오는 중...')
        const { data: summary } = await supabase
          .from('lecture_summaries')
          .select('summary')
          .eq('lecture_id', lectureId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

        const summaryContext = summary?.summary || '(아직 요약 없음)'
        console.log(`[API/CHAT] ✅ 요약: ${summary ? '있음' : '없음'}`)

        // 4. 하이브리드 컨텍스트 구성
        const hybridContext = `
### 전체 요약
${summaryContext}

### 최근 50개 캡션 (시간순)
${recentContext}

${ragContext ? `### 관련성 높은 내용 (유사도 검색)
${ragContext}` : ''}
`.trim()

        console.log(`[API/CHAT] 📦 하이브리드 컨텍스트 구성 완료 (요약 + 최근50 + RAG5)`)

        // 컨텍스트를 시스템 메시지에 추가
        contextMessages = [
          {
            role: 'system',
            content: `${systemPrompts[detectedLang] || systemPrompts.ko}

제공된 컨텍스트:
---
${hybridContext}
---`
          },
          ...messages
        ]

      } catch (error) {
        console.error('[API/CHAT] ❌ 하이브리드 RAG 실패:', error)
        // 실패 시 기본 모드로 동작
        contextMessages = [
          {
            role: 'system',
            content: systemPrompts[detectedLang] || systemPrompts.ko
          },
          ...messages
        ]
      }
    } else {
      console.log('[API/CHAT] ℹ️ 기본 모드 (lectureId 없음)')
      // lectureId가 없으면 기본 시스템 프롬프트만 사용
      contextMessages = [
        {
          role: 'system',
          content: systemPrompts[detectedLang] || systemPrompts.ko
        },
        ...messages
      ]
    }

    // OpenAI API 호출
    console.log('[API/CHAT] 🤖 GPT-4o-mini 호출 중...')
    const gptStartTime = Date.now()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: contextMessages as any,
      max_tokens: 500,
      temperature: 0.7,
    })

    const aiMessage = completion.choices[0]?.message?.content || '답변을 생성하지 못했습니다.'
    const gptDuration = Date.now() - gptStartTime
    const totalDuration = Date.now() - startTime

    console.log(`[API/CHAT] ✅ GPT-4o-mini 응답 완료 (${gptDuration}ms)`)
    console.log(`[API/CHAT] 📊 토큰 사용량 - Input: ${completion.usage?.prompt_tokens}, Output: ${completion.usage?.completion_tokens}, Total: ${completion.usage?.total_tokens}`)
    console.log(`[API/CHAT] 🎉 전체 처리 완료 (${totalDuration}ms)`)

    return NextResponse.json({
      message: aiMessage,
      usage: completion.usage,
      detectedLanguage: detectedLang
    })

  } catch (error: any) {
    console.error('OpenAI API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    )
  }
}
