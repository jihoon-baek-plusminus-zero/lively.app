# 로깅 설정 가이드

## 개요

Livey 프로젝트는 환경별로 콘솔 로그 출력을 제어할 수 있습니다.

- **로컬 서버**: 콘솔 로그 표시 ✅
- **테스트 서버**: 콘솔 로그 표시 ✅
- **메인 서버**: 콘솔 로그 숨김 ❌

## 환경 설정

### 1. 로컬 개발 환경 (`.env.local`)

```env
NEXT_PUBLIC_ENABLE_CONSOLE_LOGS=true
```

### 2. 테스트 서버 (`.env.test` 또는 Vercel 환경 변수)

```env
NEXT_PUBLIC_ENABLE_CONSOLE_LOGS=true
```

### 3. 메인 프로덕션 서버 (`.env.production` 또는 Vercel 환경 변수)

```env
NEXT_PUBLIC_ENABLE_CONSOLE_LOGS=false
```

## 사용 방법

### 기존 코드 변경

**이전:**
```typescript
console.log('[Recording Credit Check] Response:', data)
console.error('Error fetching user usage:', err)
```

**이후:**
```typescript
import { logger } from '@/lib/logger'

logger.log('[Recording Credit Check] Response:', data)
logger.error('Error fetching user usage:', err)
```

### 지원하는 로그 메서드

```typescript
import { logger } from '@/lib/logger'

// 일반 로그 (환경에 따라 표시/숨김)
logger.log('일반 로그')
logger.info('정보 로그')
logger.warn('경고 로그')
logger.debug('디버그 로그')
logger.table(data) // 테이블 형식
logger.group('그룹 레이블')
logger.groupEnd()

// 에러 로그 (항상 표시 - 프로덕션 포함)
logger.error('에러 발생!', error)
```

### 조건부 로직이 필요한 경우

```typescript
import { isConsoleLoggingEnabled } from '@/lib/logger'

if (isConsoleLoggingEnabled) {
  // 로그가 활성화된 경우에만 실행할 코드
  const debugInfo = expensiveDebugCalculation()
  logger.log('Debug info:', debugInfo)
}
```

## Vercel 배포 시 설정

### 1. Vercel 대시보드 접속
1. 프로젝트 선택
2. **Settings** > **Environment Variables** 클릭

### 2. 환경 변수 추가

**테스트 서버용:**
- Key: `NEXT_PUBLIC_ENABLE_CONSOLE_LOGS`
- Value: `true`
- Environment: **Preview** 체크

**메인 서버용:**
- Key: `NEXT_PUBLIC_ENABLE_CONSOLE_LOGS`
- Value: `false`
- Environment: **Production** 체크

### 3. 재배포
- 환경 변수 추가 후 자동으로 재배포되거나
- **Deployments** 탭에서 "Redeploy" 클릭

## 주의사항

1. **에러는 항상 로그됩니다**
   - `logger.error()`는 프로덕션에서도 표시됩니다
   - 사용자 경험에 영향을 주는 에러는 반드시 로그해야 합니다

2. **민감한 정보는 로그하지 마세요**
   - API 키, 비밀번호, 토큰 등은 절대 로그하지 않습니다
   - 개인정보(이메일, 이름 등)도 최소화합니다

3. **환경 변수 확인**
   - `NEXT_PUBLIC_` 접두사가 있어야 클라이언트에서 접근 가능
   - 빌드 시점에 환경 변수가 고정되므로 변경 후 재빌드 필요

## 마이그레이션 체크리스트

기존 코드의 `console.*`를 `logger.*`로 변경:

- [ ] `hooks/useUserManagement.ts`
- [ ] `hooks/useUserUsage.ts`
- [ ] `app/console/page.tsx`
- [ ] `components/console/ChatPanel.tsx`
- [ ] `app/api/chat/route.ts`
- [ ] `app/api/increment-recording-usage/route.ts`
- [ ] `app/api/increment-ai-usage/route.ts`

## 예시 코드 변경

### useUserManagement.ts

```typescript
import { logger } from '@/lib/logger'

const updatePurchasedRecordingTime = async (
  userId: string,
  operation: 'add' | 'subtract',
  hours: number
): Promise<boolean> => {
  const seconds = Math.round(hours * 3600)
  logger.log(`[updatePurchasedRecordingTime] Starting - userId: ${userId}, seconds: ${seconds}`)

  try {
    // ... 기존 코드
    logger.log(`[updatePurchasedRecordingTime] Success`)
    return true
  } catch (err) {
    logger.error('[updatePurchasedRecordingTime] Error:', err)
    return false
  }
}
```

### app/console/page.tsx

```typescript
import { logger } from '@/lib/logger'

const handleStartRecording = async () => {
  logger.log('🎙️ 녹음 시작 시도...')

  try {
    // ... 기존 코드
    logger.log('✅ 녹음 시작 성공')
  } catch (error) {
    logger.error('❌ 녹음 시작 실패:', error)
  }
}
```

## 테스트 방법

### 로컬 테스트

1. `.env.local` 파일 수정:
   ```env
   NEXT_PUBLIC_ENABLE_CONSOLE_LOGS=true
   ```
2. 개발 서버 재시작: `npm run dev`
3. 브라우저 콘솔에서 로그 확인

### 프로덕션 빌드 테스트

1. `.env.production` 파일 생성:
   ```env
   NEXT_PUBLIC_ENABLE_CONSOLE_LOGS=false
   ```
2. 프로덕션 빌드:
   ```bash
   npm run build
   npm start
   ```
3. 브라우저 콘솔에서 로그가 안 나오는지 확인

## FAQ

**Q: 환경 변수 변경 후 로그가 여전히 보입니다**
- A: 개발 서버를 재시작하거나 프로덕션을 재빌드하세요

**Q: 일부 로그만 제어하고 싶습니다**
- A: 중요한 로그는 `logger.error()` 사용, 디버그용은 `logger.log()` 사용

**Q: 특정 파일/함수만 로그를 제어할 수 있나요?**
- A: 네, `isConsoleLoggingEnabled`를 import하여 조건부로 처리하세요
