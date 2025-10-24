-- ================================================================
-- LIVEY 데이터베이스 스키마
-- ================================================================
-- Supabase SQL Editor에서 실행하세요
-- ================================================================

-- 1. 강의 테이블
CREATE TABLE IF NOT EXISTS lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'recording', 'completed')),
  audio_file_url TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 자막 테이블
CREATE TABLE IF NOT EXISTS captions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  speaker TEXT DEFAULT '화자',
  language TEXT DEFAULT 'ko',
  timestamp_seconds DECIMAL(10, 3) NOT NULL,
  is_final BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 문서 테이블 (PDF 등)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- 인덱스 생성 (성능 최적화)
-- ================================================================

-- 강의 조회 최적화
CREATE INDEX IF NOT EXISTS idx_lectures_user_id ON lectures(user_id);
CREATE INDEX IF NOT EXISTS idx_lectures_created_at ON lectures(created_at DESC);

-- 자막 조회 최적화
CREATE INDEX IF NOT EXISTS idx_captions_lecture_id ON captions(lecture_id);
CREATE INDEX IF NOT EXISTS idx_captions_timestamp ON captions(timestamp_seconds);

-- 문서 조회 최적화
CREATE INDEX IF NOT EXISTS idx_documents_lecture_id ON documents(lecture_id);

-- 채팅 조회 최적화
CREATE INDEX IF NOT EXISTS idx_chat_messages_lecture_id ON chat_messages(lecture_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- ================================================================
-- Row Level Security (RLS) 정책
-- ================================================================

-- RLS 활성화
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE captions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 강의 정책: 본인의 강의만 접근 가능
CREATE POLICY "Users can view their own lectures"
  ON lectures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lectures"
  ON lectures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lectures"
  ON lectures FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lectures"
  ON lectures FOR DELETE
  USING (auth.uid() = user_id);

-- 자막 정책: 강의 소유자만 접근 가능
CREATE POLICY "Users can view captions of their lectures"
  ON captions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lectures
      WHERE lectures.id = captions.lecture_id
      AND lectures.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert captions to their lectures"
  ON captions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lectures
      WHERE lectures.id = captions.lecture_id
      AND lectures.user_id = auth.uid()
    )
  );

-- 문서 정책: 본인의 문서만 접근 가능
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- 채팅 메시지 정책: 본인의 메시지만 접근 가능
CREATE POLICY "Users can view their own chat messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- 완료!
-- ================================================================
