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
    const { name, memo, email, phone, commissionRate } = req.body

    // 필수 필드 검증
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: '에이전트 이름은 필수입니다' })
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
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          commission_rate: commissionRate || 10.0,
          is_active: true
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('에이전트 생성 오류:', error)
      return res.status(500).json({ error: '에이전트 생성 실패' })
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

