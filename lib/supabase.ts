import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

// 클라이언트 컴포넌트에서 사용할 수 있도록 createClient 함수도 export
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
