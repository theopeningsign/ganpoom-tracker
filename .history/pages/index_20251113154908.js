import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function HomePage() {
  const [stats, setStats] = useState({
    totalAgents: 3,
    totalClicks: 156,
    totalQuotes: 23,
    conversionRate: 14.7
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 - 메뉴들 떨어뜨리기 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ganpoom Tracker</h1>
              <p className="mt-1 text-sm text-gray-500">링크 트래킹 및 에이전트 관리 시스템</p>
            </div>
            
            {/* 메뉴들 - 간격 넓히기 */}
            <div className="flex items-center space-x-8">
              <Link href="/admin/agents" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                에이전트 관리
              </Link>
              <Link href="/admin/settlement" className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors">
                정산 관리
              </Link>
              <Link href="/admin/test" className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                대시보드
              </Link>
              <Link href="/test-ganpoom" className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors">
                테스트
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 2열 레이아웃 - 왼쪽: 통계, 오른쪽: 빠른 액션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* 왼쪽: 통계 카드들 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">실시간 통계</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">총 에이전트</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalAgents}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">👥</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">총 클릭</p>
                    <p className="text-3xl font-bold text-green-600">{stats.totalClicks.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">🔗</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">견적 요청</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.totalQuotes}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">📋</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">전환율</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.conversionRate}%</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold">📈</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 빠른 액션 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">빠른 액션</h2>
            <div className="space-y-4">
              <Link href="/admin/agents" className="block bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">에이전트 관리</h3>
                    <p className="text-gray-600">새 에이전트 생성 및 기존 에이전트 관리</p>
                  </div>
                  <div className="text-blue-500 text-2xl">→</div>
                </div>
              </Link>

              <Link href="/admin/settlement" className="block bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">정산 관리</h3>
                    <p className="text-gray-600">월별 커미션 정산 및 지급 관리</p>
                  </div>
                  <div className="text-green-500 text-2xl">→</div>
                </div>
              </Link>

              <Link href="/admin/test" className="block bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">대시보드</h3>
                    <p className="text-gray-600">상세 분석 및 통계 확인</p>
                  </div>
                  <div className="text-purple-500 text-2xl">→</div>
                </div>
              </Link>

              <Link href="/test-ganpoom" className="block bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">시스템 테스트</h3>
                    <p className="text-gray-600">링크 추적 및 시스템 테스트</p>
                  </div>
                  <div className="text-orange-500 text-2xl">→</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* 하단: 최근 활동 - 전체 폭 사용 */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">최근 견적요청</h2>
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-medium text-gray-900">오늘의 견적요청</h3>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">이</span>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">이영희</p>
                    <p className="text-sm text-gray-500">간판제작 • 2024.01.16 오후 6:25</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">₩4,500,000</p>
                  <p className="text-sm text-gray-500">커미션: ₩10,000</p>
                </div>
              </div>
              
              <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">김</span>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">김철수</p>
                    <p className="text-sm text-gray-500">웹드문제작 • 2024.01.16 오후 6:15</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">₩5,600,000</p>
                  <p className="text-sm text-gray-500">커미션: ₩10,000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}