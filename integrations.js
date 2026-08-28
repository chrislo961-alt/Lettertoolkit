(function () {
  const config = window.LETTERTOOLKIT_CONFIG || {};
  const consentKey = 'lt-analytics-consent';

  function loadAnalytics(){
    if(!config.googleAnalyticsId || window.__ltGaLoaded) return;
    window.__ltGaLoaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.googleAnalyticsId)}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', config.googleAnalyticsId, { anonymize_ip: true });
  }

  function setConsent(value){
    localStorage.setItem(consentKey, value);
    if(value === 'granted') loadAnalytics();
    document.querySelector('[data-lt-consent-banner]')?.remove();
  }

  function showConsent(){
    if(!config.googleAnalyticsId || document.querySelector('[data-lt-consent-banner]')) return;
    const wrap=document.createElement('div');
    wrap.dataset.ltConsentBanner='1';
    wrap.setAttribute('role','dialog');
    wrap.setAttribute('aria-label','Analytics choices');
    wrap.style.cssText='position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:760px;margin:auto;background:#111827;color:#fff;border-radius:16px;padding:16px;box-shadow:0 18px 50px rgba(0,0,0,.28);font:14px/1.5 system-ui,sans-serif';
    wrap.innerHTML='<strong style="display:block;font-size:16px;margin-bottom:6px">Help improve LetterToolkit</strong><span>We use Google Analytics only if you agree, to understand which pages and tools are useful. Your word searches are not sent to our search server.</span><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button type="button" data-lt-consent-accept style="border:0;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer">Accept analytics</button><button type="button" data-lt-consent-decline style="border:1px solid #94a3b8;background:transparent;color:#fff;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer">Decline</button><a href="/privacy/" style="color:#c7d2fe;align-self:center">Privacy policy</a></div>';
    document.body.appendChild(wrap);
    wrap.querySelector('[data-lt-consent-accept]')?.addEventListener('click',()=>setConsent('granted'));
    wrap.querySelector('[data-lt-consent-decline]')?.addEventListener('click',()=>setConsent('denied'));
  }

  window.LetterToolkitAnalytics = {
    openPreferences(){ localStorage.removeItem(consentKey); showConsent(); },
    grant(){ setConsent('granted'); },
    deny(){ setConsent('denied'); }
  };

  const consent = localStorage.getItem(consentKey);
  if(consent === 'granted') loadAnalytics();
  else if(consent !== 'denied') {
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showConsent, {once:true});
    else showConsent();
  }

  if (config.adsensePublisherId) {
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.adsensePublisherId)}`;
    document.head.appendChild(script);
  }
})();