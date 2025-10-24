# 🎓 실시간 강의 자막 생성 및 AI 학습 보조 플랫폼

## 📋 프로젝트 개요
이 프로젝트는 웹 기반 서비스로 실시간으로 대학 강의 혹은 미팅을 자막화(캡션)을 만들고 AI를 통해 번역 및 질의응답을 실시간으로 할 수 있는 서비스임.
전부 Claude Code를 통해 개발될 것이며 아래 전체 프로젝트 개요에 따라 진행될 것임

### 핵심 가치 제안
대학 강의를 실시간으로 자막화하고, AI를 활용하여 학생들이 강의 중 즉시 질문하고 답변을 받을 수 있는 학습 보조 플랫폼

### 타겟 사용자
- 대학생 (주 타겟)
- 미팅을 하거나 행사를 가는, 강연을 가는 사람들
- 외국인 유학생 (다국어 번역 필요)
- 청각 장애 학생
- 온라인 강의 수강생

### 핵심 기능
1. **실시간 음성 인식 (STT)** - 강의 음성을 실시간으로 텍스트로 변환 -> 라이브 자막(캡션)표시
2. **실시간 다국어 번역** - 자막을 여러 언어로 즉시 번역
3. **실시간 AI 챗봇** - 강의 내용 기반 즉각적인 질문 답변
4. **PDF 자료 통합** - 강의 자료를 AI 컨텍스트에 포함
5. **강의 저장 및 복습** - 이전 강의 내용 검색 및 재학습

---

## 🎯 MVP 범위

### 포함 기능
- ✅ 웹 기반 단일 플랫폼 (데스크톱 브라우저)
- ✅ 로그인 및 회원가입 기능
- ✅ 실시간 STT (다국어 지원: 한국어, 영어, 일본어, 중국어, 스페인어)
- ✅ 실시간 번역 (위 언어들 간 상호 번역)
- ✅ 실시간 RAG 기반 AI 챗봇 (강의 중 지속적 업데이트)
- ✅ PDF 업로드 및 벡터 검색
- ✅ 강의 녹음 및 자막 저장
- ✅ 강의 히스토리 및 검색

---

## 🏗️ 기술 스택

### Frontend
```
Framework: Next.js 14 (App Router)
- React 18
- TypeScript
- Server Components + Client Components

UI/Styling:
- Tailwind CSS
- shadcn/ui
- Lucide React

상태 관리:
- React Hooks
- Zustand

실시간 통신:
- Supabase Realtime (WebSocket)
- Deepgram WebSocket (STT)
- Web Audio API (마이크 녹음)
```

### Backend
```
Platform: Vercel (Serverless)
- Next.js API Routes
- Edge Functions

Database: Supabase
- PostgreSQL
- Realtime Subscriptions
- Storage (오디오 파일, PDF)
- Authentication

Vector Database: Pinecone
- 벡터 임베딩 저장
- 유사도 검색
```

### AI & ML Services
```
음성 인식 (STT):
- Deepgram Nova-2
- WebSocket 실시간 스트리밍
- 지원 언어: 36개 언어
- 응답 속도: 200-300ms
- 비용: $0.0043/분

번역:
- Google Cloud Translation API
- 실시간 번역 (문장 단위)
- 지원 언어: 100+ 언어
- 비용: $20/100만 글자

AI 챗봇:
- Anthropic Claude 3.5 Sonnet
- 모델: claude-3-5-sonnet-20241022
- 컨텍스트: 200K 토큰
- 스트리밍 응답

임베딩:
- OpenAI Embeddings API
- 모델: text-embedding-3-small
- 차원: 1536
- 비용: $0.02/100만 토큰
```

### DevOps
```
배포: Vercel
- Git 기반 자동 배포
- Preview 배포 (PR)
- Production 배포 (main)

모니터링:
- Vercel Analytics
- Sentry (에러 트래킹)
```

---

## 📐 시스템 아키텍처

### 전체 데이터 흐름

