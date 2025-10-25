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

-- 5. 임베딩 테이블 (RAG용 벡터 저장)
-- pgvector 확장이 먼저 설치되어 있어야 합니다: CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  caption_id UUID REFERENCES captions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. 강의 요약 테이블 (슬라이딩 윈도우 요약)
CREATE TABLE IF NOT EXISTS lecture_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  caption_count INTEGER NOT NULL DEFAULT 0,
  last_caption_id UUID REFERENCES captions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- 임베딩 조회 최적화
CREATE INDEX IF NOT EXISTS idx_embeddings_lecture_id ON embeddings(lecture_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 요약 조회 최적화
CREATE INDEX IF NOT EXISTS idx_lecture_summaries_lecture_id ON lecture_summaries(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_summaries_updated_at ON lecture_summaries(updated_at DESC);

-- ================================================================
-- Row Level Security (RLS) 정책
-- ================================================================

-- RLS 활성화
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE captions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_summaries ENABLE ROW LEVEL SECURITY;

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

-- 임베딩 정책: 강의 소유자만 접근 가능
CREATE POLICY "Users can view embeddings of their lectures"
  ON embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lectures
      WHERE lectures.id = embeddings.lecture_id
      AND lectures.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert embeddings to their lectures"
  ON embeddings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lectures
      WHERE lectures.id = embeddings.lecture_id
      AND lectures.user_id = auth.uid()
    )
  );

-- 요약 정책: 강의 소유자만 접근 가능
CREATE POLICY "Users can view summaries of their lectures"
  ON lecture_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lectures
      WHERE lectures.id = lecture_summaries.lecture_id
      AND lectures.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert summaries to their lectures"
  ON lecture_summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lectures
      WHERE lectures.id = lecture_summaries.lecture_id
      AND lectures.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update summaries of their lectures"
  ON lecture_summaries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lectures
      WHERE lectures.id = lecture_summaries.lecture_id
      AND lectures.user_id = auth.uid()
    )
  );

-- ================================================================
-- 벡터 유사도 검색 함수
-- ================================================================

-- 유사도 검색 함수 (RAG에서 사용)
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(1536),
  match_lecture_id UUID,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity float,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    embeddings.id,
    embeddings.content,
    1 - (embeddings.embedding <=> query_embedding) AS similarity,
    embeddings.created_at
  FROM embeddings
  WHERE embeddings.lecture_id = match_lecture_id
    AND 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ================================================================
-- 완료!
-- ================================================================
