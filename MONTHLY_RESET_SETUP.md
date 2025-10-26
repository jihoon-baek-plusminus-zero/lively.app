# 월별 크레딧 자동 초기화 설정 가이드

## 개요
매월 1일에 모든 사용자의 크레딧을 자동으로 초기화하는 시스템입니다.

## Free Plan 크레딧
- **녹음 시간**: 10시간 (36,000초)
- **AI 크레딧**: 500 크레딧
- **초기화 주기**: 매월 1일 자동

---

## 1단계: 데이터베이스 마이그레이션 적용

### 1. Supabase 대시보드 접속
- https://supabase.com/dashboard 접속
- 프로젝트 선택

### 2. SQL Editor에서 마이그레이션 실행

**첫 번째 마이그레이션: Deleted Users Tracking**
1. SQL Editor → New Query
2. `supabase/migrations/add_deleted_users_tracking.sql` 파일 내용 복사
3. 붙여넣기 후 "Run" 클릭

**두 번째 마이그레이션: Subscription Plan**
1. SQL Editor → New Query
2. `supabase/migrations/add_subscription_plan.sql` 파일 내용 복사
3. 붙여넣기 후 "Run" 클릭

---

## 2단계: Edge Function 배포

### 1. Supabase CLI 설치 (아직 설치 안했다면)
```bash
npm install -g supabase
```

### 2. Supabase 로그인
```bash
supabase login
```

### 3. Edge Function 배포
```bash
# 프로젝트 루트에서 실행
supabase functions deploy monthly-reset --project-ref YOUR_PROJECT_REF
```

프로젝트 REF는 Supabase 대시보드 → Project Settings → General에서 확인 가능

---

## 3단계: Cron Job 설정 (매월 1일 자동 실행)

Supabase에서는 **pg_cron** 확장을 사용하여 스케줄링을 설정합니다.

### Supabase SQL Editor에서 실행:

```sql
-- 1. pg_cron 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. 기존 cron job이 있다면 삭제
SELECT cron.unschedule('monthly-credit-reset');

-- 3. 매월 1일 00:00 (UTC)에 실행되는 cron job 생성
SELECT cron.schedule(
  'monthly-credit-reset',           -- job name
  '0 0 1 * *',                       -- cron expression (매월 1일 00:00)
  $$
  SELECT public.reset_monthly_usage();
  $$
);

-- 4. Cron job 확인
SELECT * FROM cron.job;
```

### Cron Expression 설명
- `0 0 1 * *` = 매월 1일 자정(00:00) UTC 시간
- 한국 시간(KST)으로는 매월 1일 오전 9시에 실행됨

---

## 4단계: 테스트

### 수동으로 크레딧 초기화 테스트:

```sql
-- Supabase SQL Editor에서 실행
SELECT public.reset_monthly_usage();

-- 결과 확인
SELECT
  user_id,
  subscribed_plan,
  total_recordable_time,
  total_recorded_time,
  total_ai_credit,
  total_ai_used,
  current_period_start
FROM public.user_usages
LIMIT 10;
```

### Edge Function 수동 테스트:

```bash
# 로컬에서 테스트
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/monthly-reset \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 현재 설정 확인

### Cron Jobs 확인:
```sql
SELECT * FROM cron.job;
```

### 다음 실행 시간 확인:
```sql
SELECT
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job;
```

### Cron 실행 기록 확인:
```sql
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

---

## Cron Job 관리

### Cron Job 중지:
```sql
SELECT cron.unschedule('monthly-credit-reset');
```

### Cron Job 재시작:
```sql
SELECT cron.schedule(
  'monthly-credit-reset',
  '0 0 1 * *',
  $$
  SELECT public.reset_monthly_usage();
  $$
);
```

---

## 주의사항

1. **타임존**: Cron은 UTC 시간으로 실행됩니다
   - UTC 00:00 = KST 09:00
   - 한국 시간 자정에 실행하려면: `0 15 * * *` (전날 15:00 UTC)

2. **백업**: 크레딧 초기화 전 데이터 백업 권장

3. **모니터링**:
   - 매월 초 cron.job_run_details 테이블 확인
   - 에러 발생 시 알림 설정 권장

---

## 트러블슈팅

### Cron이 실행되지 않는 경우:
1. pg_cron 확장이 활성화되어 있는지 확인
2. cron.job 테이블에 job이 등록되어 있는지 확인
3. Supabase 프로젝트가 유료 플랜인지 확인 (무료 플랜은 pg_cron 지원 안될 수 있음)

### 대안: Vercel Cron 또는 GitHub Actions
Supabase에서 pg_cron을 지원하지 않는다면:
- Vercel Cron 사용
- GitHub Actions 사용
- 외부 서비스(Zapier, Make 등) 사용

---

## 다음 개선 사항

추후 유료 플랜 추가 시:
1. `subscribed_plan` 컬럼에 'pro', 'premium' 등 추가
2. `reset_monthly_usage()` 함수의 CASE 문 업데이트
3. 플랜별 크레딧 양 조정

예시:
```sql
CASE
  WHEN subscribed_plan = 'free' THEN 36000      -- 10 hours
  WHEN subscribed_plan = 'pro' THEN 108000      -- 30 hours
  WHEN subscribed_plan = 'premium' THEN 360000  -- 100 hours
  ELSE 36000
END
```
