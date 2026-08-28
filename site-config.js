window.LETTERTOOLKIT_CONFIG = {
  googleAnalyticsId: "",
  adsensePublisherId: "",
  searchConsoleVerification: ""
};

(function loadRouteEnhancements(){
  const route=location.pathname.replace(/\/$/,'');
  const assets={
    '/crossword-solver':['/phase41-crossword-wordfinder.css?v=1','/phase41-crossword-wordfinder.js?v=1'],
    '/word-finder':['/phase41-crossword-wordfinder.css?v=1','/phase41-crossword-wordfinder.js?v=1'],
    '/scrabble-helper':['/phase42-scrabble-anagram.css?v=1','/phase42-scrabble-anagram.js?v=1'],
    '/anagram-solver':['/phase42-scrabble-anagram.css?v=1','/phase42-scrabble-anagram.js?v=1'],
    '/random-word-generator':['/phase43-random-rhyme-hub.css?v=1','/phase43-random-rhyme-hub.js?v=1'],
    '/rhyme-finder':['/phase43-random-rhyme-hub.css?v=1','/phase43-random-rhyme-hub.js?v=1'],
    '/word-lists':['/phase43-random-rhyme-hub.css?v=1','/phase43-random-rhyme-hub.js?v=1']
  };
  const pair=assets[route];
  if(!pair)return;
  const css=document.createElement('link');
  css.rel='stylesheet';
  css.href=pair[0];
  document.head.appendChild(css);
  const script=document.createElement('script');
  script.src=pair[1];
  script.defer=true;
  document.head.appendChild(script);
})();