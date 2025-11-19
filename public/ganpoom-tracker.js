/**
 * Ganpoom 에이전트 링크 트래킹 시스템
 * 기존 GA/GTM과 충돌하지 않도록 설계
 * ganpoom.com 전용 커스터마이징 버전
 */

(function() {
    'use strict';
    
    // 전체 스크립트를 try-catch로 감싸서 오류 발생 시에도 페이지가 멈추지 않도록
    try {
    
    // 설정
    const CONFIG = {
        // API 엔드포인트 자동 감지
        // 스크립트 태그에서 data-api-endpoint 속성 확인 (우선순위 1)
        // 스크립트 src에서 추출 (우선순위 2)
        // 기본값: Vercel 배포 URL (우선순위 3)
        apiEndpoint: (function() {
            // 1. 스크립트 태그에서 data-api-endpoint 속성 확인
            const scriptTag = document.currentScript || document.querySelector('script[data-api-endpoint]');
            if (scriptTag && scriptTag.getAttribute('data-api-endpoint')) {
                return scriptTag.getAttribute('data-api-endpoint');
            }
            // 2. 스크립트 src에서 추출 (스크립트가 로드된 서버의 /api 사용)
            const scripts = document.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                const src = scripts[i].src;
                if (src && src.includes('ganpoom-tracker.js')) {
                    try {
                        const url = new URL(src);
                        return url.origin + '/api';
                    } catch (e) {
                        // URL 파싱 실패시 계속 진행
                    }
                }
            }
            // 3. 기본값: Vercel 배포 URL (ganpoom.com에서 사용시)
            return 'https://ganpoom-tracker-htkz.vercel.app/api';
        })(),
        cookieName: 'ganpoom_agent_ref',
        cookieExpiry: 30, // 30일
        sessionCookieName: 'ganpoom_session',
        debug: false // 운영 시 false (콘솔 로그 최소화로 성능 향상)
    };
    
    // 디버그 로그 함수
    function debugLog(message, data = null) {
        if (CONFIG.debug) {
            console.log('[Ganpoom Tracker]', message, data);
        }
    }
    
    // 유틸리티 함수들
    const Utils = {
        // URL 파라미터 추출
        getUrlParams: function() {
            const params = new URLSearchParams(window.location.search);
            return {
                ref: params.get('ref'), // 우리 에이전트 ID
                // 기존 UTM 파라미터도 수집 (참고용)
                utm_source: params.get('utm_source'),
                utm_medium: params.get('utm_medium'),
                utm_campaign: params.get('utm_campaign'),
                utm_content: params.get('utm_content'),
                utm_term: params.get('utm_term')
            };
        },
        
        // 쿠키 설정
        setCookie: function(name, value, days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            const expires = "expires=" + date.toUTCString();
            document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/;domain=.ganpoom.com;SameSite=Lax";
        },
        
        // 쿠키 읽기
        getCookie: function(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for(let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) {
                    return decodeURIComponent(c.substring(nameEQ.length, c.length));
                }
            }
            return null;
        },
        
        // 세션 ID 생성
        generateSessionId: function() {
            return 'gp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },
        
        // 서버로 데이터 전송 (비동기, 에러 무시)
        sendEvent: function(endpoint, eventData) {
            try {
                fetch(CONFIG.apiEndpoint + endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(eventData),
                    keepalive: true // 페이지 이탈 시에도 전송 보장
                }).catch(function(error) {
                    debugLog('전송 실패:', error);
                });
            } catch (error) {
                debugLog('전송 오류:', error);
            }
        },
        
        // 현재 페이지 정보 수집
        getPageInfo: function() {
            return {
                url: window.location.href,
                title: document.title,
                referrer: document.referrer,
                timestamp: new Date().toISOString()
            };
        }
    };
    
    // 메인 트래킹 객체
    const GanpoomTracker = {
        sessionId: null,
        agentData: null,
        isInitialized: false,
        // 중복 방지를 위한 변수
        lastTrackedEvent: null,
        lastTrackedTime: 0,
        pendingFormSubmit: false, // form submit이 예상되는지
        
        // 초기화
        init: function() {
            try {
                if (this.isInitialized) return;
                
                debugLog('트래커 초기화 시작');
                
                this.sessionId = Utils.getCookie(CONFIG.sessionCookieName) || Utils.generateSessionId();
                Utils.setCookie(CONFIG.sessionCookieName, this.sessionId, 1); // 1일 세션
                
                this.checkAgentLink();
                this.setupEventListeners();
                
                this.isInitialized = true;
                debugLog('트래커 초기화 완료', { sessionId: this.sessionId });
            } catch (error) {
                debugLog('초기화 중 오류 발생 (조용히 실패):', error);
                // 초기화 실패해도 페이지는 정상 작동
            }
        },
        
        // 에이전트 링크 확인
        checkAgentLink: function() {
            const urlParams = Utils.getUrlParams();
            
            // URL에 ref 파라미터가 있으면 새로운 에이전트 링크
            if (urlParams.ref) {
                const agentData = {
                    agentId: urlParams.ref,
                    landingTime: new Date().toISOString(),
                    landingUrl: window.location.href,
                    referrer: document.referrer,
                    utmData: {
                        source: urlParams.utm_source,
                        medium: urlParams.utm_medium,
                        campaign: urlParams.utm_campaign,
                        content: urlParams.utm_content,
                        term: urlParams.utm_term
                    }
                };
                
                Utils.setCookie(CONFIG.cookieName, JSON.stringify(agentData), CONFIG.cookieExpiry);
                this.agentData = agentData;
                
                debugLog('새 에이전트 링크 감지:', agentData);
                
                // 링크 클릭 이벤트 전송
                this.trackEvent('click', {
                    agentId: agentData.agentId,
                    sessionId: this.sessionId,
                    referrer: document.referrer,
                    landingPage: window.location.href,
                    utmData: agentData.utmData
                });
                
            } else {
                // 쿠키에서 기존 에이전트 정보 확인
                const savedData = Utils.getCookie(CONFIG.cookieName);
                if (savedData) {
                    try {
                        this.agentData = JSON.parse(savedData);
                        debugLog('기존 에이전트 데이터 로드:', this.agentData);
                    } catch(e) {
                        debugLog('에이전트 데이터 파싱 오류:', e);
                        Utils.setCookie(CONFIG.cookieName, '', -1); // 쿠키 삭제
                    }
                }
            }
        },
        
        // 이벤트 추적 (중복 방지 포함)
        trackEvent: function(eventType, eventData = {}) {
            if (!this.agentData) {
                debugLog('에이전트 데이터 없음 - 추적 건너뜀');
                return false;
            }
            
            // 중복 방지: 같은 이벤트를 2초 내에 다시 추적하지 않음
            const now = Date.now();
            if (this.lastTrackedEvent === 'conversion' && 
                eventType === 'conversion' &&
                now - this.lastTrackedTime < 2000) {
                debugLog('중복 이벤트 방지 - 최근에 같은 이벤트 추적됨');
                return false;
            }
            
            // 추적 기록 업데이트
            if (eventType === 'conversion') {
                this.lastTrackedEvent = 'conversion';
                this.lastTrackedTime = now;
            }
            
            const trackingData = {
                eventType: eventType,
                sessionId: this.sessionId,
                agentId: this.agentData.agentId,
                timestamp: new Date().toISOString(),
                pageInfo: Utils.getPageInfo(),
                ...eventData
            };
            
            debugLog('이벤트 추적:', trackingData);
            
            // API 엔드포인트 결정
            let endpoint = '/track/click';
            if (eventType === 'conversion') {
                endpoint = '/track/conversion';
            }
            
            Utils.sendEvent(endpoint, trackingData);
            return true;
        },
        
        // 견적요청 추적 (메인 컨버전)
        trackQuoteRequest: function(formData = {}) {
            debugLog('견적요청 추적 시작:', formData);
            
            // 단순히 견적요청만 추적 (예상 금액 계산 제거)
            this.trackEvent('conversion', {
                conversionType: 'quote_request',
                formData: formData
                // estimatedValue 제거 - 단순히 견적요청 건수만 추적
            });
        },
        
        // 이벤트 리스너 설정
        setupEventListeners: function() {
            const self = this;
            
            // 1. 견적요청 폼 제출 감지 (ganpoom.com 특화)
            document.addEventListener('submit', function(e) {
                const form = e.target;
                
                // ganpoom.com의 견적요청 폼 감지 (여러 패턴 지원)
                const isQuoteForm = 
                    form.action.includes('rfp') ||
                    form.action.includes('estimate') ||
                    form.action.includes('quote') ||
                    form.id.includes('quote') ||
                    form.id.includes('rfp') ||
                    form.id.includes('estimate') ||
                    form.className.includes('quote') ||
                    form.className.includes('rfp') ||
                    form.querySelector('[name*="quote"]') ||
                    form.querySelector('[name*="estimate"]') ||
                    form.querySelector('[name*="rfp"]');
                
                if (isQuoteForm) {
                    debugLog('견적요청 폼 제출 감지:', form);
                    
                    // form submit이 발생하면 pendingFormSubmit 플래그 설정
                    self.pendingFormSubmit = true;
                    
                    const formData = new FormData(form);
                    const formObject = {};
                    formData.forEach((value, key) => {
                        formObject[key] = value;
                    });
                    
                    // form submit으로 추적 (우선순위 높음)
                    if (self.trackQuoteRequest(formObject)) {
                        // 추적 성공하면 잠시 후 플래그 해제
                        setTimeout(function() {
                            self.pendingFormSubmit = false;
                        }, 500);
                    }
                }
            });
            
            // 1-1. "신청완료" 버튼 클릭 감지 (포트폴리오 상담신청)
            document.addEventListener('click', function(e) {
                const button = e.target.closest('button');
                
                // "신청완료" 버튼 감지
                if (button && button.textContent && button.textContent.trim() === '신청완료') {
                    // form submit이 곧 발생할 것으로 예상되면 무시 (중복 방지)
                    if (self.pendingFormSubmit) {
                        debugLog('신청완료 버튼 클릭 무시 - form submit 예상');
                        return;
                    }
                    
                    // 버튼이 form 안에 있는지 확인
                    const form = button.closest('form');
                    if (form) {
                        // form 안에 있으면 form submit이 처리할 것임
                        debugLog('신청완료 버튼이 form 안에 있음 - form submit 대기');
                        self.pendingFormSubmit = true;
                        return;
                    }
                    
                    debugLog('포트폴리오 상담신청 버튼 클릭 감지:', button);
                    
                    // 폼 데이터 수집 (근처의 입력 필드들)
                    const formObject = {};
                    
                    // req_detail로 시작하는 필드들 수집
                    const detailInputs = document.querySelectorAll('input[id*="req_detail"], input[name*="req_detail"]');
                    detailInputs.forEach(function(input) {
                        const key = input.id || input.name || 'unknown';
                        formObject[key] = input.value || '';
                    });
                    
                    // dl/dt/dd 구조에서도 데이터 수집 시도
                    const dlElements = button.closest('dl') || document.querySelectorAll('dl');
                    if (dlElements.length > 0) {
                        const firstDl = dlElements[0] instanceof NodeList ? dlElements[0][0] : dlElements[0];
                        if (firstDl) {
                            const inputs = firstDl.querySelectorAll('input');
                            inputs.forEach(function(input) {
                                const key = input.id || input.name || input.placeholder || 'field';
                                if (!formObject[key]) {
                                    formObject[key] = input.value || '';
                                }
                            });
                        }
                    }
                    
                    // 포트폴리오 상담신청으로 추적 (버튼 클릭으로 처리)
                    if (self.trackQuoteRequest(formObject)) {
                        debugLog('포트폴리오 상담신청 추적 완료');
                    }
                }
            }, true); // capture phase에서 실행하여 다른 이벤트보다 먼저 처리
            
            // 2. 전화번호 클릭 감지
            document.addEventListener('click', function(e) {
                // "신청완료" 버튼이면 무시 (이미 처리됨)
                const button = e.target.closest('button');
                if (button && button.textContent && button.textContent.trim() === '신청완료') {
                    return;
                }
                
                const target = e.target.closest('a[href^="tel:"]');
                if (target && self.agentData) {
                    debugLog('전화번호 클릭 감지:', target.href);
                    self.trackEvent('phone_click', {
                        phoneNumber: target.href.replace('tel:', ''),
                        conversionType: 'phone_contact'
                    });
                }
            });
            
            // 3. 카카오톡 상담 클릭 감지
            document.addEventListener('click', function(e) {
                // "신청완료" 버튼이면 무시 (이미 처리됨)
                const button = e.target.closest('button');
                if (button && button.textContent && button.textContent.trim() === '신청완료') {
                    return;
                }
                
                const target = e.target.closest('a[href*="kakao"], a[href*="pf.kakao"], .kakao-chat, .kakao-consult');
                if (target && self.agentData) {
                    debugLog('카카오톡 상담 클릭 감지:', target);
                    self.trackEvent('kakao_click', {
                        conversionType: 'kakao_contact'
                    });
                }
            });
            
            // 4. 페이지 이탈 시 세션 종료
            window.addEventListener('beforeunload', function() {
                if (self.agentData) {
                    const sessionDuration = Date.now() - new Date(self.agentData.landingTime).getTime();
                    self.trackEvent('session_end', {
                        sessionDuration: Math.round(sessionDuration / 1000) // 초 단위
                    });
                }
            });
            
            // 5. 페이지뷰 추적 (SPA 대응)
            let currentUrl = window.location.href;
            const checkUrlChange = function() {
                if (window.location.href !== currentUrl) {
                    currentUrl = window.location.href;
                    if (self.agentData) {
                        self.trackEvent('page_view', {
                            previousUrl: currentUrl
                        });
                    }
                }
            };
            
            // History API 감지 (다른 스크립트와 충돌 방지)
            try {
                const originalPushState = history.pushState;
                const originalReplaceState = history.replaceState;
                
                // 이미 오버라이드된 경우 감지
                if (originalPushState.toString().indexOf('Ganpoom') === -1) {
                    history.pushState = function() {
                        originalPushState.apply(history, arguments);
                        setTimeout(checkUrlChange, 0);
                    };
                    
                    history.replaceState = function() {
                        originalReplaceState.apply(history, arguments);
                        setTimeout(checkUrlChange, 0);
                    };
                }
                
                window.addEventListener('popstate', checkUrlChange);
            } catch (e) {
                debugLog('History API 감지 설정 실패 (무시됨):', e);
            }
        }
    };
    
    // 전역 객체로 노출 (수동 이벤트 추적용)
    window.GanpoomTracker = {
        trackQuoteRequest: function(formData) {
            GanpoomTracker.trackQuoteRequest(formData);
        },
        trackCustomEvent: function(eventType, eventData) {
            GanpoomTracker.trackEvent(eventType, eventData);
        },
        getAgentInfo: function() {
            return GanpoomTracker.agentData;
        }
    };
    
    // 페이지 로드 시 자동 초기화 (안전하게)
    try {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                GanpoomTracker.init();
            });
        } else {
            // 약간의 지연을 두어 다른 스크립트와 충돌 방지
            setTimeout(function() {
                GanpoomTracker.init();
            }, 0);
        }
    } catch (error) {
        console.error('[Ganpoom Tracker] 초기화 스케줄링 오류:', error);
    }
    
    debugLog('Ganpoom 트래커 스크립트 로드 완료');
    
    } catch (error) {
        // 스크립트 오류 발생 시 조용히 실패 (페이지에 영향 없음)
        console.error('[Ganpoom Tracker] 초기화 오류:', error);
    }
})();
