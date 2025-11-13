import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function TestGanpoomPage() {
  const router = useRouter()
  const { ref } = router.query // URL에서 ref 파라미터 추출
  
  const [formData, setFormData] = useState({
    svc_type: '웹드문제작',
    req_type: '간단제작',
    title: '',
    area: '',
    phone: '',
    floor: 1,
    setup_date: '2주 이내',
    deadline: '1개월 이내',
    texture: '16시~18시',
    comments: ''
  })
  
  const [trackingStatus, setTrackingStatus] = useState('확인 중...')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // 추적 스크립트 동적 로드
    const script = document.createElement('script')
    script.src = '/test-tracker.js'
    script.async = true
    document.body.appendChild(script)

    // ref 파라미터가 있으면 추적 상태 업데이트
    if (ref) {
      setTrackingStatus(`✅ 추적 중 (에이전트: ${ref})`)
    } else {
      setTrackingStatus('❌ 추적 링크로 접속하지 않음')
    }

    return () => {
      document.body.removeChild(script)
    }
  }, [ref])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 실제 ganpoom.com과 동일한 방식으로 폼 제출 시뮬레이션
      console.log('📋 견적요청 폼 제출:', formData)
      
      // 추적 스크립트에서 자동으로 감지하도록 이벤트 발생
      const submitEvent = new Event('submit', { bubbles: true })
      e.target.dispatchEvent(submitEvent)
      
      // 성공 메시지
      alert('견적요청이 완료되었습니다!\n추적 데이터가 기록되었습니다.')
      
      // 폼 초기화
      setFormData({
        svc_type: '웹드문제작',
        req_type: '간단제작',
        title: '',
        area: '',
        phone: '',
        floor: 1,
        setup_date: '2주 이내',
        deadline: '1개월 이내',
        texture: '16시~18시',
        comments: ''
      })
      
    } catch (error) {
      console.error('폼 제출 오류:', error)
      alert('오류가 발생했습니다: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">시스템 테스트</h1>
              <p className="mt-1 text-sm text-gray-500">실제 ganpoom.com과 동일한 견적요청 폼</p>
            </div>
            
            {/* 메뉴들 - 간격 넓히기 */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors">
                홈
              </Link>
              <Link href="/admin/agents" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                에이전트 관리
              </Link>
              <Link href="/admin/settlement" className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors">
                정산 관리
              </Link>
              <Link href="/admin/test" className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                대시보드
              </Link>
              <div className="text-right">
                <div className="text-sm text-gray-500">추적 상태</div>
                <div className="font-medium text-orange-600">{trackingStatus}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-medium text-blue-900 mb-2">🧪 테스트 방법</h3>
          <ol className="text-blue-800 space-y-1">
            <li>1. 관리자 페이지에서 에이전트 생성</li>
            <li>2. 생성된 추적 링크로 이 페이지 접속</li>
            <li>3. 아래 견적요청 폼 작성 후 제출</li>
            <li>4. 관리자 대시보드에서 추적 결과 확인</li>
          </ol>
        </div>

        {/* 견적요청 폼 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">견적 요청하기</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  서비스 타입 *
                </label>
                <select
                  name="svc_type"
                  value={formData.svc_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="웹드문제작">웹드문 제작</option>
                  <option value="간판제작">간판 제작</option>
                  <option value="인테리어">인테리어</option>
                  <option value="외관공사">외관 공사</option>
                  <option value="리모델링">리모델링</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  요청 타입 *
                </label>
                <select
                  name="req_type"
                  value={formData.req_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="간단제작">간단 제작</option>
                  <option value="고급제작">고급 제작</option>
                  <option value="프리미엄제작">프리미엄 제작</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목/회사명 *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="예: 카페 간판"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연락처 *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주소/지역 *
              </label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                required
                placeholder="서울 강남구 테헤란로 123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  층수
                </label>
                <input
                  type="number"
                  name="floor"
                  value={formData.floor}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설치 희망일
                </label>
                <select
                  name="setup_date"
                  value={formData.setup_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1주 이내">1주 이내</option>
                  <option value="2주 이내">2주 이내</option>
                  <option value="1개월 이내">1개월 이내</option>
                  <option value="협의">협의</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  완료 기한
                </label>
                <select
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2주 이내">2주 이내</option>
                  <option value="1개월 이내">1개월 이내</option>
                  <option value="2개월 이내">2개월 이내</option>
                  <option value="협의">협의</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상세 요청사항
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                rows="4"
                placeholder="프로젝트에 대한 상세한 요구사항을 입력해주세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '제출 중...' : '견적 요청하기'}
              </button>
            </div>
          </form>
        </div>

        {/* 테스트 링크 생성 도구 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-900 mb-2">🔗 테스트 링크 생성</h3>
          <p className="text-yellow-800 mb-3">
            에이전트 ID를 입력하면 테스트용 추적 링크를 생성합니다.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="에이전트 ID (예: Ab3kM9)"
              className="flex-1 px-3 py-2 border border-yellow-300 rounded-md"
              id="testAgentId"
            />
            <button
              onClick={() => {
                const agentId = document.getElementById('testAgentId').value
                if (agentId) {
                  const testLink = `${window.location.origin}/test-ganpoom?ref=${agentId}`
                  navigator.clipboard.writeText(testLink)
                  alert(`테스트 링크가 복사되었습니다!\n${testLink}`)
                } else {
                  alert('에이전트 ID를 입력해주세요.')
                }
              }}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
            >
              링크 생성 & 복사
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
