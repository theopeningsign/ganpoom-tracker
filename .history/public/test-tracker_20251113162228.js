// 테스트용 Ganpoom 추적 스크립트 - test-ganpoom 페이지용

(function() {
    console.log('🎯 Ganpoom 테스트 추적기 시작!')
    
    // 1. URL에서 에이전트 정보 확인
    const urlParams = new URLSearchParams(window.location.search)
    const agentId = urlParams.get('ref')
    
    if (agentId) {
        // 2. 쿠키에 에이전트 정보 저장 (30일)
        document.cookie = `ganpoom_ref=${agentId}; max-age=2592000; path=/; domain=localhost`
        console.log('✅ 에이전트 추적 시작:', agentId)
        
        // 3. 서버에 링크 클릭 이벤트 전송 (테스트용 Mock API)
        fetch('/api/mock/track/click', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                ref: agentId, 
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent
            }) 
        }).then(response => {
            if (response.ok) {
                console.log('📊 클릭 추적 완료:', agentId)
            }
        }).catch(error => {
            console.error('클릭 추적 오류:', error)
        })
    } else {
        console.log('ℹ️ 직접 방문 (에이전트 없음)')
    }
    
    // 4. 견적요청 폼 제출 감지
    document.addEventListener('submit', function(e) {
        const form = e.target
        
        // 견적요청 폼인지 확인
        if (form.id === 'quote-form' || 
            form.className.includes('quote') ||
            form.action.includes('quote')) {
            
            console.log('📝 견적요청 폼 제출 감지!')
            
            // 쿠키에서 에이전트 정보 읽기
            const cookies = document.cookie.split(';')
            let savedAgent = null
            
            for (let cookie of cookies) {
                if (cookie.trim().startsWith('ganpoom_ref=')) {
                    savedAgent = cookie.trim().split('=')[1]
                    break
                }
            }
            
            // 폼 데이터 수집
            const formData = new FormData(form)
            const trackingData = {
                agent_id: savedAgent,
                eventType: 'quote_request',
                timestamp: Date.now(),
                url: window.location.href,
                formData: {}
            }
            
            // 폼 필드들 수집
            for (let [key, value] of formData.entries()) {
                trackingData.formData[key] = value
            }
            
            // Ganpoom 특화 필드들 추가
            trackingData.svc_type = formData.get('svc_type') || '간판제작'
            trackingData.req_type = formData.get('req_type') || '신규제작'
            trackingData.customer_name = formData.get('name') || formData.get('customer_name')
            trackingData.customer_phone = formData.get('phone') || formData.get('customer_phone')
            trackingData.area = formData.get('area')
            trackingData.comments = formData.get('comments') || formData.get('message')
            
            // 예상 견적 계산
            trackingData.estimated_value = estimateValue(trackingData.svc_type, trackingData.req_type)
            trackingData.commission_amount = 10000 // 고정 커미션
            
            console.log('📊 견적요청 추적 데이터:', trackingData)
            
            if (savedAgent) {
                // 5. 서버에 견적요청 이벤트 전송 (테스트용 Mock API)
                fetch('/api/mock/track/conversion', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(trackingData)
                }).then(response => {
                    if (response.ok) {
                        console.log('🎉 견적요청 추적 완료!', trackingData)
                        console.log(`✅ 에이전트: ${savedAgent}, 예상견적: ₩${trackingData.estimated_value?.toLocaleString()}`)
                    }
                }).catch(error => {
                    console.error('견적요청 추적 오류:', error)
                })
            } else {
                console.log('ℹ️ 직접 견적요청 (에이전트 없음)')
            }
        }
    })
    
    // 견적 예상 금액 계산 함수
    function estimateValue(svcType, reqType) {
        const baseValues = {
            '간판제작': 3000000,
            '현수막': 200000,
            '배너': 150000,
            '스티커': 100000,
            '명함': 50000,
            '브로슈어': 300000,
            '카탈로그': 500000,
            '포스터': 80000,
            '전단지': 120000,
            '봉투': 150000,
            '웹디자인': 2000000,
            '로고디자인': 800000,
            '패키지디자인': 1500000,
            '인테리어': 10000000
        }
        
        const multipliers = {
            '신규제작': 1.0,
            '수정': 0.3,
            '재제작': 0.8,
            '추가제작': 0.6
        }
        
        const baseValue = baseValues[svcType] || 1000000
        const multiplier = multipliers[reqType] || 1.0
        
        return Math.round(baseValue * multiplier)
    }
    
    // 페이지 로드 완료 알림
    console.log('🚀 Ganpoom 테스트 추적기 준비 완료!')
    
})()