(function () {
  const config = window.LETTERTOOLKIT_CONFIG || {};

  // Analytics only loads after consent stored by a certified consent platform or your own compliant setup.
  if (config.googleAnalyticsId && localStorage.getItem("lt-analytics-consent") === "granted") {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.googleAnalyticsId)}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ dataLayer.push(arguments); };
    gtag("js", new Date());
    gtag("config", config.googleAnalyticsId, { anonymize_ip: true });
  }

  // AdSense remains disabled until a publisher ID is added after approval.
  if (config.adsensePublisherId) {
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.adsensePublisherId)}`;
    document.head.appendChild(script);
  }
})();
