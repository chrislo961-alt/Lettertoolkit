const manifest = JSON.stringify({
  name: 'LetterToolkit',
  short_name: 'LetterToolkit',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#f4f7fb',
  theme_color: '#5b5ce2',
  icons: [
    {
      src: '/assets/favicon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
      purpose: 'any maskable',
    },
  ],
});

const permanentRouteRedirects = new Map([
  ['/crossword-answer-finder', '/crossword-solver/'],
  ['/crossword-answer-finder/', '/crossword-solver/'],
  ['/word-generator', '/random-word-generator/'],
  ['/word-generator/', '/random-word-generator/'],
  ['/words-with-q', '/words-containing-q/'],
  ['/words-with-q/', '/words-containing-q/'],
  ['/words-with-x', '/words-containing-x/'],
  ['/words-with-x/', '/words-containing-x/'],
  ['/words-with-z', '/words-containing-z/'],
  ['/words-with-z/', '/words-containing-z/'],
  ['/5-letter-words-containing-q', '/5-letter-words-with-q/'],
  ['/5-letter-words-containing-q/', '/5-letter-words-with-q/'],
  ['/words-ending-in-ing', '/words-that-end-with-ing/'],
  ['/words-ending-in-ing/', '/words-that-end-with-ing/'],
  ['/words-ending-in-ed', '/words-that-end-with-ed/'],
  ['/words-ending-in-ed/', '/words-that-end-with-ed/'],
  ['/words-ending-in-ly', '/words-that-end-with-ly/'],
  ['/words-ending-in-ly/', '/words-that-end-with-ly/'],
  ['/words-ending-in-er', '/words-that-end-with-er/'],
  ['/words-ending-in-er/', '/words-that-end-with-er/'],
  ['/words-ending-in-tion', '/words-that-end-with-tion/'],
  ['/words-ending-in-tion/', '/words-that-end-with-tion/'],
]);

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const isApexHost = url.hostname === 'lettertoolkit.com';
  const isWwwHost = url.hostname === 'www.lettertoolkit.com';

  if (isWwwHost || (isApexHost && url.protocol !== 'https:')) {
    url.protocol = 'https:';
    url.hostname = 'lettertoolkit.com';
    return Response.redirect(url.toString(), 301);
  }

  const permanentDestination = permanentRouteRedirects.get(url.pathname);
  if (permanentDestination) {
    url.pathname = permanentDestination;
    return Response.redirect(url.toString(), 301);
  }

  if (url.pathname === '/favicon.ico') {
    return Response.redirect(new URL('/assets/favicon.svg', url).toString(), 302);
  }

  if (url.pathname === '/manifest.webmanifest') {
    return new Response(manifest, {
      status: 200,
      headers: {
        'content-type': 'application/manifest+json; charset=utf-8',
        'cache-control': 'public, max-age=86400',
      },
    });
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('X-Frame-Options', 'SAMEORIGIN');

  const contentType = headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  let rewriter = new HTMLRewriter()
    .on('head', {
      element(element) {
        element.append('<link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/assets/favicon.svg">', { html: true });
      },
    })
    .on('script[src*="site-config.js"]', {
      element(element) {
        element.setAttribute('defer', '');
      },
    })
    .on('script[src*="integrations.js"]', {
      element(element) {
        element.setAttribute('defer', '');
      },
    });

  if (url.pathname === '/' || url.pathname === '') {
    rewriter = rewriter.on('head', {
      element(element) {
        element.append(
          '<meta property="og:type" content="website">' +
            '<meta property="og:site_name" content="LetterToolkit">' +
            '<meta property="og:title" content="LetterToolkit – Free Word Tools, Writing Tools & Practical Guides">' +
            '<meta property="og:description" content="Free browser-based tools for unscrambling words, anagrams, word patterns, crosswords and writing, supported by original practical guides.">' +
            '<meta property="og:url" content="https://lettertoolkit.com/">' +
            '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"LetterToolkit","url":"https://lettertoolkit.com/","description":"Free browser-based word, puzzle and writing tools with practical guides."}</script>',
          { html: true },
        );
      },
    });
  }

  if (url.pathname === '/word-unscrambler/' || url.pathname === '/word-unscrambler') {
    rewriter = rewriter
      .on('head', {
        element(element) {
          element.append('<link rel="stylesheet" href="/growth-word-tools.css?v=1"><script src="/growth-word-tools.js?v=1" defer></script>', { html: true });
        },
      })
      .on('title', {
        element(element) {
          element.setInnerContent('Word Unscrambler – Make Words From Letters Free | LetterToolkit');
        },
      })
      .on('meta[name="description"]', {
        element(element) {
          element.setAttribute('content', 'Free word unscrambler to make words from letters. Use wildcards, length, starts-with, ends-with, contains and score filters to find the best matches fast.');
        },
      })
      .on('.pane-intro', {
        element(element) {
          element.after('<div class="quick-start" aria-label="Quick examples"><strong>Try an example</strong><div class="quick-start-actions"><button type="button" data-unscramble-example="LISTEN">LISTEN</button><button type="button" data-unscramble-example="STREAM">STREAM</button><button type="button" data-unscramble-example="TRAIN?">TRAIN?</button><button type="button" data-unscramble-example="SCRABBLE">SCRABBLE</button></div></div>', { html: true });
        },
      })
      .on('#resultMessage', {
        element(element) {
          element.after('<div class="result-pulse" id="resultPulse" aria-live="polite">Try an example above or enter your own rack.</div>', { html: true });
        },
      })
      .on('.workspace', {
        element(element) {
          element.after(
            '<section class="growth-path shell"><div class="growth-path-card"><p class="eyebrow">Keep solving</p><h2>Popular next searches</h2><p>Move from a letter rack to the exact word pattern or list you need without starting over.</p><div class="growth-link-groups">' +
            '<div><h3>By length</h3><div><a href="/5-letter-words/">5-letter words</a><a href="/6-letter-words/">6-letter words</a><a href="/7-letter-words/">7-letter words</a><a href="/8-letter-words/">8-letter words</a></div></div>' +
            '<div><h3>Popular patterns</h3><div><a href="/words-containing-q/">Words with Q</a><a href="/words-containing-x/">Words with X</a><a href="/words-containing-z/">Words with Z</a><a href="/words-that-end-with-ing/">Words ending in ING</a></div></div>' +
            '<div><h3>More precise tools</h3><div><a href="/anagram-solver/">Exact anagrams</a><a href="/word-finder/">Word Finder</a><a href="/scrabble-helper/">Scrabble Helper</a><a href="/wordle-helper/">Wordle Helper</a></div></div>' +
            '</div></div></section>',
            { html: true },
          );
        },
      });
  }

  if (url.pathname === '/frontend/' || url.pathname === '/frontend') {
    rewriter = rewriter.on('head', {
      element(element) {
        element.append('<meta name="robots" content="noindex,follow">', { html: true });
      },
    });
  }

  if (url.pathname === '/cv-builder/' || url.pathname === '/cv-builder') {
    rewriter = rewriter
      .on('head', {
        element(element) {
          element.append(
            '<link rel="canonical" href="https://lettertoolkit.com/cv-builder/">' +
              '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">' +
              '<meta property="og:type" content="website">' +
              '<meta property="og:site_name" content="LetterToolkit">' +
              '<meta property="og:title" content="AI CV Builder | LetterToolkit">' +
              '<meta property="og:description" content="Build a polished CV, tailor it to a job with AI, review every section, choose a professional design and export your application.">' +
              '<meta property="og:url" content="https://lettertoolkit.com/cv-builder/">' +
              '<script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"LetterToolkit AI CV Builder","applicationCategory":"BusinessApplication","operatingSystem":"Web","url":"https://lettertoolkit.com/cv-builder/","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}</script>',
            { html: true },
          );
        },
      })
      .on('h1.cv-name', {
        element(element) {
          element.tagName = 'div';
          element.setAttribute('role', 'heading');
          element.setAttribute('aria-level', '2');
        },
      });
  }

  return rewriter.transform(new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  }));
}
