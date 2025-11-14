import { supabaseAdmin } from '../../../lib/supabase'

// 짧은 ID 생성 함수
function generateShortId() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// ID 중복 확인 및 생성
async function generateUniqueId() {
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    const id = generateShortId()
    
    // 중복 확인
    const { data, error } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('id', id)
      .single()
    
    if (error && error.code === 'PGRST116') {
      // 데이터가 없음 = 중복 없음
      return id
    }
    
    attempts++
  }
  
  throw new Error('고유 ID 생성 실패')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 환경변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase 환경변수가 설정되지 않았습니다.')
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Supabase credentials not configured'
      })
    }

    const { name, memo, phone, email, account, account_number } = req.body

    // 필수 필드 검증
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: '에이전트 이름은 필수입니다' })
    }
    
    if (!phone || phone.trim().length === 0) {
      return res.status(400).json({ error: '전화번호는 필수입니다' })
    }
    
    if (!account && !account_number) {
      return res.status(400).json({ error: '계좌번호는 필수입니다' })
    }

    // 이메일 형식 검증 (입력된 경우에만)
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: '올바른 이메일 형식을 입력해주세요' })
      }
    }

    // 고유 ID 생성
    const agentId = await generateUniqueId()

    // 에이전트 생성
    const { data, error } = await supabaseAdmin
      .from('agents')
      .insert([
        {
          id: agentId,
          name: name.trim(),
          memo: memo?.trim() || null,
          email: email?.trim() || null, // 이메일은 선택사항
          phone: phone?.trim() || null,
          account_number: (account || account_number)?.trim() || null, // account 또는 account_number 모두 지원
          commission_rate: 10.0, // 기본값 10% (향후 필요시 폼에서 입력받을 수 있음)
          is_active: true
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('에이전트 생성 오류:', error)
      console.error('에러 상세:', JSON.stringify(error, null, 2))
      return res.status(500).json({ 
        error: '에이전트 생성 실패',
        details: error.message || 'Unknown error'
      })
    }

    // 추적 링크 생성
    const trackingLink = `https://www.ganpoom.com/?ref=${agentId}`

    res.status(201).json({
      success: true,
      agent: data,
      trackingLink: trackingLink
    })

  } catch (error) {
    console.error('API 오류:', error)
    res.status(500).json({ error: '서버 오류가 발생했습니다' })
  }
}