```
[사용자 마이크]
      ↓
[Web Audio API - 250ms 청크]
      ↓
[WebSocket → Deepgram] -> 실시간 자막 캡션 표시
      ↓
[실시간 텍스트 변환 (200-300ms)]
      ↓ (병렬 처리)
      ├─→ [Google Translate API] → [번역된 텍스트]
      │         ↓
      │   [Supabase: captions 테이블]
      │         ↓
      │   [Realtime 브로드캐스트]
      │         ↓
      │   [클라이언트 UI 업데이트]
      │
      └─→ [OpenAI Embeddings API]
                ↓
          [벡터 임베딩 생성]
                ↓
          [Pinecone 저장]

-> 위의 과정에서 우선 deepgram으로 인식하는 순간 바로 실시간 캡션이 표기되어야 하며, 이후 google translate는 데이터베이스 내의 텍스트를 기반으로 전송해 번역을 진행함

[사용자 질문]
      ↓
[질문 임베딩 생성]
      ↓
[Pinecone 유사도 검색]
      ├─→ 라이브 캡션 (최근일수록 시간 가중치)
      └─→ PDF 자료 (관련도 가중치)
      ↓
[Claude API 호출]
      ↓
[스트리밍 응답]
```

### 실시간 처리 전략

#### 1. Deepgram 실시간 STT
```
마이크 스트림 → [250ms 청크] → WebSocket → Deepgram
                                    ↓
                              [Interim Results] (중간 결과)
                                    ↓
                              [Final Results] (최종 결과)
                                    ↓
                              UI 실시간 업데이트
```

**특징:**
- Interim results: 타이핑 중인 것처럼 실시간 표시
- Final results: 확정된 문장
- 지연 시간: 200-300ms (거의 즉각)

#### 2. 번역 실시간 처리
```
Final STT 결과 → [문장 단위] → Google Translate → UI 업데이트
```

#### 3. 실시간 RAG 업데이트
```
Final 캡션 → [10초 버퍼] → [배치 임베딩] → Pinecone → 즉시 검색 가능
```

---

## 🗄️ 데이터베이스 스키마

### Supabase (PostgreSQL)

```sql
-- 사용자
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 강의
CREATE TABLE lectures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT DEFAULT 'ko',
  status TEXT DEFAULT 'active', -- active, paused, ended
  audio_url TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 자막
CREATE TABLE captions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  language TEXT NOT NULL,
  start_time FLOAT,
  confidence FLOAT,
  is_final BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 번역
CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caption_id UUID REFERENCES captions(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDF 문서
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  page_count INTEGER,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 채팅 메시지
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Pinecone (Vector Database)

```javascript
{
  name: "lecture-embeddings",
  dimension: 1536,
  metric: "cosine"
}

// Vector 메타데이터
{
  id: "caption_uuid",
  values: [0.123, -0.456, ...], // 1536차원
  metadata: {
    type: "caption" | "document",
    lecture_id: "uuid",
    text: "원본 텍스트",
    timestamp: 1234567890,
    language: "ko",
    start_time: 123.45, // caption인 경우
    document_id: "uuid", // document인 경우
    page_number: 5
  }
}
```

---

## 🔌 API 엔드포인트

### 1. WebSocket /api/transcribe-stream
**기능:** Deepgram WebSocket 연결 및 실시간 STT

**흐름:**
```
클라이언트 → WebSocket 연결 → Deepgram WebSocket
                                    ↓
                              실시간 텍스트 수신
                                    ↓
                              Supabase 저장
                                    ↓
                              클라이언트로 전송
```

### 2. POST /api/chat
**기능:** AI 챗봇 질문 답변 (스트리밍)

**Request:**
```typescript
{
  message: string,
  lectureId: string,
  language?: string
}
```

**Response:** Server-Sent Events (SSE)

### 3. POST /api/documents/upload
**기능:** PDF 업로드 및 벡터화

**흐름:**
```
PDF 업로드 → Supabase Storage
          ↓
     텍스트 추출
          ↓
     청크 분할
          ↓
     임베딩 생성
          ↓
     Pinecone 저장
