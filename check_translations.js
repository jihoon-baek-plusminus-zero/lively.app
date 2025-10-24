const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env.local 파일 읽기
const envContent = fs.readFileSync('.env.local', 'utf8');
const getEnvValue = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvValue('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvValue('SUPABASE_SERVICE_ROLE_KEY') || getEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  console.log('🔍 최근 자막 번역 저장 여부 확인...\n');

  // 최근 자막 10개 조회
  const { data, error } = await supabase
    .from('captions')
    .select('id, text, translated_text, created_at, lecture_id')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ 조회 실패:', error);
    return;
  }

  console.log('📊 최근 자막 10개:');
  console.log('=====================================\n');

  let translatedCount = 0;
  let notTranslatedCount = 0;

  data.forEach((caption, idx) => {
    const hasTranslation = !!caption.translated_text;
    if (hasTranslation) translatedCount++;
    else notTranslatedCount++;

    console.log(`[${idx + 1}] ${hasTranslation ? '✅' : '❌'}`);
    console.log(`   ID: ${caption.id.substring(0, 8)}...`);
    console.log(`   생성: ${new Date(caption.created_at).toLocaleString('ko-KR')}`);
    console.log(`   자막: ${caption.text.substring(0, 40)}...`);
    console.log(`   번역: ${hasTranslation ? caption.translated_text.substring(0, 40) + '...' : '❌ 없음'}`);
    console.log('');
  });

  console.log('=====================================');
  console.log(`✅ 번역 있음: ${translatedCount}개`);
  console.log(`❌ 번역 없음: ${notTranslatedCount}개`);
  console.log('=====================================\n');
})();
