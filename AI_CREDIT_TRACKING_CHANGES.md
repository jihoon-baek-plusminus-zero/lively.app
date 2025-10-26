# AI 크레딧 추적 시스템 구현 가이드

## 1단계: SQL 마이그레이션 적용

Supabase SQL Editor에서 다음 파일을 실행하세요:
- `supabase/migrations/add_ai_credit_usage_function.sql`

## 2단계: API Route 수정

`app/api/chat/route.ts` 파일을 다음과 같이 수정하세요:

### 수정 1: userId 파라미터 추가 (100행)
```typescript
// 변경 전
const { messages, lectureId, userLanguage } = await request.json()

// 변경 후
const { messages, lectureId, userLanguage, userId } = await request.json()
```

### 수정 2: userId 검증 추가 (109행 뒤에 삽입)
```typescript
    if (!userId) {
      console.log('[API/CHAT] ❌ userId 누락')
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // 1. AI 크레딧 확인
    console.log('[API/CHAT] 💳 AI 크레딧 확인 중...')
    const { data: creditCheck, error: creditError } = await supabase.rpc('check_ai_credits', {
      p_user_id: userId,
      p_required_credits: 1
    })

    if (creditError) {
      console.error('[API/CHAT] ❌ 크레딧 확인 실패:', creditError)
      return NextResponse.json(
        { error: 'Failed to check AI credits' },
        { status: 500 }
      )
    }

    if (!creditCheck?.has_credits) {
      console.log('[API/CHAT] ❌ AI 크레딧 부족')
      return NextResponse.json(
        {
          error: 'Insufficient AI credits',
          remaining: creditCheck?.remaining || 0,
          required: 1
        },
        { status: 402 } // 402 Payment Required
      )
    }

    console.log(`[API/CHAT] ✅ 크레딧 충분 (잔여: ${creditCheck.remaining})`)
```

### 수정 3: AI 응답 후 크레딧 차감 (248행 뒤에 삽입)
```typescript
    console.log(`[API/CHAT] 📊 토큰 사용량 - Input: ${completion.usage?.prompt_tokens}, Output: ${completion.usage?.completion_tokens}, Total: ${completion.usage?.total_tokens}`)

    // 2. AI 크레딧 차감
    console.log('[API/CHAT] 💳 AI 크레딧 차감 중...')
    const { data: usageResult, error: usageError } = await supabase.rpc('increment_ai_usage', {
      p_user_id: userId,
      p_credits: 1
    })

    if (usageError) {
      console.error('[API/CHAT] ⚠️ 크레딧 차감 실패 (응답은 반환):', usageError)
      // 크레딧 차감 실패해도 AI 응답은 반환 (이미 생성됨)
    } else {
      console.log(`[API/CHAT] ✅ 크레딧 차감 완료 (잔여: ${usageResult.remaining})`)
    }

    const totalDuration = Date.now() - startTime
    console.log(`[API/CHAT] 🎉 전체 처리 완료 (${totalDuration}ms)`)

    return NextResponse.json({
      message: aiMessage,
      usage: completion.usage,
      detectedLanguage: detectedLang,
      creditsRemaining: usageResult?.remaining || creditCheck.remaining - 1
    })
```

## 3단계: ChatPanel 컴포넌트 수정

`components/console/ChatPanel.tsx` 파일을 수정하세요:

### 수정 1: API 호출 시 userId 추가
sendMessage 함수에서 fetch 호출 부분:
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: chatHistory,
    lectureId: lecture.id,
    userLanguage: i18n.language,
    userId: user.id  // 추가
  }),
})
```

### 수정 2: 크레딧 부족 에러 처리
```typescript
if (!response.ok) {
  const errorData = await response.json()

  if (response.status === 402) {
    // 크레딧 부족
    throw new Error(`AI 크레딧이 부족합니다. (잔여: ${errorData.remaining})`)
  }

  throw new Error(errorData.error || 'AI 응답 생성 실패')
}
```

### 수정 3: 응답 후 크레딧 정보 업데이트 (선택사항)
```typescript
const data = await response.json()

// 크레딧 정보 표시 (선택사항)
if (data.creditsRemaining !== undefined) {
  console.log(`남은 AI 크레딧: ${data.creditsRemaining}`)
}
```

## 4단계: 테스트

### SQL에서 직접 테스트:
```sql
-- 크레딧 확인
SELECT public.check_ai_credits('YOUR_USER_ID'::uuid, 1);

-- 크레딧 차감
SELECT public.increment_ai_usage('YOUR_USER_ID'::uuid, 1);

-- 사용 현황 확인
SELECT user_id, total_ai_credit, total_ai_used,
       (total_ai_credit - total_ai_used) as remaining
FROM public.user_usages
WHERE user_id = 'YOUR_USER_ID'::uuid;
```

### 프론트엔드에서 테스트:
1. 로그인
2. 강의 녹음
3. AI에게 질문
4. 콘솔 로그 확인 - 크레딧 차감 메시지 확인
5. Supabase에서 user_usages 테이블 확인 - total_ai_used 증가 확인

## 작동 방식

1. **질문 전**: `check_ai_credits()` 함수로 크레딧 충분한지 확인
2. **크레딧 부족 시**: 402 에러 반환, AI 응답 생성하지 않음
3. **크레딧 충분 시**: OpenAI API 호출하여 응답 생성
4. **응답 후**: `increment_ai_usage()` 함수로 크레딧 1 차감
5. **차감 실패 시**: 에러 로그만 남기고 AI 응답은 정상 반환 (이미 생성됨)

## 에러 코드

- `400`: userId 누락
- `402`: AI 크레딧 부족
- `500`: 서버 에러 (크레딧 확인 실패 등)

## 주의사항

- userId는 필수 파라미터입니다
- 크레딧 차감은 AI 응답 생성 후에 이루어집니다
- 크레딧 차감 실패 시에도 AI 응답은 반환됩니다 (사용자 경험 우선)
