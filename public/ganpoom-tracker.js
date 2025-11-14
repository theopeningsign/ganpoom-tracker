/**
 * Ganpoom 에이전트 링크 트래킹 시스템
 * 기존 GA/GTM과 충돌하지 않도록 설계
 * ganpoom.com 전용 커스터마이징 버전
 */

(function() {
    'use strict';
    
    // 설정
    const CONFIG = {
        // API 엔드포인트 자동 감지 (현재 도메인 기반)
        // ganpoom.com에서 사용시: 현재 도메인의 /api 사용
        // 로컬 개발시: http://localhost:3000/api 사용
        apiEndpoint: (function() {
            // 스크립트 태그에서 data-api-endpoint 속성 확인
            const scriptTag = document.currentScript || document.querySelector('script[data-api-endpoint]');
            if (scriptTag && scriptTag.getAttribute('data-api-endpoint')) {
                return scriptTag.getAttribute('data-api-endpoint');
            }
            // 스크립트 src에서 추출
            const scripts = document.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                const src = scripts[i].src;
                if (src && src.includes('ganpoom-tracker.js')) {
                    const url = new URL(src, window.location.href);
                    return url.origin + '/api';
                }
            }
            // 기본값: 현재 도메인 기반
            return (typeof window !== 'undefined' ? window.location.origin : '') + '/api';
        })(),
        cookieName: 'ganpoom_agent_ref',
        cookieExpiry: 30, // 30일
        sessionCookieName: 'ganpoom_session',
        debug: false // 운영 시 false로 변경
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
        
        // 초기화
        init: function() {
            if (this.isInitialized) return;
            
            debugLog('트래커 초기화 시작');
            
            this.sessionId = Utils.getCookie(CONFIG.sessionCookieName) || Utils.generateSessionId();
            Utils.setCookie(CONFIG.sessionCookieName, this.sessionId, 1); // 1일 세션
            
            this.checkAgentLink();
            this.setupEventListeners();
            
            this.isInitialized = true;
            debugLog('트래커 초기화 완료', { sessionId: this.sessionId });
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
        
        // 이벤트 추적
        trackEvent: function(eventType, eventData = {}) {
            if (!this.agentData) {
                debugLog('에이전트 데이터 없음 - 추적 건너뜀');
                return;
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
        },
        
        // 견적요청 추적 (메인 컨버전)
        trackQuoteRequest: function(formData = {}) {
            debugLog('견적요청 추적 시작:', formData);
            
            this.trackEvent('conversion', {
                conversionType: 'quote_request',
                formData: formData,
                estimatedValue: this.estimateValue(formData)
            });
        },
        
        // 예상 계약 금액 추정 (ganpoom.com 실제 데이터 기반)
        estimateValue: function(formData) {
            // ganpoom.com 실제 서비스별 예상 금액
            const serviceValues = {
                '웹드문제작': 8000000,     // 웹드문 제작: 800만원
                '간판제작': 3000000,       // 간판 제작: 300만원
                '인테리어': 15000000,      // 인테리어: 1500만원
                '외관공사': 20000000,      // 외관공사: 2000만원
                '리모델링': 25000000,      // 리모델링: 2500만원
                '신축': 100000000,         // 신축: 1억원
                '수리': 2000000,          // 수리: 200만원
                '유지보수': 1000000       // 유지보수: 100만원
            };
            
            // ganpoom.com 폼 필드에서 서비스 타입 추출
            const serviceType = formData.svc_type || formData.service_type || formData.service || '웹드문제작';
            let baseValue = serviceValues[serviceType] || 5000000;
            
            // 요청 타입에 따른 가격 조정
            const reqType = formData.req_type || formData.request_type || '';
            if (reqType.includes('간단')) {
                baseValue *= 0.7; // 간단한 작업은 30% 할인
            } else if (reqType.includes('고급') || reqType.includes('프리미엄')) {
                baseValue *= 1.5; // 고급 작업은 50% 추가
            }
            
            // 층수에 따른 가격 조정 (간판/인테리어의 경우)
            const floor = parseInt(formData.floor) || 1;
            if (serviceType.includes('간판') || serviceType.includes('인테리어')) {
                baseValue += (floor - 1) * 500000; // 층당 50만원 추가
            }
            
            return Math.round(baseValue);
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
                    
                    const formData = new FormData(form);
                    const formObject = {};
                    formData.forEach((value, key) => {
                        formObject[key] = value;
                    });
                    
                    self.trackQuoteRequest(formObject);
                }
            });
            
            // 2. 전화번호 클릭 감지
            document.addEventListener('click', function(e) {
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
            
            // History API 감지
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            history.pushState = function() {
                originalPushState.apply(history, arguments);
                setTimeout(checkUrlChange, 0);
            };
            
            history.replaceState = function() {
                originalReplaceState.apply(history, arguments);
                setTimeout(checkUrlChange, 0);
            };
            
            window.addEventListener('popstate', checkUrlChange);
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
    
    // 페이지 로드 시 자동 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            GanpoomTracker.init();
        });
    } else {
        GanpoomTracker.init();
    }
    
    debugLog('Ganpoom 트래커 스크립트 로드 완료');
    
})();
