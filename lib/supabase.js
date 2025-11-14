import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 환경변수 확인 (서버 사이드에서만)
if (typeof window === 'undefined') {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('Supabase 환경변수가 설정되지 않았습니다.')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '설정됨' : '없음')
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음')
  }
}

// 클라이언트용 (브라우저)
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// 서버용 (API 라우트)
export const supabaseAdmin = createClient(
  supabaseUrl || '', 
  supabaseServiceKey || '', 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

