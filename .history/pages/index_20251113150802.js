import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalClicks: 0,
    totalQuotes: 0,
    conversionRate: 0
  })

  useEffect(() => {
    loadBasicStats()
  }, [])

  const loadBasicStats = async () => {
    try {
      const [agentsRes, clicksRes, quotesRes] = await Promise.all([
        supabase.from('agents').select('id', { count: 'exact' }),
        supabase.from('link_clicks').select('id', { count: 'exact' }),
        supabase.from('quote_requests').select('id', { count: 'exact' })
      ])

      const totalAgents = agentsRes.count || 0
      const totalClicks = clicksRes.count || 0
      const totalQuotes = quotesRes.count || 0
      const conversionRate = totalClicks > 0 ? ((totalQuotes / totalClicks) * 100).toFixed(1) : 0

      setStats({
        totalAgents,
        totalClicks,
        totalQuotes,
        conversionRate
      })
    } catch (error) {
      console.error('통계 로드 오류:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary-600">Ganpoom Tracker</h1>
              </div>
            </div>
            <nav className="flex space-x-8">
              <Link href="/admin" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                관리자 대시보드
              </Link>
              <Link href="/admin/agents" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                에이전트 관리
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 히어로 섹션 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Ganpoom</span>
            <span className="block text-primary-600">링크 트래킹 시스템</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            에이전트별 링크 성과를 실시간으로 추적하고 분석하세요. 
            견적요청부터 전환까지 모든 과정을 자동으로 기록합니다.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link href="/admin" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10">
                대시보드 보기
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link href="/admin/agents" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                에이전트 관리
              </Link>
            </div>
          </div>
        </div>

        {/* 실시간 통계 */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">실시간 통계</h2>
            <p className="mt-2 text-lg text-gray-600">현재까지의 성과를 한눈에 확인하세요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">{stats.totalAgents}</div>
              <div className="text-gray-600">총 에이전트</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-success-600 mb-2">{stats.totalClicks.toLocaleString()}</div>
              <div className="text-gray-600">총 링크 클릭</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-warning-600 mb-2">{stats.totalQuotes.toLocaleString()}</div>
              <div className="text-gray-600">견적 요청</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-danger-600 mb-2">{stats.conversionRate}%</div>
              <div className="text-gray-600">전환율</div>
            </div>
          </div>
        </div>

        {/* 주요 기능 */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">주요 기능</h2>
            <p className="mt-2 text-lg text-gray-600">강력하고 사용하기 쉬운 트래킹 시스템</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-primary-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">짧은 링크 생성</h3>
              <p className="text-gray-600">
                에이전트별로 고유한 짧은 추적 링크를 자동 생성합니다. 
                공유하기 쉽고 기억하기 쉬운 형태로 제공됩니다.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-success-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">실시간 분석</h3>
              <p className="text-gray-600">
                링크 클릭부터 견적요청까지 모든 과정을 실시간으로 추적하고 
                상세한 분석 데이터를 제공합니다.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-warning-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">자동 수익 계산</h3>
              <p className="text-gray-600">
                서비스 타입과 프로젝트 규모에 따라 예상 계약 금액과 
                에이전트 커미션을 자동으로 계산합니다.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-danger-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM16 3H4v2h12V3zM4 7h12v2H4V7zM4 11h12v2H4v-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">상세 리포트</h3>
              <p className="text-gray-600">
                에이전트별, 기간별, 서비스별 상세한 성과 리포트를 
                생성하고 다운로드할 수 있습니다.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-indigo-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM16 3H4v2h12V3zM4 7h12v2H4V7zM4 11h12v2H4v-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">실시간 알림</h3>
              <p className="text-gray-600">
                새로운 견적요청이나 중요한 이벤트 발생 시 
                즉시 알림을 받을 수 있습니다.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-purple-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">안전한 데이터</h3>
              <p className="text-gray-600">
                모든 데이터는 암호화되어 안전하게 저장되며, 
                GDPR 및 개인정보보호법을 준수합니다.
              </p>
            </div>
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="bg-primary-600 rounded-lg shadow-xl">
          <div className="px-6 py-12 sm:px-12 sm:py-16 lg:px-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">
                지금 바로 시작하세요
              </h2>
              <p className="mt-4 text-xl text-primary-100">
                에이전트 링크 성과를 실시간으로 추적하고 수익을 극대화하세요
              </p>
              <div className="mt-8">
                <Link href="/admin/agents" className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                  첫 번째 에이전트 생성하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 Ganpoom Tracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
