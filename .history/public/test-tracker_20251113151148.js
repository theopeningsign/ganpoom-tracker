/**
 * 테스트용 Ganpoom 추적 스크립트
 * Mock API를 사용하여 로컬에서 테스트 가능
 */

(function() {
    'use strict';
    
    // 설정
    const CONFIG = {
        apiEndpoint: '/api/mock', // Mock API 사용
        cookieName: 'ganpoom_agent_ref',
        cookieExpiry: 30,
        sessionCookieName: 'ganpoom_session',
        debug: true // 테스트 모드에서는 항상 true
    };
    
    // 디버그 로그 함수
    function debugLog(message, data = null) {
        if (CONFIG.debug) {
            console.log('[Ganpoom Test Tracker]', message, data);
        }
    }
    
    // 유틸리티 함수들
    const Utils = {
        getUrlParams: function() {
            const params = new URLSearchParams(window.location.search);
            return {
                ref: params.get('ref')
            };
        },
        
        setCookie: function(name, value, days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            const expires = "expires=" + date.toUTCString();
            document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/;SameSite=Lax";
        },
        
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
        
        generateSessionId: function() {
            return 'test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },
        
        sendEvent: function(endpoint, eventData) {
            debugLog('이벤트 전송:', { endpoint, eventData });
            
            return fetch(CONFIG.apiEndpoint + endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
                keepalive: true
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.json();
            }).then(result => {
                debugLog('전송 성공:', result);
                return result;
            }).catch(error => {
                debugLog('전송 실패:', error);
                throw error;
            });
        },
        
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
    const GanpoomTestTracker = {
        sessionId: null,
        agentData: null,
        isInitialized: false,
        
        init: function() {
            if (this.isInitialized) return;
            
            debugLog('테스트 트래커 초기화 시작');
            
            this.sessionId = Utils.getCookie(CONFIG.sessionCookieName) || Utils.generateSessionId();
            Utils.setCookie(CONFIG.sessionCookieName, this.sessionId, 1);
            
            this.checkAgentLink();
            this.setupEventListeners();
            
            this.isInitialized = true;
            debugLog('테스트 트래커 초기화 완료', { sessionId: this.sessionId });
        },
        
        checkAgentLink: function() {
            const urlParams = Utils.getUrlParams();
            
            if (urlParams.ref) {
                const agentData = {
                    agentId: urlParams.ref,
                    landingTime: new Date().toISOString(),
                    landingUrl: window.location.href,
                    referrer: document.referrer
                };
                
                Utils.setCookie(CONFIG.cookieName, JSON.stringify(agentData), CONFIG.cookieExpiry);
                this.agentData = agentData;
                
                debugLog('새 에이전트 링크 감지:', agentData);
                
                // 링크 클릭 이벤트 전송
                this.trackEvent('click', {
                    agentId: agentData.agentId,
                    sessionId: this.sessionId,
                    referrer: document.referrer,
                    landingPage: window.location.href
                });
                
            } else {
                const savedData = Utils.getCookie(CONFIG.cookieName);
                if (savedData) {
                    try {
                        this.agentData = JSON.parse(savedData);
                        debugLog('기존 에이전트 데이터 로드:', this.agentData);
                    } catch(e) {
                        debugLog('에이전트 데이터 파싱 오류:', e);
                        Utils.setCookie(CONFIG.cookieName, '', -1);
                    }
                }
            }
        },
        
        trackEvent: function(eventType, eventData = {}) {
            if (!this.agentData) {
                debugLog('에이전트 데이터 없음 - 추적 건너뜀');
                return Promise.resolve();
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
            
            let endpoint = '/track/click';
            if (eventType === 'conversion') {
                endpoint = '/track/conversion';
            }
            
            return Utils.sendEvent(endpoint, trackingData);
        },
        
        trackQuoteRequest: function(formData = {}) {
            debugLog('견적요청 추적 시작:', formData);
            
            return this.trackEvent('conversion', {
                conversionType: 'quote_request',
                formData: formData,
                estimatedValue: this.estimateValue(formData)
            });
        },
        
        estimateValue: function(formData) {
            const serviceValues = {
                '웹드문제작': 8000000,
                '간판제작': 3000000,
                '인테리어': 15000000,
                '외관공사': 20000000,
                '리모델링': 25000000
            };
            
            const serviceType = formData.svc_type || '웹드문제작';
            let baseValue = serviceValues[serviceType] || 5000000;
            
            const reqType = formData.req_type || '';
            if (reqType.includes('간단')) {
                baseValue *= 0.7;
            } else if (reqType.includes('고급') || reqType.includes('프리미엄')) {
                baseValue *= 1.5;
            }
            
            const floor = parseInt(formData.floor) || 1;
            if (serviceType.includes('간판') || serviceType.includes('인테리어')) {
                baseValue += (floor - 1) * 500000;
            }
            
            return Math.round(baseValue);
        },
        
        setupEventListeners: function() {
            const self = this;
            
            // 견적요청 폼 제출 감지
            document.addEventListener('submit', function(e) {
                const form = e.target;
                
                // 테스트 페이지의 폼 감지
                if (form.querySelector('[name="svc_type"]') || 
                    form.querySelector('[name="title"]') ||
                    window.location.pathname.includes('test-ganpoom')) {
                    
                    debugLog('견적요청 폼 제출 감지:', form);
                    
                    const formData = new FormData(form);
                    const formObject = {};
                    formData.forEach((value, key) => {
                        formObject[key] = value;
                    });
                    
                    // 비동기로 추적 (폼 제출 방해하지 않음)
                    setTimeout(() => {
                        self.trackQuoteRequest(formObject).then(() => {
                            debugLog('견적요청 추적 완료');
                        }).catch(error => {
                            debugLog('견적요청 추적 실패:', error);
                        });
                    }, 100);
                }
            });
            
            debugLog('이벤트 리스너 설정 완료');
        }
    };
    
    // 전역 객체로 노출
    window.GanpoomTestTracker = {
        trackQuoteRequest: function(formData) {
            return GanpoomTestTracker.trackQuoteRequest(formData);
        },
        trackCustomEvent: function(eventType, eventData) {
            return GanpoomTestTracker.trackEvent(eventType, eventData);
        },
        getAgentInfo: function() {
            return GanpoomTestTracker.agentData;
        },
        getSessionId: function() {
            return GanpoomTestTracker.sessionId;
        }
    };
    
    // 페이지 로드 시 자동 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            GanpoomTestTracker.init();
        });
    } else {
        GanpoomTestTracker.init();
    }
    
    debugLog('Ganpoom 테스트 트래커 스크립트 로드 완료');
    
})();
