/**
 * Ganpoom 링크 트래킹 SDK
 * ganpoom.com에 설치하여 에이전트 링크 성과를 추적
 */

(function() {
    'use strict';
    
    // 설정
    const CONFIG = {
        apiEndpoint: 'https://tracking.ganpoom.com/api', // 나중에 실제 도메인으로 변경
        cookieName: 'ganpoom_agent_ref',
        cookieExpiry: 30 // 30일
    };
    
    // 유틸리티 함수들
    const Utils = {
        // URL 파라미터 추출
        getUrlParams: function() {
            const params = new URLSearchParams(window.location.search);
            return {
                agent_id: params.get('agent_id'),
                campaign: params.get('campaign'),
                source: params.get('source'),
                utm_source: params.get('utm_source'),
                utm_medium: params.get('utm_medium'),
                utm_campaign: params.get('utm_campaign')
            };
        },
        
        // 쿠키 설정
        setCookie: function(name, value, days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            const expires = "expires=" + date.toUTCString();
            document.cookie = name + "=" + value + ";" + expires + ";path=/;domain=.ganpoom.com";
        },
        
        // 쿠키 읽기
        getCookie: function(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for(let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        },
        
        // 고유 세션 ID 생성
        generateSessionId: function() {
            return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },
        
        // 서버로 데이터 전송
        sendEvent: function(eventData) {
            fetch(CONFIG.apiEndpoint + '/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData)
            }).catch(function(error) {
                console.log('Ganpoom Tracking Error:', error);
            });
        }
    };
    
    // 메인 트래킹 객체
    const GanpoomTracker = {
        sessionId: null,
        agentData: null,
        
        // 초기화
        init: function() {
            this.sessionId = Utils.generateSessionId();
            this.checkAgentLink();
            this.trackPageView();
            this.setupEventListeners();
        },
        
        // 에이전트 링크 확인
        checkAgentLink: function() {
            const urlParams = Utils.getUrlParams();
            
            // URL에 agent_id가 있으면 쿠키에 저장
            if (urlParams.agent_id) {
                const agentData = {
                    agent_id: urlParams.agent_id,
                    campaign: urlParams.campaign || 'direct',
                    source: urlParams.source || urlParams.utm_source || 'unknown',
                    medium: urlParams.utm_medium || 'link',
                    utm_campaign: urlParams.utm_campaign || '',
                    landing_time: new Date().toISOString(),
                    landing_url: window.location.href
                };
                
                Utils.setCookie(CONFIG.cookieName, JSON.stringify(agentData), CONFIG.cookieExpiry);
                this.agentData = agentData;
                
                // 링크 클릭 이벤트 전송
                this.trackEvent('link_click', agentData);
            } else {
                // 쿠키에서 기존 에이전트 정보 확인
                const savedData = Utils.getCookie(CONFIG.cookieName);
                if (savedData) {
                    try {
                        this.agentData = JSON.parse(savedData);
                    } catch(e) {
                        console.log('Ganpoom: Invalid agent data in cookie');
                    }
                }
            }
        },
        
        // 페이지뷰 추적
        trackPageView: function() {
            if (this.agentData) {
                this.trackEvent('page_view', {
                    page_url: window.location.href,
                    page_title: document.title,
                    referrer: document.referrer
                });
            }
        },
        
        // 이벤트 추적
        trackEvent: function(eventName, eventData = {}) {
            if (!this.agentData) return;
            
            const trackingData = {
                event_name: eventName,
                session_id: this.sessionId,
                agent_id: this.agentData.agent_id,
                campaign: this.agentData.campaign,
                source: this.agentData.source,
                medium: this.agentData.medium,
                utm_campaign: this.agentData.utm_campaign,
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent,
                ip_address: null, // 서버에서 수집
                ...eventData
            };
            
            Utils.sendEvent(trackingData);
        },
        
        // 견적요청 추적 (메인 컨버전)
        trackQuoteRequest: function(formData = {}) {
            this.trackEvent('quote_request', {
                conversion_type: 'quote_request',
                form_data: formData,
                conversion_value: 1 // 견적요청 = 1포인트
            });
        },
        
        // 전화번호 클릭 추적
        trackPhoneClick: function() {
            this.trackEvent('phone_click', {
                conversion_type: 'phone_contact',
                conversion_value: 0.8 // 전화 = 0.8포인트
            });
        },
        
        // 이벤트 리스너 설정
        setupEventListeners: function() {
            const self = this;
            
            // 견적요청 폼 제출 감지
            document.addEventListener('submit', function(e) {
                const form = e.target;
                if (form.id === 'quote-form' || form.classList.contains('quote-form')) {
                    const formData = new FormData(form);
                    const formObject = {};
                    formData.forEach((value, key) => {
                        formObject[key] = value;
                    });
                    self.trackQuoteRequest(formObject);
                }
            });
            
            // 전화번호 클릭 감지
            document.addEventListener('click', function(e) {
                const target = e.target;
                if (target.tagName === 'A' && target.href && target.href.startsWith('tel:')) {
                    self.trackPhoneClick();
                }
            });
            
            // 페이지 이탈 시 세션 종료
            window.addEventListener('beforeunload', function() {
                if (self.agentData) {
                    self.trackEvent('session_end', {
                        session_duration: Date.now() - new Date(self.agentData.landing_time).getTime()
                    });
                }
            });
        }
    };
    
    // 전역 객체로 노출 (수동 이벤트 추적용)
    window.GanpoomTracker = {
        trackQuoteRequest: function(formData) {
            GanpoomTracker.trackQuoteRequest(formData);
        },
        trackCustomEvent: function(eventName, eventData) {
            GanpoomTracker.trackEvent(eventName, eventData);
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
    
})();
