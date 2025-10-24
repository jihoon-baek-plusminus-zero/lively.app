import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 강의 내용을 이해하고 학생들을 돕는 친절한 AI 학습 도우미입니다. 답변은 간결하고 명확하게 작성하며, 최대 10문장, 기본 5문장 이내로 답변합니다.'
        },
        ...messages
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const aiMessage = completion.choices[0]?.message?.content || '답변을 생성하지 못했습니다.'

    return NextResponse.json({
      message: aiMessage,
      usage: completion.usage
    })

  } catch (error: any) {
    console.error('OpenAI API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    )
  }
}
