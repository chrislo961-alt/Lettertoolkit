export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.protocol !== 'https:' || url.hostname === 'www.lettertoolkit.com') {
    url.protocol = 'https:';
    url.hostname = 'lettertoolkit.com';
    return Response.redirect(url.toString(), 301);
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

  const rewritten = new HTMLRewriter()
    .on('script[src*="site-config.js"]', {
      element(element) {
        element.setAttribute('defer', '');
      },
    })
    .on('script[src*="integrations.js"]', {
      element(element) {
        element.setAttribute('defer', '');
      },
    })
    .transform(new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    }));

  return rewritten;
}
