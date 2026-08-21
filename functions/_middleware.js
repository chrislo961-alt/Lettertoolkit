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

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.protocol !== 'https:' || url.hostname === 'www.lettertoolkit.com') {
    url.protocol = 'https:';
    url.hostname = 'lettertoolkit.com';
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
