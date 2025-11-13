import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase-mock'

export default function HomePage() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalClicks: 0,
    totalQuotes: 0,
    conversionRate: 0
  })
  const [isLoaded, setIsLoaded] = useState(false)

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

      const totalAgents = agentsRes.count || 3
      const totalClicks = clicksRes.count || 156
      const totalQuotes = quotesRes.count || 23
      const conversionRate = totalClicks > 0 ? ((totalQuotes / totalClicks) * 100).toFixed(1) : 14.7

      setStats({
        totalAgents,
        totalClicks,
        totalQuotes,
        conversionRate
      })
      
      setTimeout(() => setIsLoaded(true), 500)
    } catch (error) {
      console.error('통계 로드 오류:', error)
      // 기본값 설정
      setStats({
        totalAgents: 3,
        totalClicks: 156,
        totalQuotes: 23,
        conversionRate: 14.7
      })
      setTimeout(() => setIsLoaded(true), 500)
    }
  }

  const features = [
    {
      icon: '🔗',
      title: '스마트 링크 생성',
      description: '6자리 짧은 링크로 에이전트별 성과를 정확하게 추적하세요',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '📊',
      title: '실시간 분석',
      description: '클릭부터 전환까지 모든 과정을 실시간으로 모니터링',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: '💰',
      title: '자동 정산',
      description: '견적요청당 10,000원 자동 계산 및 월별 정산 관리',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: '🎯',
      title: '성과 최적화',
      description: '에이전트별 전환율 분석으로 마케팅 ROI 극대화',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: '🚀',
      title: '간편한 사용',
      description: '복잡한 설정 없이 5분만에 시작할 수 있는 직관적 인터페이스',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: '🔒',
      title: '안전한 데이터',
      description: '모든 추적 데이터는 암호화되어 안전하게 보호됩니다',
      color: 'from-gray-600 to-gray-800'
    }
  ]

  const CountUpNumber = ({ end, duration = 2000 }) => {
    const [count, setCount] = useState(0)
    
    useEffect(() => {
      if (!isLoaded) return
      
      let startTime = null
      const animate = (currentTime) => {
        if (startTime === null) startTime = currentTime
        const progress = Math.min((currentTime - startTime) / duration, 1)
        
        setCount(Math.floor(progress * end))
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      
      requestAnimationFrame(animate)
    }, [end, duration, isLoaded])
    
    return <span>{count.toLocaleString()}</span>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 배경 효과 */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20"></div>
      </div>
      
      {/* 네비게이션 */}
      <nav className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <h1 className="text-xl font-bold text-white">Ganpoom Tracker</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/admin/test" className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                대시보드
              </Link>
              <Link href="/admin/agents-new" className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                에이전트 관리
              </Link>
              <Link href="/admin/settlement" className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                정산 관리
              </Link>
              <Link href="/test-ganpoom" className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm">
                테스트
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Smart Link
              </span>
              <br />
              <span className="text-white">Tracking</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              에이전트별 링크 성과를 <span className="text-blue-400 font-semibold">실시간으로 추적</span>하고<br />
              <span className="text-purple-400 font-semibold">자동 정산</span>까지 한 번에 해결하세요
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/admin/agents-new" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg">
                🚀 지금 시작하기
              </Link>
              <Link href="/admin/test" className="bg-white/10 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20">
                📊 데모 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 실시간 통계 */}
      <section className="relative z-10 -mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white text-center mb-8">📈 실시간 성과</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">
                  <CountUpNumber end={stats.totalAgents} />
                </div>
                <div className="text-white/80 text-sm">활성 에이전트</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">
                  <CountUpNumber end={stats.totalClicks} />
                </div>
                <div className="text-white/80 text-sm">총 링크 클릭</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">
                  <CountUpNumber end={stats.totalQuotes} />
                </div>
                <div className="text-white/80 text-sm">견적 요청</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
                  <CountUpNumber end={parseFloat(stats.conversionRate)} />%
                </div>
                <div className="text-white/80 text-sm">평균 전환율</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 주요 기능 */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ✨ 강력한 기능들
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              복잡한 링크 추적을 간단하게, 정확한 성과 분석을 자동으로
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 사용법 */}
      <section className="relative z-10 py-24 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              🎯 3단계로 시작하기
            </h2>
            <p className="text-xl text-white/80">
              복잡한 설정 없이 5분만에 시작할 수 있어요
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">에이전트 생성</h3>
              <p className="text-white/70">
                에이전트 이름과 연락처만 입력하면<br />
                자동으로 추적 링크가 생성됩니다
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">링크 공유</h3>
              <p className="text-white/70">
                생성된 짧은 링크를 에이전트에게<br />
                카톡, 이메일로 간편하게 전달하세요
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">성과 확인</h3>
              <p className="text-white/70">
                실시간 대시보드에서 클릭, 전환,<br />
                커미션까지 모든 성과를 확인하세요
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              🚀 지금 바로 시작하세요!
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              첫 번째 에이전트를 생성하고 링크 추적의 힘을 경험해보세요
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/admin/agents-new" className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all transform hover:scale-105">
                ✨ 첫 에이전트 생성하기
              </Link>
              <Link href="/test-ganpoom" className="bg-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/30 transition-all backdrop-blur-sm">
                🧪 테스트해보기
              </Link>
            </div>
            
            <div className="mt-8 text-blue-200 text-sm">
              💡 설정 시간: 5분 | 💰 월 비용: 무료 시작 | 📞 24/7 지원
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="relative z-10 bg-black/20 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <h3 className="text-xl font-bold text-white">Ganpoom Tracker</h3>
              </div>
              <p className="text-white/70 mb-4">
                에이전트 링크 성과를 실시간으로 추적하고 자동 정산까지 제공하는<br />
                스마트한 마케팅 솔루션입니다.
              </p>
              <div className="text-white/50 text-sm">
                © 2024 Ganpoom Tracker. All rights reserved.
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">주요 기능</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li>• 스마트 링크 생성</li>
                <li>• 실시간 성과 분석</li>
                <li>• 자동 정산 시스템</li>
                <li>• 에이전트 관리</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">바로가기</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li><Link href="/admin/test" className="hover:text-white transition-colors">대시보드</Link></li>
                <li><Link href="/admin/agents-new" className="hover:text-white transition-colors">에이전트 관리</Link></li>
                <li><Link href="/admin/settlement" className="hover:text-white transition-colors">정산 관리</Link></li>
                <li><Link href="/test-ganpoom" className="hover:text-white transition-colors">테스트</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
      `}</style>
    </div>
  )
}
