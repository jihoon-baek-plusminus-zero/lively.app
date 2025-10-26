import { NextRequest, NextResponse } from 'next/server'
import * as deepl from 'deepl-node'

interface TranslateRequest {
  text: string
  targetLang: string
  sourceLang?: string
}

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang, sourceLang }: TranslateRequest = await request.json()

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields: text, targetLang' },
        { status: 400 }
      )
    }

    const authKey = process.env.DEEPL_API_KEY
    if (!authKey) {
      return NextResponse.json(
        { error: 'DeepL API key not configured' },
        { status: 500 }
      )
    }

    const translator = new deepl.Translator(authKey)

    // DeepL 언어 코드 변환 (en -> en-US, pt -> pt-PT 등)
    const deeplTargetLang = targetLang === 'en' ? 'en-US' :
                            targetLang === 'pt' ? 'pt-PT' :
                            targetLang

    // DeepL API 호출
    const result = await translator.translateText(
      text,
      (sourceLang as deepl.SourceLanguageCode) || null,
      deeplTargetLang as deepl.TargetLanguageCode
    )

    return NextResponse.json({
      translatedText: result.text,
      detectedSourceLang: result.detectedSourceLang,
    })
  } catch (error: any) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Translation failed', details: error.message },
      { status: 500 }
    )
  }
}
