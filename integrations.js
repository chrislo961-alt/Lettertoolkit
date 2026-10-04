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

  function hasConsent(){
    return localStorage.getItem(consentKey) === 'granted';
  }

  function track(eventName, params){
    if(!hasConsent() || !config.googleAnalyticsId) return;
    loadAnalytics();
    window.gtag?.('event', eventName, {
      page_path: location.pathname,
      ...(params || {})
    });
  }

  function setConsent(value){
    localStorage.setItem(consentKey, value);
    if(value === 'granted') {
      loadAnalytics();
      track('analytics_consent_granted');
    }
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


  function normalizeShell(){
    const nav=document.querySelector('.site-header .header-inner nav');
    if(nav){
      const hasTheme=Boolean(nav.querySelector('#themeToggle'));
      nav.innerHTML='<a href="/tools/">Tools</a><a href="/text-analyzer/">Text Analyzer</a><a href="/word-counter/">Word Counter</a><a href="/text-cleaner/">Clean Text</a><a href="/guides/">Guides</a>'+(hasTheme?'<button class="theme-toggle" id="themeToggle" type="button">Dark</button>':'');
      if(hasTheme){
        const btn=nav.querySelector('#themeToggle');
        const sync=()=>btn.textContent=document.documentElement.dataset.theme==='dark'?'Light mode':'Dark mode';
        sync();
        btn.addEventListener('click',()=>{
          const dark=document.documentElement.dataset.theme!=='dark';
          document.documentElement.dataset.theme=dark?'dark':'light';
          localStorage.setItem('lt-theme',dark?'dark':'light');
          sync();
        });
      }
    }
    const footer=document.querySelector('footer .footer-links');
    if(footer) footer.innerHTML='<a href="/tools/">All Tools</a><a href="/text-analyzer/">Text Analyzer</a><a href="/word-counter/">Word Counter</a><a href="/about/">About</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a>';
    const tagline=document.querySelector('footer .footer-inner > div:first-child p');
    if(tagline) tagline.textContent='Free tools to count, analyze, clean and format text.';
  }

  function bindInteractionTracking(){
    document.addEventListener('input', event => {
      const target = event.target;
      if(!(target instanceof HTMLTextAreaElement)) return;
      if(target.dataset.ltTrackedInput) return;
      if(!target.value.trim()) return;
      target.dataset.ltTrackedInput='1';
      track('tool_input', { tool: location.pathname });
    });

    document.addEventListener('submit', event => {
      const form = event.target;
      if(!(form instanceof HTMLFormElement)) return;
      const id = form.id || form.closest('[data-tool]')?.getAttribute('data-tool') || 'tool_form';
      track('tool_submit', { tool: id });
    });

    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target.closest('a,button') : null;
      if(!target) return;
      if(target.matches('[data-lt-consent-accept],[data-lt-consent-decline]')) return;

      if(target.matches('a.tool-card')) {
        const href = target.getAttribute('href') || '';
        track(target.hasAttribute('data-related-tool') ? 'related_tool_click' : 'tool_card_click', { destination: href });
        return;
      }

      const growthLink = target.getAttribute('data-growth-link');
      if(growthLink) {
        track('growth_link_click', { link_name: growthLink });
        return;
      }

      if(target.tagName === 'BUTTON' && (target.classList.contains('primary-button') || target.id === 'go')) {
        track('tool_action', { action_id: target.id || 'primary_button' });
      }
      if(target.tagName === 'BUTTON' && /copy/i.test(target.id || target.textContent || '')) {
        track('copy_result', { action_id: target.id || 'copy_button' });
      }
    });
  }

  try {
    const key='lt-last-visit';
    const last=Number(localStorage.getItem(key)||0);
    if(last && Date.now()-last > 6*60*60*1000) track('return_user');
    localStorage.setItem(key,String(Date.now()));
  } catch {}

  window.LetterToolkitAnalytics = {
    openPreferences(){ localStorage.removeItem(consentKey); showConsent(); },
    grant(){ setConsent('granted'); },
    deny(){ setConsent('denied'); },
    track
  };

  const consent = localStorage.getItem(consentKey);
  if(consent === 'granted') loadAnalytics();
  else if(consent !== 'denied') {
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showConsent, {once:true});
    else showConsent();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>{ normalizeShell(); bindInteractionTracking(); }, {once:true});
  else { normalizeShell(); bindInteractionTracking(); }

  if (config.adsensePublisherId) {
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.adsensePublisherId)}`;
    document.head.appendChild(script);
  }
})();