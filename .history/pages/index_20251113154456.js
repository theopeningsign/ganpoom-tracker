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
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ganpoom Tracker</h1>
              <p className="mt-1 text-sm text-gray-500">링크 트래킹 및 에이전트 관리 시스템</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/admin/agents" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                에이전트 관리
              </Link>
              <Link href="/admin/settlement" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                정산 관리
              </Link>
              <Link href="/admin/test" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                대시보드
              </Link>
              <Link href="/test-ganpoom" className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors">
                테스트
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 에이전트</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAgents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">C</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 클릭</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">Q</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">견적 요청</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalQuotes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">%</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">전환율</p>
                <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/admin/agents" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-xl">+</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">에이전트 관리</h3>
              <p className="text-sm text-gray-500">새 에이전트 생성 및 관리</p>
            </div>
          </Link>

          <Link href="/admin/settlement" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold text-xl">₩</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">정산 관리</h3>
              <p className="text-sm text-gray-500">월별 커미션 정산</p>
            </div>
          </Link>

          <Link href="/admin/test" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold text-xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">대시보드</h3>
              <p className="text-sm text-gray-500">상세 분석 및 통계</p>
            </div>
          </Link>

          <Link href="/test-ganpoom" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold text-xl">🧪</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">시스템 테스트</h3>
              <p className="text-sm text-gray-500">링크 추적 테스트</p>
            </div>
          </Link>
        </div>

        {/* 최근 활동 */}
        <div className="mt-12">
          <h2 className="text-lg font-medium text-gray-900 mb-6">최근 견적요청</h2>
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">이영희 (간판제작)</p>
                    <p className="text-sm text-gray-500">2024.01.16 오후 6:25</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">₩4,500,000</p>
                    <p className="text-xs text-gray-500">커미션: ₩10,000</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">김철수 (웹드문제작)</p>
                    <p className="text-sm text-gray-500">2024.01.16 오후 6:15</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">₩5,600,000</p>
                    <p className="text-xs text-gray-500">커미션: ₩10,000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}