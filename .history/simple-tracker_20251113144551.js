// 초간단 Ganpoom 추적 코드 - ganpoom.com에 추가할 파일

(function() {
    // 1. URL에서 에이전트 정보 확인 (짧은 ref 파라미터 사용)
    const urlParams = new URLSearchParams(window.location.search);
    const agentId = urlParams.get('ref');
    
    if (agentId) {
        // 2. 쿠키에 에이전트 정보 저장 (30일)
        document.cookie = `ganpoom_ref=${agentId}; max-age=2592000; path=/; domain=.ganpoom.com`;
        console.log('에이전트 추적 시작:', agentId);
        
        // 3. 서버에 링크 클릭 이벤트 전송 (실제 구현시)
        // fetch('/api/track-click', { 
        //     method: 'POST', 
        //     body: JSON.stringify({ ref: agentId, timestamp: Date.now() }) 
        // });
    }
    
    // 3. 견적요청 폼 제출 감지
    document.addEventListener('submit', function(e) {
        const form = e.target;
        
        // 견적요청 폼인지 확인 (폼의 action이나 id로 판단)
        if (form.action.includes('quote') || 
            form.id.includes('quote') || 
            form.className.includes('quote')) {
            
            // 쿠키에서 에이전트 정보 읽기
            const cookies = document.cookie.split(';');
            let savedAgent = null;
            
            for (let cookie of cookies) {
                if (cookie.trim().startsWith('ganpoom_agent=')) {
                    savedAgent = cookie.trim().split('=')[1];
                    break;
                }
            }
            
            if (savedAgent) {
                // 4. 간단한 추적 데이터 전송 (콘솔에 출력)
                const trackingData = {
                    agent: savedAgent,
                    event: 'quote_request',
                    time: new Date().toISOString(),
                    page: window.location.href
                };
                
                console.log('🎯 견적요청 추적됨!', trackingData);
                
                // 실제로는 여기서 서버로 데이터 전송
                // fetch('/api/track', { method: 'POST', body: JSON.stringify(trackingData) });
                
                // 임시로 로컬스토리지에 저장
                const saved = JSON.parse(localStorage.getItem('ganpoom_tracking') || '[]');
                saved.push(trackingData);
                localStorage.setItem('ganpoom_tracking', JSON.stringify(saved));
                
                alert('추적 완료! 에이전트: ' + savedAgent);
            }
        }
    });
})();
