# 녹음 크레딧 실시간 추적 구현 가이드

## 개요
녹음 중 매 초마다 크레딧을 차감하고, 실시간 번역 활성화 시 2배 차감하며, 크레딧 소진 시 자동 녹음 중지

## 1단계: SQL 마이그레이션 적용

Supabase SQL Editor에서 `supabase/migrations/add_recording_usage_tracking.sql` 실행

## 2단계: app/console/page.tsx 수정

### 수정 1: Import 추가 (상단에 추가)
```typescript
import { supabase } from '@/lib/supabase'
import { useUserUsage } from '@/hooks/useUserUsage'
```

### 수정 2: Hook 추가 (24번 줄 근처)
```typescript
const { user, loading } = useAuth()
const { usage, refetchUsage } = useUserUsage()  // 추가
```

### 수정 3: 크레딧 추적을 위한 interval ref 추가 (44번 줄 근처, menuRef 아래)
```typescript
const menuRef = useRef<HTMLDivElement>(null)
const creditTrackingIntervalRef = useRef<NodeJS.Timeout | null>(null)  // 추가
```

### 수정 4: handleStartRecording 함수 시작 부분에 크레딧 체크 추가 (395번 줄)
```typescript
const handleStartRecording = async () => {
  if (!selectedLecture) {
    alert(t('console.alert.select.lecture'))
    return
  }

  // 크레딧 체크 추가
  if (!user) return

  const { data: creditCheck, error: creditError } = await supabase.rpc('check_recording_time', {
    p_user_id: user.id,
    p_required_seconds: 1
  })

  if (creditError || !creditCheck?.has_time) {
    alert('녹음 크레딧이 부족합니다. 크레딧을 충전해주세요.')
    return
  }

  console.log('🎬 녹음 시작 프로세스 시작...')
  // ... 기존 코드 계속
```

### 수정 5: handleStopRecording 함수에서 credit tracking interval 정리 (462번 줄)
```typescript
const handleStopRecording = async () => {
  if (!selectedLecture || !user) return

  // 크레딧 추적 중지
  if (creditTrackingIntervalRef.current) {
    clearInterval(creditTrackingIntervalRef.current)
    creditTrackingIntervalRef.current = null
  }

  setIsSavingAudio(true)
  // ... 기존 코드 계속
```

### 수정 6: handlePauseResume 함수에서 credit tracking 제어 (440번 줄)
```typescript
const handlePauseResume = async () => {
  if (isPaused) {
    // 재개: Deepgram 재연결 + MediaRecorder 재개 + 크레딧 추적 재개
    console.log('▶️ 녹음 재개 - Deepgram 재연결 + MediaRecorder 재개')
    if (audioRecorder.audioStream && selectedLecture && user) {
      const audioLanguages = selectedLecture.audio_languages || ['ko']
      await deepgram.connect(audioRecorder.audioStream, audioLanguages)
      audioRecorder.resumeRecording()
      console.log('✅ Deepgram 재연결 및 MediaRecorder 재개 완료')

      // 크레딧 추적 재개 - 추가
      startCreditTracking()
    }
    setIsPaused(false)
  } else {
    // 일시정지: Deepgram 연결 끊기 + MediaRecorder 일시정지 + 크레딧 추적 중지
    console.log('⏸️ 녹음 일시정지 - Deepgram 연결 해제 + MediaRecorder 일시정지')
    deepgram.disconnect()
    audioRecorder.pauseRecording()
    console.log('✅ Deepgram 연결 해제 및 MediaRecorder 일시정지 완료')

    // 크레딧 추적 중지 - 추가
    if (creditTrackingIntervalRef.current) {
      clearInterval(creditTrackingIntervalRef.current)
      creditTrackingIntervalRef.current = null
    }

    setIsPaused(true)
  }
}
```

### 수정 7: 크레딧 추적 함수 추가 (handlePauseResume 함수 위에 추가, 439번 줄 근처)
```typescript
// 크레딧 추적 시작
const startCreditTracking = () => {
  if (creditTrackingIntervalRef.current) {
    clearInterval(creditTrackingIntervalRef.current)
  }

  creditTrackingIntervalRef.current = setInterval(async () => {
    if (!user) return

    try {
      // 번역 활성화 여부에 따라 크레딧 차감량 결정
      const creditsToUse = translationEnabled ? 2 : 1

      const { data: usageResult, error: usageError } = await supabase.rpc('increment_recording_usage', {
        p_user_id: user.id,
        p_seconds: creditsToUse
      })

      if (usageError) {
        // 크레딧 부족 에러
        if (usageError.message.includes('Insufficient')) {
          console.log('❌ 녹음 크레딧 소진!')

          // 크레딧 추적 중지
          if (creditTrackingIntervalRef.current) {
            clearInterval(creditTrackingIntervalRef.current)
            creditTrackingIntervalRef.current = null
          }

          // 녹음 자동 중지
          alert('녹음 크레딧이 모두 소진되었습니다. 녹음을 종료합니다.')
          await handleStopRecording()
        } else {
          console.error('크레딧 차감 실패:', usageError)
        }
        return
      }

      console.log(`💳 크레딧 차감: ${creditsToUse}초 (잔여: ${usageResult?.remaining}초)`)

      // 사용량 정보 갱신
      await refetchUsage()
    } catch (error) {
      console.error('크레딧 추적 에러:', error)
    }
  }, 1000) // 1초마다 실행
}
```

