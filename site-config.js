window.LETTERTOOLKIT_CONFIG = {
  googleAnalyticsId: "G-8FWVYBHL0K",
  adsensePublisherId: "",
  searchConsoleVerification: ""
};

(function loadRouteEnhancements(){
  const route=location.pathname.replace(/\/$/,'');
  const assets={
    '/crossword-solver':['/phase41-crossword-wordfinder.css?v=1','/phase41-crossword-wordfinder.js?v=2'],
    '/word-finder':['/phase41-crossword-wordfinder.css?v=1','/phase41-crossword-wordfinder.js?v=2'],
    '/scrabble-helper':['/phase42-scrabble-anagram.css?v=1','/phase42-scrabble-anagram.js?v=2'],
    '/anagram-solver':['/phase42-scrabble-anagram.css?v=1','/phase42-scrabble-anagram.js?v=2'],
    '/random-word-generator':['/phase43-random-rhyme-hub.css?v=1','/phase43-random-rhyme-hub.js?v=2'],
    '/rhyme-finder':['/phase43-random-rhyme-hub.css?v=1','/phase43-random-rhyme-hub.js?v=2'],
    '/word-lists':['/phase43-random-rhyme-hub.css?v=1','/phase43-random-rhyme-hub.js?v=2']
  };
  const pair=assets[route];
  if(pair){
    const css=document.createElement('link');css.rel='stylesheet';css.href=pair[0];document.head.appendChild(css);
    const script=document.createElement('script');script.src=pair[1];script.defer=true;document.head.appendChild(script);
  }
  const seoCss=document.createElement('link');seoCss.rel='stylesheet';seoCss.href='/phase44-seo.css?v=1';document.head.appendChild(seoCss);
  const seoScript=document.createElement('script');seoScript.src='/phase44-seo.js?v=3';seoScript.defer=true;document.head.appendChild(seoScript);
})();