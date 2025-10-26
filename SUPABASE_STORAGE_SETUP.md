# Supabase Storage 설정 가이드

녹음된 음성 파일을 저장하기 위해 Supabase Storage를 설정해야 합니다.

## 1. Storage 버킷 생성

1. Supabase Dashboard에 로그인: https://supabase.com/dashboard
2. 프로젝트 선택 (`ylpocejatafhikzbalbs`)
3. 좌측 메뉴에서 **Storage** 클릭
4. **Create a new bucket** 버튼 클릭
5. 다음 정보 입력:
   - **Name**: `audio-recordings`
   - **Public bucket**: ✅ 체크 (공개 버킷으로 설정)
   - **File size limit**: 100 MB (선택사항)
   - **Allowed MIME types**: `audio/webm, audio/wav, audio/mp3` (선택사항)
6. **Create bucket** 버튼 클릭

## 2. 데이터베이스 컬럼 추가

1. Supabase Dashboard에서 좌측 메뉴의 **SQL Editor** 클릭
2. **New query** 버튼 클릭
3. 다음 SQL 실행:

```sql
-- lectures 테이블에 audio_file_url 컬럼 추가
ALTER TABLE lectures
ADD COLUMN IF NOT EXISTS audio_file_url TEXT;
```

4. **Run** 버튼 클릭하여 실행

## 3. Storage RLS (Row Level Security) 정책 설정

음성 파일에 대한 접근 권한을 설정합니다.

1. Supabase Dashboard에서 **SQL Editor** 클릭
2. 다음 SQL 실행:

```sql
-- Storage: audio-recordings 버킷에 대한 RLS 정책 설정

-- 1. 사용자는 자신의 폴더에만 업로드 가능
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio-recordings' AND
  (storage.foldername(name))[1] = 'lectures' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 2. 사용자는 자신의 파일만 업데이트 가능
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'audio-recordings' AND
  (storage.foldername(name))[1] = 'lectures' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 3. 사용자는 자신의 파일만 삭제 가능
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audio-recordings' AND
  (storage.foldername(name))[1] = 'lectures' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 4. 모든 사용자가 파일 읽기 가능 (공개 버킷)
CREATE POLICY "Public files are accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-recordings');
```

## 4. 설정 완료 확인

1. **Storage** > **audio-recordings** 버킷이 생성되어 있는지 확인
2. **Database** > **Table Editor** > **lectures** 테이블에서 `audio_file_url` 컬럼이 추가되었는지 확인
3. **Storage** > **Policies** 에서 RLS 정책이 올바르게 설정되었는지 확인

## 5. 테스트

1. 웹사이트에서 녹음 시작
2. 녹음 종료 버튼 클릭
3. 콘솔에서 "✅ 오디오 파일 저장 완료" 메시지 확인
4. Supabase Storage에서 `lectures/{user_id}/{lecture_id}.webm` 파일 확인
5. "음성 다운로드" 버튼 클릭하여 다운로드 테스트

## 파일 구조

```
audio-recordings/
└── lectures/
    └── {user_id}/
        ├── {lecture_id_1}.webm
        ├── {lecture_id_2}.webm
        └── {lecture_id_3}.webm
```

## 문제 해결

### 업로드 실패 시
- Storage 버킷이 올바르게 생성되었는지 확인
- RLS 정책이 올바르게 설정되었는지 확인
- 브라우저 콘솔에서 오류 메시지 확인

### 다운로드 실패 시
- `audio_file_url`이 데이터베이스에 저장되었는지 확인
- Storage 버킷이 Public으로 설정되었는지 확인
- URL이 올바른지 확인

## 참고 사항

- 파일 크기는 녹음 시간에 따라 다릅니다 (평균 1시간 ≈ 10-20MB)
- 파일은 사용자별로 폴더가 분리되어 저장됩니다
