# 🔑 LIVEY - API 키 발급 완벽 가이드

이 문서는 LIVEY 서비스 개발에 필요한 모든 외부 API 및 서비스의 API 키를 발급받는 상세 가이드입니다.

---

## 📋 목차

1. [Supabase - 백엔드 인프라](#1-supabase)
2. [Deepgram - 실시간 STT](#2-deepgram)
3. [OpenAI - 임베딩 생성](#3-openai)
4. [Anthropic Claude - AI 챗봇](#4-anthropic-claude)
5. [Pinecone - 벡터 데이터베이스](#5-pinecone)
6. [Google Cloud Translation - 번역](#6-google-cloud-translation)
7. [환경 변수 설정 방법](#7-환경-변수-설정-방법)
8. [발급 완료 체크리스트](#8-발급-완료-체크리스트)

---

## 1. Supabase

### 🎯 서비스 역할
- **사용자 인증**: 회원가입, 로그인, 세션 관리
- **데이터베이스**: PostgreSQL 기반 강의, 자막, 채팅 데이터 저장
- **실시간 구독**: 자막 실시간 업데이트 (WebSocket)
- **파일 스토리지**: PDF 문서 업로드 및 저장

### 📝 필요한 키
| 키 이름 | 용도 | 노출 가능 여부 |
|--------|------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | 프로젝트 접속 URL | ✅ 공개 가능 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 인증 키 | ✅ 공개 가능 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 관리자 키 | ❌ 절대 비공개 |

### 📋 발급 방법

#### STEP 1: 회원가입 및 로그인
1. 브라우저에서 [https://supabase.com](https://supabase.com) 접속
2. 우측 상단 **"Start your project"** 버튼 클릭
3. 가입 방법 선택:
   - **GitHub 계정으로 가입** (권장) 또는
   - 이메일 주소로 가입
4. 이메일 인증 완료

#### STEP 2: Organization 생성
1. 로그인 후 자동으로 Organization 생성 화면 표시
2. Organization 이름 입력 (예: `livey-org`)
3. Plan 선택: **Free** (무료)
4. **"Create organization"** 클릭

#### STEP 3: 프로젝트 생성
1. **"New Project"** 버튼 클릭
2. 프로젝트 설정 입력:
   ```
   Name: livey-production
   Database Password: [강력한 비밀번호 생성]
   ```
   ⚠️ **비밀번호는 반드시 별도 저장하세요!** (나중에 확인 불가)

3. Region 선택: **Northeast Asia (Seoul)** - 한국 서버
4. Pricing Plan: **Free** (시작은 무료)
5. **"Create new project"** 버튼 클릭
6. 프로젝트 생성 대기 (약 1-2분)

#### STEP 4: API 키 복사
1. 프로젝트 대시보드에서 좌측 메뉴 **⚙️ Settings** 클릭
2. **API** 메뉴 클릭
3. **"Project API keys"** 섹션에서 다음 값 복사:

   **① Project URL 복사**
   ```
   복사할 위치: Project URL 박스의 복사 아이콘 클릭
   형식: https://xxxxxxxxxxxxx.supabase.co
   환경변수명: NEXT_PUBLIC_SUPABASE_URL
   ```

   **② anon public 키 복사**
   ```
   복사할 위치: anon public 박스의 복사 아이콘 클릭
   형식: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   환경변수명: NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

   **③ service_role 키 복사** (⚠️ 중요)
   ```
   1. "service_role" 옆의 "Reveal" 또는 눈 아이콘 클릭
   2. 표시된 키 복사 (매우 긴 문자열)
   형식: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   환경변수명: SUPABASE_SERVICE_ROLE_KEY
   ```

### ✅ 완료 확인
- [ ] Project URL 복사 완료
- [ ] anon public 키 복사 완료
- [ ] service_role 키 복사 완료 (절대 GitHub에 올리지 말 것!)
- [ ] Database 비밀번호 별도 저장 완료

### 💰 비용
- **Free Tier**: 무료 (500MB 데이터베이스, 1GB 스토리지)
- **Pro Tier**: $25/월 (8GB 데이터베이스, 100GB 스토리지)

---

## 2. Deepgram

### 🎯 서비스 역할
- **실시간 음성-텍스트 변환** (STT)
- 초저지연 200-300ms 응답
- 한국어/영어 자동 감지
- WebSocket 기반 스트리밍

### 📝 필요한 키
| 키 이름 | 용도 |
|--------|------|
| `DEEPGRAM_API_KEY` | STT API 인증 |

### 📋 발급 방법

#### STEP 1: 회원가입
1. [https://deepgram.com](https://deepgram.com) 접속
2. 우측 상단 **"Sign Up"** 또는 **"Get API Key"** 클릭
3. 가입 방법 선택:
   - 이메일 주소 입력 후 비밀번호 설정 또는
   - GitHub/Google 계정으로 간편 가입
4. 이메일 인증 완료
5. 전화번호 입력 (SMS 인증 또는 음성 인증)

💰 **신규 가입 보너스**: $200 무료 크레딧 자동 지급!

#### STEP 2: 로그인 및 대시보드 접속
1. 로그인 완료 후 자동으로 Console로 이동
2. 좌측 메뉴에서 **🔑 "API Keys"** 클릭

#### STEP 3: API 키 생성
1. **"Create a New API Key"** 버튼 클릭
2. API Key 설정 입력:
   ```
   Name: livey-production
   Expiration: No expiration (만료 없음)
   Permissions:
     ✅ Member (모든 권한 - 기본값)
   ```
3. **"Create Key"** 버튼 클릭

#### STEP 4: API 키 복사 (⚠️ 중요!)
```
⚠️ 경고: API Key는 생성 시 단 한 번만 표시됩니다!
         반드시 즉시 복사하여 안전한 곳에 저장하세요.
```

1. 팝업창에 표시된 API Key 전체 복사
   ```
   형식: 영문자+숫자 조합 (32-64자)
   예시: 1234567890abcdef1234567890abcdef12345678
   환경변수명: DEEPGRAM_API_KEY
   ```
2. **"I have saved my API Key"** 체크 후 **"Close"** 클릭

### 📊 사용량 확인
1. 좌측 메뉴 **"Dashboard"** 클릭
2. **"Usage"** 탭에서 실시간 사용량 확인
   - 총 사용 시간 (분)
   - 남은 크레딧 금액
   - 일별/주별 그래프

### ✅ 완료 확인
- [ ] 회원가입 및 이메일 인증 완료
- [ ] $200 무료 크레딧 확인
- [ ] API Key 생성 및 안전하게 저장
- [ ] API Key가 .env.local에만 있고 Git에 없는지 확인

### 💰 비용
- **무료 크레딧**: $200 (약 4,600분 = 76시간)
- **Pay as you go**: $0.0043/분 (한국어 Nova-2 모델)
- 1시간 강의: 약 $0.26

---

## 3. OpenAI

### 🎯 서비스 역할
- **텍스트 임베딩 생성** (text-embedding-3-small)
- 자막/PDF를 1536차원 벡터로 변환
- RAG(검색 증강 생성) 구현의 핵심

### 📝 필요한 키
| 키 이름 | 용도 |
|--------|------|
| `OPENAI_API_KEY` | 임베딩 API 인증 |

### 📋 발급 방법

#### STEP 1: 회원가입
1. [https://platform.openai.com](https://platform.openai.com) 접속
2. **"Sign up"** 클릭
3. 가입 방법 선택:
   - Google/Microsoft/Apple 계정 연동 또는
   - 이메일 주소로 가입
4. 이메일 인증 완료
5. 전화번호 입력 및 SMS 인증 (필수)

#### STEP 2: 결제 수단 등록 (필수)
⚠️ **중요**: OpenAI는 2024년 4월부터 신규 사용자에게 무료 크레딧을 제공하지 않습니다.
API 사용을 위해 반드시 결제 카드를 등록해야 합니다.

1. 로그인 후 좌측 메뉴 **"Settings"** 클릭
2. **"Billing"** 탭 클릭
3. **"Add payment method"** 버튼 클릭
4. 카드 정보 입력:
   - 카드 번호
   - 만료일
   - CVC
   - 청구지 주소
5. **"Add payment method"** 클릭

#### STEP 3: 크레딧 충전
1. **"Add to credit balance"** 클릭
2. 충전 금액 선택:
   - 최소 $5 (권장: $10-20)
3. **"Continue"** → **"Confirm payment"** 클릭

#### STEP 4: 사용량 제한 설정 (권장)
예산 초과를 방지하기 위해 한도를 설정하세요.

1. Billing 페이지에서 **"Usage limits"** 섹션으로 스크롤
2. **"Hard limit"** 설정:
   ```
   금액: $50 (월 최대 사용 금액)
   → 이 금액 도달 시 API 자동 차단
   ```
3. **"Email notifications"** 설정:
   ```
   $10 도달 시 이메일 알림
   $25 도달 시 이메일 알림
   $40 도달 시 이메일 알림
   ```
4. **"Save"** 클릭

#### STEP 5: API 키 생성
1. 좌측 메뉴에서 **⚙️ "Settings"** 클릭
2. 탭 메뉴에서 **"API keys"** 클릭
   - 또는 직접 [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys) 접속
3. **"Create new secret key"** 버튼 클릭
4. API Key 설정:
   ```
   Name: livey-embeddings
   Permissions: All (또는 필요 시 Restricted)
   ```

   💡 **Restricted 권한 설정 시** (더 안전):
   - Model capabilities: ✅ Model read
   - Endpoints:
     - ✅ /v1/embeddings (임베딩만 허용)
     - ❌ /v1/chat/completions (비활성화)
     - ❌ /v1/images (비활성화)

5. **"Create secret key"** 클릭

#### STEP 6: API 키 복사 (⚠️ 중요!)
```
⚠️ 경고: API Key는 생성 시 단 한 번만 표시됩니다!
```

1. 팝업창에 표시된 Secret Key 전체 복사
   ```
   형식: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
   길이: 약 100자 이상
   환경변수명: OPENAI_API_KEY
   ```
2. **"Done"** 클릭

### 📊 사용량 확인
1. 좌측 메뉴 **"Usage"** 클릭
2. 일별/모델별 사용량 그래프 확인
3. **"Activity"** 탭에서 API 호출 로그 확인

### ✅ 완료 확인
- [ ] 회원가입 및 전화번호 인증 완료
- [ ] 결제 카드 등록 완료
- [ ] 최소 $5 이상 크레딧 충전 완료
- [ ] 사용량 한도($50) 설정 완료
- [ ] API Key 생성 및 안전하게 저장 (sk-proj-로 시작)

### 💰 비용
- **text-embedding-3-small**: $0.02 / 1M 토큰
- 1시간 강의 임베딩: 약 $0.10
- 100시간 강의: 약 $10

---

## 4. Anthropic Claude

### 🎯 서비스 역할
- **AI 챗봇** (Claude 3.5 Sonnet)
- 학생 질문에 대한 답변 생성
- 200K 토큰 컨텍스트 (긴 강의 내용 처리)
- 한국어 성능 최고 수준

### 📝 필요한 키
| 키 이름 | 용도 |
|--------|------|
| `ANTHROPIC_API_KEY` | Claude API 인증 |

### 📋 발급 방법

#### STEP 1: 회원가입
1. [https://console.anthropic.com](https://console.anthropic.com) 접속
2. **"Sign up"** 클릭
3. 가입 방법 선택:
   - 이메일 주소 입력 후 비밀번호 설정 또는
   - Google 계정으로 간편 가입
4. 이메일 인증 링크 클릭 (받은 편지함 확인)
5. 전화번호 입력 및 SMS 인증 (필수)

💰 **신규 가입 보너스**: $5 무료 크레딧 자동 지급! (2024년 기준)

#### STEP 2: 결제 수단 등록 (필수)
무료 크레딧 소진 후에도 서비스를 계속 이용하려면 카드 등록이 필요합니다.

1. 로그인 후 좌측 메뉴 **"Settings"** 클릭
2. **"Billing"** 탭 클릭
3. **"Add payment method"** 클릭
4. 카드 정보 입력:
   - 카드 번호
   - 만료일 (MM/YY)
   - CVC
   - 청구지 주소 (한국 주소 입력 가능)
5. **"Add card"** 클릭

#### STEP 3: 크레딧 충전 (선택)
1. **"Add credit"** 버튼 클릭
2. 충전 금액 선택:
   - 최소: $5
   - 권장: $20-50 (테스트 + 초기 운영)
3. **"Add credit"** 클릭

#### STEP 4: 사용량 제한 설정 (권장)
1. Billing 페이지에서 **"Monthly budget"** 섹션 찾기
2. 월 예산 설정:
   ```
   Monthly budget: $100
   → 이 금액 도달 시 알림 (자동 차단은 아님)
   ```
3. 알림 설정:
   ```
   ✅ Send email when 80% of budget is used
   ✅ Send email when 100% of budget is used
   ```
4. **"Save"** 클릭

#### STEP 5: API 키 생성
1. 좌측 메뉴에서 **🔑 "API Keys"** 클릭
   - 또는 직접 [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) 접속
2. **"Create Key"** 버튼 클릭
3. API Key 설정:
   ```
   Name: livey-chatbot
   Workspace: Default (기본값)
   ```
4. **"Create Key"** 클릭

#### STEP 6: API 키 복사 (⚠️ 중요!)
```
⚠️ 경고: API Key는 생성 시 단 한 번만 표시됩니다!
```

1. 팝업창에 표시된 API Key 전체 복사
   ```
   형식: sk-ant-api03-xxxxxxxxxxxxxxxxxxxx
   길이: 약 100자 이상
   환경변수명: ANTHROPIC_API_KEY
   ```
2. **"I've saved my API key"** 체크
3. **"Close"** 클릭

### 📊 사용량 확인
1. 좌측 메뉴 **"Dashboard"** 클릭
2. **"Usage"** 섹션에서 확인:
   - 총 사용 금액
   - 남은 크레딧
   - 모델별 사용량 (Claude 3.5 Sonnet)
3. **"API Requests"** 탭에서 상세 로그 확인

### ✅ 완료 확인
- [ ] 회원가입 및 전화번호 인증 완료
- [ ] $5 무료 크레딧 확인
- [ ] 결제 카드 등록 완료 (무료 크레딧 소진 대비)
- [ ] 월 예산 한도 설정 완료
- [ ] API Key 생성 및 안전하게 저장 (sk-ant-로 시작)

### 💰 비용
- **무료 크레딧**: $5 (약 30-50회 답변)
- **Claude 3.5 Sonnet**:
  - Input: $3 / 1M 토큰
  - Output: $15 / 1M 토큰
- 평균 1회 질문 답변: $0.05-0.15
- 100회 답변: 약 $10

---

## 5. Pinecone

### 🎯 서비스 역할
- **벡터 데이터베이스**
- 자막/PDF 임베딩 벡터 저장
- 의미 기반 유사도 검색
- 실시간 RAG 구현

### 📝 필요한 키
| 키 이름 | 용도 |
|--------|------|
| `PINECONE_API_KEY` | Pinecone API 인증 |
| `PINECONE_ENVIRONMENT` | 서버 리전 (예: us-east-1) |
| `PINECONE_INDEX_NAME` | 벡터 인덱스 이름 |

### 📋 발급 방법

#### STEP 1: 회원가입
1. [https://www.pinecone.io](https://www.pinecone.io) 접속
2. 우측 상단 **"Sign Up Free"** 클릭
3. 가입 방법 선택 (권장: Google 계정으로 간편 가입)
   - Google 계정 연동 또는
   - 이메일 + 비밀번호
4. 이메일 인증 완료

💰 **무료 플랜**: Starter (100K 벡터, 1개 인덱스, 무료)

#### STEP 2: 프로젝트 자동 생성
1. 로그인 후 자동으로 첫 프로젝트 생성 시작
2. 프로젝트 설정:
   ```
   Project Name: livey (또는 자동 생성된 이름 사용)
   Cloud Provider: AWS (자동 선택)
   Region: us-east-1 (무료 플랜은 선택 불가, 자동 설정)
   ```
3. 프로젝트 생성 완료 대기 (10-20초)

#### STEP 3: API 키 확인/생성
1. 좌측 메뉴에서 **"API Keys"** 클릭
2. 기본 생성된 **"Default"** API Key 확인
   - 또는 새로 생성: **"Create API Key"** 클릭
3. 새 API Key 생성 시:
   ```
   Key Name: livey-production
   Environment: 자동 선택됨 (예: us-east-1)
   ```
4. **"Create Key"** 클릭

#### STEP 4: API 키 및 Environment 복사
```
💡 Pinecone은 API Key를 여러 번 확인할 수 있습니다 (편리!)
```

1. **API Key** 복사:
   ```
   복사 위치: API Keys 페이지에서 키 옆 복사 아이콘 클릭
   형식: pcsk_xxxxx_yyyyyyyyyyyyyyyyyyyyyyyy
   환경변수명: PINECONE_API_KEY
   ```

2. **Environment** 복사:
   ```
   확인 위치: API Key 아래 또는 옆에 표시됨
   형식: us-east-1 (또는 gcp-starter, aws-starter 등)
   환경변수명: PINECONE_ENVIRONMENT
   ```

#### STEP 5: 인덱스 생성
벡터를 저장할 인덱스를 생성합니다.

1. 좌측 메뉴에서 **"Indexes"** 클릭
2. **"Create Index"** 버튼 클릭
3. 인덱스 설정 입력:
   ```
   Index Name: livey-vectors
   Dimensions: 1536
     ↳ OpenAI text-embedding-3-small 모델의 벡터 차원
   Metric: cosine
     ↳ 코사인 유사도 (텍스트 검색에 최적)
   Pod Type:
     - Starter (무료): starter-free
     - Standard (유료): s1.x1 (권장)
   ```

4. **"Create Index"** 클릭
5. 인덱스 생성 대기 (1-2분)
   - 상태가 "Initializing" → "Ready"로 변경되면 완료

#### STEP 6: 인덱스 이름 복사
```
인덱스 이름: livey-vectors
환경변수명: PINECONE_INDEX_NAME
```

### 📊 사용량 확인
1. 좌측 메뉴 **"Usage"** 클릭
2. 확인 가능 항목:
   - 저장된 벡터 수
   - 쿼리 요청 수
   - 플랜 한도 (Starter: 100K 벡터)

### ✅ 완료 확인
- [ ] 회원가입 완료
- [ ] 프로젝트 생성 완료
- [ ] API Key 복사 완료 (pcsk_로 시작)
- [ ] Environment 복사 완료 (예: us-east-1)
- [ ] 인덱스 생성 완료 (livey-vectors)
- [ ] 인덱스 상태가 "Ready"인지 확인

### 💰 비용
- **Starter (무료)**: 100K 벡터, 1개 인덱스
- **Standard**: $70/월 (100K 벡터, 5개 인덱스, 성능 향상)
- **Enterprise**: 커스텀 가격

---

## 6. Google Cloud Translation

### 🎯 서비스 역할
- **실시간 번역**
- 한국어 ↔ 영어, 일본어, 중국어 등
- 높은 번역 품질 (90%+ 정확도)

### 📝 필요한 키
| 키 이름 | 용도 |
|--------|------|
| `GOOGLE_TRANSLATE_API_KEY` | Translation API 인증 |

### 📋 발급 방법

#### STEP 1: Google Cloud 프로젝트 생성
1. [https://console.cloud.google.com](https://console.cloud.google.com) 접속
2. Google 계정으로 로그인
3. 첫 방문 시:
   - 약관 동의
   - 국가 선택: **대한민국**
   - 이메일 수신 동의 (선택)
   - **"동의 및 계속하기"** 클릭

4. 상단 프로젝트 선택 드롭다운 클릭 (현재 프로젝트명 표시됨)
5. 팝업창에서 **"새 프로젝트"** 클릭
6. 프로젝트 정보 입력:
   ```
   프로젝트 이름: livey-production
   위치: 조직 없음 (개인 프로젝트)
   ```
7. **"만들기"** 클릭
8. 생성 완료 대기 (10-20초)
9. 상단 알림 벨 🔔 클릭 → **"프로젝트 선택"** 클릭

#### STEP 2: 결제 계정 연결 (필수)
⚠️ **중요**: Google Cloud API 사용을 위해 결제 계정 등록이 필수입니다.

1. 좌측 메뉴 ☰ (햄버거 메뉴) 클릭
2. **"결제"** 메뉴 클릭
3. **"결제 계정 연결"** 또는 **"결제 사용 설정"** 클릭
4. 결제 정보 입력:
   ```
   국가: 대한민국
   통화: KRW (₩)
   ```
5. **약관 동의** 체크
6. **"계속"** 클릭
7. 카드 정보 입력:
   - 카드 번호
   - 만료일
   - CVC
   - 청구지 주소
8. **"무료 평가판 시작"** 클릭

💰 **신규 가입 보너스**: $300 무료 크레딧 (90일간 사용 가능)

⚠️ 참고: $1 검증 결제 후 자동 취소됨

#### STEP 3: Cloud Translation API 활성화
1. 좌측 메뉴 ☰ → **"API 및 서비스"** → **"라이브러리"** 클릭
   - 또는 직접 [https://console.cloud.google.com/apis/library](https://console.cloud.google.com/apis/library) 접속
2. 검색창에 **"Cloud Translation API"** 입력
3. 검색 결과에서 **"Cloud Translation API"** 클릭
   - ⚠️ 주의: "Cloud Translation API" 선택 (기본 버전)
   - "Translation AI" 또는 "Advanced" 버전 말고!
4. **"사용"** 또는 **"Enable"** 버튼 클릭
5. API 활성화 대기 (10-20초)
6. "API가 사용 설정됨" 메시지 확인

#### STEP 4: API 키 생성
1. 좌측 메뉴 ☰ → **"API 및 서비스"** → **"사용자 인증 정보"** 클릭
   - 또는 직접 [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) 접속
2. 상단 **"+ 사용자 인증 정보 만들기"** 클릭
3. 드롭다운 메뉴에서 **"API 키"** 선택
4. "API 키가 생성되었습니다" 팝업 표시
5. **즉시 복사하지 말고** → **"키 제한"** 버튼 클릭 (보안 강화)

#### STEP 5: API 키 보안 설정 (권장)
1. API 키 편집 화면에서 설정:
   ```
   이름: livey-translation-key
   ```

2. **애플리케이션 제한사항** 설정:
   - 개발/테스트: **"없음"** 선택 (제한 없음)
   - 프로덕션: **"IP 주소"** 선택 후 서버 IP 입력
     또는 **"HTTP 리퍼러"** 선택 후 도메인 입력
     (예: `https://your-app.vercel.app/*`)

3. **API 제한사항** 설정:
   - **"키 제한"** 선택
   - **"API 선택"** 드롭다운 클릭
   - ✅ **"Cloud Translation API"** 체크
   - 다른 API는 모두 해제

4. **"저장"** 클릭

#### STEP 6: API 키 복사
1. 사용자 인증 정보 페이지로 돌아가기
2. **"API 키"** 섹션에서 방금 생성한 키 찾기
3. 키 옆 **복사 아이콘** 클릭 또는 **"표시"** 클릭 후 복사
   ```
   형식: AIzaSyXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX
   환경변수명: GOOGLE_TRANSLATE_API_KEY
   ```

### 📊 사용량 및 할당량 확인
1. 좌측 메뉴 ☰ → **"API 및 서비스"** → **"할당량"** 클릭
2. 검색창에 **"Cloud Translation API"** 입력
3. 확인 가능 항목:
   - 무료 할당량: 500,000자/월
   - 현재 사용량
   - 남은 할당량

### 📊 비용 확인
1. 좌측 메뉴 ☰ → **"결제"** 클릭
2. **"보고서"** 탭에서 일별/서비스별 비용 확인
3. **"예산 및 알림"** 설정 (권장):
   - **"예산 만들기"** 클릭
   - 월 예산: $50
   - 알림: 50%, 90%, 100% 도달 시

### ✅ 완료 확인
- [ ] Google Cloud 프로젝트 생성 완료
- [ ] 결제 계정 연결 및 $300 크레딧 확인
- [ ] Cloud Translation API 활성화 완료
- [ ] API 키 생성 및 복사 완료 (AIza로 시작)
- [ ] API 키 제한 설정 완료 (보안)

### 💰 비용
- **무료 할당량**: 500,000자/월
- **초과 시**: $20 / 1M 자 (한국어 기준)
- 1시간 강의 번역 (약 10,000자): $0.20
- 100시간 강의: 약 $20

---

## 7. 환경 변수 설정 방법

모든 API 키를 발급받았다면, 이제 프로젝트에 설정하세요.

### 방법 1: .env.local 파일 생성 (권장)

#### STEP 1: 예제 파일 복사
터미널에서 프로젝트 루트 디렉토리로 이동 후 실행:

```bash
cp .env.example .env.local
```

#### STEP 2: .env.local 파일 편집
에디터로 `.env.local` 파일을 열고 발급받은 API 키를 입력:

```bash
# VS Code로 열기
code .env.local

# 또는 nano 에디터로 열기
nano .env.local
```

#### STEP 3: API 키 붙여넣기
각 변수에 발급받은 키를 입력:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Deepgram
DEEPGRAM_API_KEY=1234567890abcdef1234567890abcdef12345678

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxx

# Pinecone
PINECONE_API_KEY=pcsk_xxxxx_yyyyyyyyyyyyyyyyyyyyyyyy
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=livey-vectors

# Google Translate
GOOGLE_TRANSLATE_API_KEY=AIzaSyXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX
```

#### STEP 4: 저장 및 확인
1. 파일 저장 (Ctrl+S 또는 Cmd+S)
2. Git 상태 확인 (절대 커밋되지 않도록):
   ```bash
   git status
   ```
   → `.env.local`이 **보이지 않아야 정상** (.gitignore에 등록됨)

### 방법 2: Vercel 환경 변수 설정 (프로덕션)

Vercel에 배포 시:

1. [https://vercel.com](https://vercel.com) 로그인
2. 프로젝트 선택
3. **Settings** → **Environment Variables** 클릭
4. 각 환경 변수를 하나씩 추가:
   - Name: `DEEPGRAM_API_KEY`
   - Value: `발급받은 키`
   - Environments: ✅ Production ✅ Preview ✅ Development
5. **"Save"** 클릭
6. 모든 환경 변수 반복 추가

---

## 8. 발급 완료 체크리스트

모든 API 키를 발급받았는지 최종 확인하세요!

### 📋 필수 API 키

- [ ] **Supabase** (3개 키)
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Deepgram** (1개 키)
  - [ ] `DEEPGRAM_API_KEY`
  - [ ] $200 무료 크레딧 확인

- [ ] **OpenAI** (1개 키)
  - [ ] `OPENAI_API_KEY`
  - [ ] 결제 카드 등록 완료
  - [ ] 최소 $5 크레딧 충전

- [ ] **Anthropic Claude** (1개 키)
  - [ ] `ANTHROPIC_API_KEY`
  - [ ] 결제 카드 등록 완료
  - [ ] $5 무료 크레딧 확인

- [ ] **Pinecone** (3개 값)
  - [ ] `PINECONE_API_KEY`
  - [ ] `PINECONE_ENVIRONMENT`
  - [ ] `PINECONE_INDEX_NAME`
  - [ ] 인덱스 생성 완료 (1536 차원, cosine)

- [ ] **Google Cloud Translation** (1개 키)
  - [ ] `GOOGLE_TRANSLATE_API_KEY`
  - [ ] 결제 계정 연결 완료
  - [ ] $300 무료 크레딧 확인
  - [ ] Translation API 활성화 완료

### 🔒 보안 체크리스트

- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] `git status`에서 `.env.local`이 보이지 않는지 확인
- [ ] GitHub 등 공개 저장소에 API 키가 노출되지 않았는지 확인
- [ ] `service_role` 키는 절대 클라이언트 코드에 사용하지 않기

### 💰 비용 모니터링 설정

- [ ] OpenAI 사용량 한도 설정 ($50/월)
- [ ] Anthropic 월 예산 설정 ($100/월)
- [ ] Google Cloud 예산 및 알림 설정
- [ ] Deepgram 사용량 대시보드 북마크
- [ ] Pinecone 사용량 확인 (100K 벡터 한도)

---

## 🎉 완료!

모든 API 키 발급이 완료되었습니다!

### 다음 단계:
1. ✅ `.env.local` 파일에 모든 키 입력 확인
2. ✅ 프로젝트 실행 테스트:
   ```bash
   npm install
   npm run dev
   ```
3. ✅ 각 API 연결 테스트 (다음 단계에서 코드 작성 예정)

### 문제 발생 시:
- API 키가 작동하지 않으면 → 해당 서비스 대시보드에서 키 재생성
- 결제 오류 발생 시 → 카드 정보 재입력 또는 다른 카드 시도
- 할당량 초과 시 → 사용량 확인 후 플랜 업그레이드 고려

---

**문서 작성일**: 2025-10-24
**최종 업데이트**: 2025-10-24
**작성자**: Claude (Anthropic)
