export default function handler(req, res) {
  const {
    campaign, ad_group, keyword, keyword_id, ad,
    media, query, network, match, rank, final_url
  } = req.query

  const destination = final_url || 'https://www.ganpoom.com/'

  try {
    const url = new URL(destination)
    url.searchParams.set('utm_source', 'naver.searchad')
    url.searchParams.set('utm_medium', 'cpc')
    if (campaign)    url.searchParams.set('k_campaign', campaign)
    if (ad_group)    url.searchParams.set('k_adgroup', ad_group)
    if (keyword)     url.searchParams.set('k_keyword', keyword)
    if (keyword_id)  url.searchParams.set('k_keyword_id', keyword_id)
    if (ad)          url.searchParams.set('k_creative', ad)
    if (media)       url.searchParams.set('k_media', media)
    if (query)       url.searchParams.set('query', query)
    if (network)     url.searchParams.set('network', network)
    if (match)       url.searchParams.set('match', match)
    if (rank)        url.searchParams.set('rank', rank)

    return res.redirect(302, url.toString())
  } catch {
    return res.redirect(302, 'https://www.ganpoom.com/')
  }
}
