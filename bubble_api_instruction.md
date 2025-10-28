# Bubble.io API Integration Guide for Livey

## 📋 목차
1. [개요](#개요)
2. [API 엔드포인트 정보](#api-엔드포인트-정보)
3. [Bubble.io 설정 방법](#bubbleio-설정-방법)
4. [테스트 방법](#테스트-방법)
5. [문제 해결](#문제-해결)

---

## 개요

이 가이드는 Bubble.io에서 Livey의 Welcome Dashboard로 방문자 정보를 전송하는 방법을 설명합니다.

**데이터 흐름:**
```
[Bubble.io 앱] → POST 요청 → [Livey API] → [Livey Dashboard 실시간 업데이트]
```

**결과:**
- Livey의 모니터 대시보드(https://livey.app/test_api)에 실시간으로 환영 메시지 표시
- "Welcome, [이름] from [국적]" 형식으로 표시

---

## ⚠️ 중요: URL 사용 안내

**반드시 프로덕션 URL을 사용하세요:**
- ✅ **사용:** `https://livey.app/api/test-notification`
- ❌ **사용 금지:** `https://test-server-dev.livey.app/api/test-notification`

**이유:**
- 테스트 서버 (test-server-dev.livey.app)는 Vercel Deployment Protection이 활성화되어 있어 인증이 필요합니다
- 401 Unauthorized 에러가 발생하면 프로덕션 URL을 사용하고 있는지 확인하세요
- 프로덕션 URL은 인증 없이 공개 API로 사용 가능합니다

---

## API 엔드포인트 정보

### 기본 정보

| 항목 | 값 |
|------|-----|
| **URL** | `https://livey.app/api/test-notification` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |
| **인증** | 불필요 (Public API) |

### 요청 Body 형식

```json
{
  "name": "홍길동",
  "nationality": "대한민국"
}
```

**필드 설명:**

| 필드명 | 타입 | 필수 여부 | 설명 | 예시 |
|--------|------|-----------|------|------|
| `name` | String | ✅ 필수 | 방문자 이름 | "John Smith", "김철수" |
| `nationality` | String | ✅ 필수 | 방문자 국적 | "미국", "United States", "대한민국" |

### 응답 형식

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "message": "Notification received successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "홍길동",
    "nationality": "대한민국",
    "created_at": "2025-10-28T12:00:00.000Z"
  }
}
```

**에러 응답 (400 Bad Request):**
```json
{
  "success": false,
  "error": "Missing required fields: name and nationality are required"
}
```

**에러 응답 (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Failed to save notification"
}
```

---

## Bubble.io 설정 방법

### 1단계: API Connector 플러그인 설치

1. Bubble.io 에디터에서 **Plugins** 탭으로 이동
2. **+ Add plugins** 클릭
3. "API Connector" 검색 후 설치

![API Connector Plugin](https://bubble.io/img/api-connector.png)

---

### 2단계: API 연결 설정

1. **Plugins** 탭에서 **API Connector** 클릭
2. **Add another API** 클릭
3. 다음과 같이 설정:

#### API 기본 설정

| 설정 항목 | 값 |
|-----------|-----|
| **API Name** | `Livey Notification API` |
| **Authentication** | `None or self-handled` |

---

### 3단계: API Call 생성

**"Add another call" 버튼을 클릭하고 다음과 같이 설정:**

#### Call 기본 정보

| 설정 항목 | 값 |
|-----------|-----|
| **Name** | `Send Welcome Notification` |
| **Use as** | `Action` (not Data) |
| **Data type** | `JSON` |

#### Request 설정

| 설정 항목 | 값 |
|-----------|-----|
| **Method** | `POST` |
| **URL** | `https://livey.app/api/test-notification` |

#### Headers 설정

**Add header 클릭 후:**

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

#### Body 설정

**Body type:** `JSON`

**Body 내용:**
```json
{
  "name": "<name>",
  "nationality": "<nationality>"
}
```

> ⚠️ **주의:** `<name>`과 `<nationality>` 부분은 Bubble에서 자동으로 파라미터로 인식됩니다.

#### Parameters 설정

자동으로 생성된 파라미터를 다음과 같이 설정:

| Parameter | Type | 예시 값 (테스트용) |
|-----------|------|-------------------|
| `name` | `text` | `홍길동` |
| `nationality` | `text` | `대한민국` |

---

### 4단계: API Call 테스트

1. 예시 값을 입력한 상태에서 **Initialize call** 버튼 클릭
2. 성공하면 다음과 같은 응답을 받아야 합니다:
   ```json
   {
     "success": true,
     "message": "Notification received successfully",
     "data": { ... }
   }
   ```
3. https://livey.app/test_api 페이지를 열어서 실시간으로 메시지가 표시되는지 확인

---

### 5단계: Workflow에 연결

이제 Bubble 앱의 워크플로우에서 이 API를 호출할 수 있습니다.

#### 예시: 버튼 클릭 시 알림 전송

1. **Design** 탭에서 버튼 추가
2. **Workflow** 탭으로 이동
3. **Click here to add an action...** 클릭
4. **Plugins** → **Livey Notification API - Send Welcome Notification** 선택
5. 파라미터 설정:
   - **name:** `Input Name's value` (또는 원하는 데이터 소스)
   - **nationality:** `Dropdown Nationality's value` (또는 원하는 데이터 소스)

#### 예시 스크린샷 (설정 참고)

```
Workflow: When Button is clicked
  ↓
Step 1: Send Welcome Notification
  └─ name: Input Name's value
  └─ nationality: Dropdown Nationality's value
```

---

## 테스트 방법

### 방법 1: Bubble.io API Connector에서 테스트

1. API Connector의 **Initialize call** 버튼 사용
2. 예시 데이터 입력:
   - name: `테스트 사용자`
   - nationality: `대한민국`
3. https://livey.app/test_api 페이지 확인

---

### 방법 2: curl 명령어로 테스트

터미널에서 다음 명령어 실행:

```bash
curl -X POST https://livey.app/api/test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "name": "홍길동",
    "nationality": "대한민국"
  }'
```

**예상 응답:**
```json
{
  "success": true,
  "message": "Notification received successfully",
  "data": {
    "id": "...",
    "name": "홍길동",
    "nationality": "대한민국",
    "created_at": "..."
  }
}
```

---

### 방법 3: Postman으로 테스트

1. **Method:** `POST`
2. **URL:** `https://livey.app/api/test-notification`
3. **Headers:**
   - `Content-Type`: `application/json`
4. **Body (raw JSON):**
   ```json
   {
     "name": "John Smith",
     "nationality": "United States"
   }
   ```
5. **Send** 클릭

---

### 방법 4: JavaScript Fetch로 테스트

```javascript
fetch('https://livey.app/api/test-notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: '김철수',
    nationality: '대한민국'
  })
})
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

---

## 문제 해결

### 문제 1: 401 Unauthorized 에러

**원인:** 테스트 서버 URL을 사용하여 Vercel Deployment Protection에 막힘

**에러 메시지 예시:**
```
Status code 401
Authentication Required
```

**해결 방법:**
1. **프로덕션 URL 사용:** `https://livey.app/api/test-notification`
2. 테스트 서버 URL (`test-server-dev.livey.app`) 대신 프로덕션 URL 사용
3. Bubble.io API Connector 설정에서 URL 확인 및 변경

---

### 문제 2: "Missing required fields" 에러

**원인:** `name` 또는 `nationality` 필드가 누락되었습니다.

**해결 방법:**
- Bubble.io에서 파라미터가 올바르게 설정되었는지 확인
- 빈 값이 전송되지 않도록 validation 추가

**Bubble.io Workflow 예시:**
```
Only when: Input Name is not empty
           AND Dropdown Nationality is not empty
```

---

### 문제 3: CORS 에러

**원인:** 브라우저에서 직접 요청 시 CORS 정책 문제

**해결 방법:**
- Bubble.io의 API Connector는 서버 사이드에서 요청하므로 CORS 문제 없음
- 만약 발생한다면, Bubble의 워크플로우가 아닌 브라우저에서 직접 호출하는지 확인

---

### 문제 4: 대시보드에 실시간 업데이트가 안 됨

**원인:** Supabase Realtime 연결 문제

**해결 방법:**
1. https://livey.app/test_api 페이지를 새로고침
2. 브라우저 콘솔에서 에러 확인
3. API 요청이 성공했는지 확인 (응답 `success: true`)
4. 네트워크 연결 확인

---

### 문제 5: API 요청이 실패함 (500 에러)

**원인:** 서버 내부 에러 또는 데이터베이스 문제

**해결 방법:**
1. Livey 개발팀에 문의
2. API 응답의 `error` 메시지 확인
3. curl 명령어로 직접 테스트해서 재현

---

## 추가 기능 (선택사항)

### 에러 핸들링 워크플로우

Bubble.io에서 API 호출 후 에러 처리:

```
Step 1: Send Welcome Notification
  └─ When error occurs:
       └─ Show alert: "전송 실패. 다시 시도해주세요."
```

---

### 성공 메시지 표시

```
Step 1: Send Welcome Notification
  └─ When success:
       └─ Show alert: "환영 메시지가 전송되었습니다!"
```

---

## 대시보드 URL

**실시간 모니터 화면:**
- https://livey.app/test_api

**권장 설정:**
- 전체화면 모드로 회사 모니터에 표시
- 자동 새로고침 불필요 (실시간 업데이트)

---

## 연락처

문제가 발생하거나 도움이 필요한 경우:
- **이메일:** support@livey.app
- **GitHub Issues:** [프로젝트 저장소]

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2025-10-28 | 1.0 | 초기 버전 작성 |
