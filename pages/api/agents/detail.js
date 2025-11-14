import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ error: 'Agent ID is required' })
    }

    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id, name, phone, email, account_number, memo, created_at')
      .eq('id', id)
      .single()

    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agent not found' })
    }

    const [clickResult, quoteResult, todayQuotesResult] = await Promise.all([
      supabaseAdmin
        .from('link_clicks')
        .select('*', { count: 'exact' })
        .eq('agent_id', id),
      supabaseAdmin
        .from('quote_requests')
        .select('*', { count: 'exact' })
        .eq('agent_id', id),
      (() => {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)
        return supabaseAdmin
          .from('quote_requests')
          .select('id', { count: 'exact' })
          .eq('agent_id', id)
          .gte('created_at', todayStart.toISOString())
          .lte('created_at', todayEnd.toISOString())
      })()
    ])

    res.status(200).json({
      success: true,
      agent: {
        ...agent,
        totalClicks: clickResult.count || 0,
        totalQuotes: quoteResult.count || 0,
        todayQuotes: todayQuotesResult.count || 0
      }
    })
  } catch (error) {
    console.error('Agent detail API error:', error)
    res.status(500).json({ error: 'Server error occurred' })
  }
}

