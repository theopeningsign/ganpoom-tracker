import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Supabase에서 활성 에이전트 목록 조회
    const { data: agents, error } = await supabaseAdmin
      .from('agents')
      .select(`
        id,
        name,
        phone,
        account_number,
        memo,
        commission_rate,
        is_active,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('에이전트 목록 조회 오류:', error)
      console.error('에러 상세:', JSON.stringify(error, null, 2))
      return res.status(500).json({ 
        error: 'Database query failed',
        details: error.message || 'Unknown error'
      })
    }

    // 각 에이전트별 통계 정보 추가 (옵션)
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        // 링크 클릭 수 조회
        const { count: clickCount } = await supabaseAdmin
          .from('link_clicks')
          .select('*', { count: 'exact' })
          .eq('agent_id', agent.id)

        // 견적 요청 수 조회
        const { count: quoteCount } = await supabaseAdmin
          .from('quote_requests')
          .select('*', { count: 'exact' })
          .eq('agent_id', agent.id)

        // 총 커미션 계산
        const { data: commissionData } = await supabaseAdmin
          .from('quote_requests')
          .select('commission_amount')
          .eq('agent_id', agent.id)
          .not('commission_amount', 'is', null)

        const totalCommission = commissionData?.reduce((sum, item) => 
          sum + (item.commission_amount || 0), 0
        ) || 0

        // 전환율 계산
        const conversionRate = clickCount > 0 ? 
          ((quoteCount / clickCount) * 100).toFixed(1) : '0.0'

        // 추적 링크 생성
        const trackingLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ganpoom.com'}?ref=${agent.id}`

        return {
          ...agent,
          clicks: clickCount || 0,
          quotes: quoteCount || 0,
          commission: totalCommission,
          conversionRate: conversionRate,
          trackingLink: trackingLink
        }
      })
    )

    res.status(200).json({
      success: true,
      agents: agentsWithStats,
      total: agentsWithStats.length
    })

  } catch (error) {
    console.error('에이전트 목록 API 오류:', error)
    res.status(500).json({ error: 'Server error occurred' })
  }
}