### 수정 8: handleStartRecording 함수 끝부분에서 크레딧 추적 시작 (430번 줄 근처)
```typescript
      // 4. 녹음 시작 시간 기록
      setRecordingStartTime(Date.now())

      // 5. 크레딧 추적 시작 - 추가
      startCreditTracking()

      console.log('🎉 모든 설정 완료! 녹음 시작!')
```

### 수정 9: 컴포넌트 언마운트 시 정리 (useEffect 추가, 227번 줄 근처)
```typescript
  }, [isActiveRecording, recordingStartTime])

  // 크레딧 추적 정리
  useEffect(() => {
    return () => {
      if (creditTrackingIntervalRef.current) {
        clearInterval(creditTrackingIntervalRef.current)
        creditTrackingIntervalRef.current = null
      }
    }
  }, [])

  // 시간 포맷팅 (HH:MM:SS)
```

## 작동 방식

### 정상 녹음 (번역 OFF)
1. 녹음 시작 → 크레딧 체크
2. 매 초마다 1초 차감
3. 일시정지 → 크레딧 차감 중지
4. 재개 → 크레딧 차감 재개
5. 중지 → 크레딧 추적 종료

### 번역 활성화 (번역 ON)
1. 녹음 시작 + 번역 ON → 크레딧 체크
2. 매 초마다 2초 차감
3. 일시정지 → 크레딧 차감 중지
4. 재개 → 크레딧 차감 재개 (여전히 2초)
5. 중지 → 크레딧 추적 종료

### 크레딧 소진 시
1. 크레딧 차감 시도
2. "Insufficient recording time" 에러 발생
3. 크레딧 추적 자동 중지
4. 알림 표시: "녹음 크레딧이 모두 소진되었습니다"
5. `handleStopRecording()` 자동 호출 → 녹음 종료

### 크레딧 없을 때 녹음 시작
1. 녹음 시작 버튼 클릭
2. `check_recording_time()` 함수로 크레딧 체크
3. 크레딧 없으면 알림: "녹음 크레딧이 부족합니다"
4. 녹음 시작 취소

## 테스트 방법

### 1. 정상 녹음 테스트
```sql
-- Supabase에서 충분한 크레딧 설정
UPDATE user_usages SET total_recordable_time = 36000 WHERE user_id = 'YOUR_USER_ID';
```
- 녹음 시작
- 콘솔에서 "💳 크레딧 차감: 1초" 메시지 확인
- 몇 초 후 Supabase에서 total_recorded_time 증가 확인

### 2. 번역 활성화 테스트
- 번역 ON으로 설정
- 녹음 시작
- 콘솔에서 "💳 크레딧 차감: 2초" 메시지 확인

### 3. 일시정지/재개 테스트
- 녹음 중 일시정지
- 크레딧 차감 메시지 중지 확인
- 재개 버튼 클릭
- 크레딧 차감 재개 확인

### 4. 크레딧 소진 테스트
```sql
-- 크레딧을 5초로 설정
UPDATE user_usages SET total_recordable_time = 5, total_recorded_time = 0 WHERE user_id = 'YOUR_USER_ID';
```
- 녹음 시작
- 5초 후 자동 중지 및 알림 확인

### 5. 크레딧 없을 때 시작 방지 테스트
```sql
-- 크레딧을 0으로 설정
UPDATE user_usages SET total_recordable_time = 0 WHERE user_id = 'YOUR_USER_ID';
```
- 녹음 시작 버튼 클릭
- "녹음 크레딧이 부족합니다" 알림 확인
- 녹음 시작 안됨 확인

## 주의사항

1. `formatTime` 함수와 혼동하지 말것 - 이건 기존 UI 표시용
2. 크레딧 추적은 별도 interval로 동작
3. 일시정지 시 반드시 interval 정리
4. 컴포넌트 언마운트 시 interval 정리 필수
5. translationEnabled 상태에 따라 차감량 자동 조절
