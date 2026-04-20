/**
 * Ganpoom Tracker v2
 * 에어브릿지 대체 - 채널 어트리뷰션 + 전환 추적
 *
 * 사용법:
 * <script src="https://[tracker-domain]/ganpoom-tracker.js" async></script>
 */

(function () {
  'use strict';

  try {

    const CONFIG = {
      apiEndpoint: (function () {
        const tag = document.currentScript || document.querySelector('script[data-api]');
        if (tag && tag.getAttribute('data-api')) return tag.getAttribute('data-api');
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
          const src = scripts[i].src;
          if (src && src.includes('ganpoom-tracker')) {
            try { return new URL(src).origin + '/api'; } catch (_) {}
          }
        }
        return 'https://ganpoom-tracker-htkz.vercel.app/api';
      })(),
      attrKey: 'gp_attr',
      sessionKey: 'gp_session',
      attrExpiry: 30,
      sessionExpiry: 1,
      debug: false,
    };

    function log(...args) { if (CONFIG.debug) console.log('[GP]', ...args); }

    const Cookie = {
      set(name, value, days) {
        const exp = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${exp};path=/;domain=.ganpoom.com;SameSite=Lax`;
      },
      get(name) {
        const eq = name + '=';
        for (let c of document.cookie.split(';')) {
          c = c.trim();
          if (c.startsWith(eq)) return decodeURIComponent(c.slice(eq.length));
        }
        return null;
      },
    };

    function getParams() {
      const p = new URLSearchParams(window.location.search);
      return {
        utm_source: p.get('utm_source'),
        utm_medium: p.get('utm_medium'),
        utm_campaign: p.get('utm_campaign'),
        utm_content: p.get('utm_content'),
        utm_term: p.get('utm_term'),
        k_campaign: p.get('k_campaign'),
        k_adgroup: p.get('k_adgroup'),
        k_creative: p.get('k_creative'),
        k_keyword: p.get('k_keyword'),
        k_keyword_id: p.get('k_keyword_id'),
        gclid: p.get('gclid'),
        ref: p.get('ref'),
      };
    }

    function resolveChannel(params) {
      if (params.gclid) return 'google';
      if (params.utm_source) return params.utm_source;
      if (params.k_campaign || params.k_adgroup) return 'naver.searchad';
      if (params.ref) return 'agency';
      return 'unattributed';
    }

    function getDeviceInfo() {
      const ua = navigator.userAgent;
      const ios = /iPhone|iPad|iPod/i.test(ua);
      const android = /Android/i.test(ua);
      const mobile = ios || android || /Mobi/i.test(ua);

      // WebView 감지 (ganpoom 앱 = WebView로 감싼 구조)
      const isWebView =
        /wv\b/.test(ua) ||                          // Android WebView
        /FBAN|FBAV/.test(ua) ||                     // 페이스북 인앱
        (ios && !/Safari/.test(ua) && /AppleWebKit/.test(ua)) || // iOS WebView (Safari 없음)
        (android && /Version\/\d/.test(ua) && !/Chrome/.test(ua)); // Android 구형 WebView

      return {
        device_type: mobile ? 'mobile' : 'desktop',
        os_name: ios ? 'iOS' : android ? 'Android' : /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'macOS' : 'unknown',
        platform: isWebView ? 'app' : 'web',  // WebView면 app으로 자동 설정
      };
    }

    function parseDomain(url) {
      if (!url) return null;
      try { return new URL(url).hostname.replace('www.', ''); } catch (_) { return null; }
    }

    function getSessionId() {
      let id = Cookie.get(CONFIG.sessionKey);
      if (!id) {
        id = 'gp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
        Cookie.set(CONFIG.sessionKey, id, CONFIG.sessionExpiry);
      }
      return id;
    }

    // 이벤트 큐 (SDK 로드 전 발생한 이벤트 보관)
    const queue = [];
    let ready = false;

    function flush() {
      while (queue.length) {
        const { eventCategory, extra } = queue.shift();
        sendNow(eventCategory, extra);
      }
    }

    function sendNow(eventCategory, extra) {
      try {
        const attrRaw = Cookie.get(CONFIG.attrKey);
        const attr = attrRaw ? JSON.parse(attrRaw) : {};
        const device = getDeviceInfo();
        const payload = {
          event_category: eventCategory,
          platform: device.platform || 'web',
          ...device,
          channel: attr.channel || 'unattributed',
          campaign: attr.utm_campaign || attr.k_campaign || null,
          ad_group: attr.k_adgroup || null,
          ad_creative: attr.k_creative || null,
          utm_source: attr.utm_source || null,
          utm_medium: attr.utm_medium || null,
          utm_campaign: attr.utm_campaign || null,
          utm_content: attr.utm_content || null,
          utm_term: attr.utm_term || null,
          k_campaign: attr.k_campaign || null,
          k_adgroup: attr.k_adgroup || null,
          k_creative: attr.k_creative || null,
          k_keyword: attr.k_keyword || null,
          k_keyword_id: attr.k_keyword_id || null,
          gclid: attr.gclid || null,
          agent_id: attr.ref || null,
          referrer: attr.referrer || document.referrer || null,
          referrer_domain: parseDomain(attr.referrer || document.referrer),
          landing_page: attr.landing_page || window.location.href,
          session_id: getSessionId(),
          ...extra,
        };
        log('send', eventCategory, payload);
        fetch(CONFIG.apiEndpoint + '/events/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(e => log('fetch error', e));
      } catch (e) { log('send error', e); }
    }

    function send(eventCategory, extra) {
      if (ready) {
        sendNow(eventCategory, extra);
      } else {
        queue.push({ eventCategory, extra });
      }
    }

    function initAttribution() {
      const params = getParams();
      const hasAttr = params.utm_source || params.gclid || params.k_campaign || params.ref;
      if (hasAttr) {
        const attr = {
          ...params,
          channel: resolveChannel(params),
          referrer: document.referrer || null,
          landing_page: window.location.href,
          landed_at: new Date().toISOString(),
        };
        Cookie.set(CONFIG.attrKey, JSON.stringify(attr), CONFIG.attrExpiry);
        log('attribution saved', attr);
      }
    }

    function init() {
      initAttribution();
      ready = true;
      flush();
      log('initialized');
    }

    // 전역 노출
    window.GanpoomTracker = {
      track(eventCategory, extra) { send(eventCategory, extra || {}); },
      trackQuoteRequest(extra) { send('comparison.request', extra || {}); },
      trackOrderComplete(extra) { send('order.complete', extra || {}); },
      getAttribution() {
        try {
          const raw = Cookie.get(CONFIG.attrKey);
          return raw ? JSON.parse(raw) : null;
        } catch (_) { return null; }
      },
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      setTimeout(init, 0);
    }

  } catch (e) {
    console.error('[GanpoomTracker] init error:', e);
  }
})();