```

### 4. POST /api/translate
**기능:** 실시간 번역

**Request:**
```typescript
{
  text: string,
  targetLanguages: string[] // ['en', 'ja', 'zh']
}
```

### 5. GET /api/lectures/:id
**기능:** 강의 상세 정보 조회

### 6. POST /api/lectures/create
**기능:** 새 강의 시작

### 7. PATCH /api/lectures/:id/end
**기능:** 강의 종료

---

## 🎨 UI/UX 구조

### 1. 대시보드 (/)
- 강의 목록 (진행 중 / 종료됨)
- 새 강의 시작 버튼

### 2. 강의 진행 화면 (/lecture/:id)
```
┌─────────────────────────────────────────────────┐
│  [← 뒤로] 강의 제목    [⏸️ 일시정지] [⏹️ 종료]  │
├─────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌────────────────────┐  │
│  │  📝 실시간 자막   │  │  💬 AI 채팅         │  │
│  │                  │  │                    │  │
│  │  [🎤 녹음 중]    │  │  [질문 입력...]    │  │
│  │                  │  │                    │  │
│  │  교수님이 방금... │  │  AI: 정규화는...   │  │
│  │  (Normalization) │  │                    │  │
│  │                  │  │  📎 업로드된 자료   │  │
│  │  [자동 스크롤 ✓] │  │  • 강의노트.pdf    │  │
│  │  [언어: 한↔영]   │  │  [+ PDF 추가]      │  │
│  └──────────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 3. 강의 복습 화면 (/lecture/:id/review)
- 전체 자막 타임라인
- 시간별 점프
- 강의 내용 검색
- AI 질문 (이전 강의 기반)

---

## 🔐 보안 및 인증

### Supabase Auth
```
- 이메일/비밀번호
- Google OAuth
- Row Level Security (RLS)
```

### RLS 정책
```sql
-- 자신의 강의만 조회
CREATE POLICY "Users can view own lectures"
  ON lectures FOR SELECT
  USING (auth.uid() = user_id);
```

## 📅 개발 로드맵 (12주)

### Week 1-2: 프로젝트 세팅
- Next.js 프로젝트 생성
- Supabase 연동 및 스키마 생성
- 로그인 및 회원가입 기능 구현
- 인증 구현
- 기본 레이아웃

### Week 3-4: 실시간 STT (Deepgram)
- Web Audio API 마이크 녹음
- Deepgram WebSocket 연결
- 실시간 자막 표시
- Supabase 저장

### Week 5-6: 실시간 번역
- Google Translate API 연동
- 언어 선택 UI
- 번역 자막 표시

### Week 7-8: PDF RAG
- Pinecone 설정
- PDF 업로드 및 파싱
- 벡터 임베딩 생성
- 문서 목록 UI

### Week 9-10: AI 챗봇
- Claude API 연동
- Pinecone 유사도 검색
- 스트리밍 응답
- 채팅 UI

### Week 11: 실시간 RAG
- 캡션 자동 임베딩
- 배치 처리
- 시간 가중치 검색

### Week 12: 강의 히스토리 & 최적화
- 강의 목록/상세 페이지
- 검색 기능
- 성능 최적화

---

## 🚀 배포

## 📊 핵심 기술 요약

| 기능 | 기술 | 이유 |
|-----|------|------|
| **실시간 STT** | Deepgram Nova-2 | 가장 빠름 (200-300ms), 합리적 가격 |
| **번역** | Google Translate | 신뢰성, 100+ 언어 |
| **AI 챗봇** | Claude 3.5 Sonnet | 200K 컨텍스트, 한국어 우수 |
| **벡터 검색** | Pinecone | 관리형, 빠른 검색 |
| **임베딩** | OpenAI text-embedding-3-small | 가성비, 1536차원 |
| **DB** | Supabase | Realtime, Auth, Storage 통합 |
| **배포** | Vercel | Next.js 최적화, 자동 CI/CD |

---

## 🎯 성공 지표

- STT 정확도: >92%
- 번역 정확도: >90%
- 응답 시간: STT <500ms, 챗봇 <5초
- 시스템 가동률: >99%

---

이 문서는 프로젝트의 단일 진실 공급원(Single Source of Truth)입니다.