window.LETTERTOOLKIT_CONFIG = {
  googleAnalyticsId: "",
  adsensePublisherId: "",
  searchConsoleVerification: ""
};

(function loadRouteEnhancements(){
  const route=location.pathname.replace(/\/$/,'');
  if(route!=='/crossword-solver'&&route!=='/word-finder')return;
  const css=document.createElement('link');
  css.rel='stylesheet';
  css.href='/phase41-crossword-wordfinder.css?v=1';
  document.head.appendChild(css);
  const script=document.createElement('script');
  script.src='/phase41-crossword-wordfinder.js?v=1';
  script.defer=true;
  document.head.appendChild(script);
})();
