import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  ENDPOINT, StaleDeployment, eventSelection, htmlSignals, main, request,
  resolveCommit, retryDelay, selectUrls, submitBatch, verifyKey, verifyUrl, waitForDeployment
} from './indexnow.mjs';

const config = JSON.parse(readFileSync(new URL('../indexnow.config.json', import.meta.url), 'utf8'));
const origin = config.origin, url = route => `${origin}${route}`;
const head = 'a'.repeat(40), newer = 'b'.repeat(40);
const quiet = () => {};
const html = (route, extra = '') => `<html><head><link href="${url(route)}" rel="canonical"><meta content="index,follow" name="robots">${extra}</head><body>Useful content.</body></html>`;
const sitemap = routes => `<urlset>${routes.map(route => `<url><loc>${url(route)}</loc></url>`).join('')}</urlset>`;
function files(routes, extra = {}) {
  return {
    'sitemap.xml': `<sitemapindex><sitemap><loc>${origin}/sitemap-tools.xml</loc></sitemap></sitemapindex>`,
    'sitemap-tools.xml': sitemap(routes),
    ...Object.fromEntries(routes.map(route => [`${route.slice(1)}index.html`, html(route)])), ...extra
  };
}
function tree(source) { return { files: new Set(Object.keys(source)), read: file => source[file] ?? null }; }
function select(before, after, changed, localConfig = config) {
  return selectUrls({ config: localConfig, before: before && tree(before), after: tree(after), changed: new Set(changed) });
}
const htmlResponse = (route, extra = '', headers = {}) => new Response(html(route, extra), { headers: { 'content-type': 'text/html; charset=utf-8', ...headers } });
const network = fetchImpl => ({ fetchImpl, sleep: async () => {} });

test('README, CI, key setup and sitemap lastmod changes never backfill existing URLs', () => {
  const before = files(['/a/', '/b/']), after = { ...before, 'README.md': 'Updated', 'indexnow.config.json': '{}', 'sitemap-tools.xml': sitemap(['/a/', '/b/']).replace('</url>', '<lastmod>2026-10-19</lastmod></url>') };
  assert.deepEqual(select(before, after, ['README.md', '.github/workflows/indexnow.yml', 'indexnow.config.json', `${config.key}.txt`, 'sitemap-tools.xml']).entries, []);
});
test('only genuinely changed curated pages are eligible; legacy sitemap inventories stay excluded', () => {
  const before = files(['/a/', '/b/'], { 'sitemap-words.xml': sitemap(['/legacy/']), 'legacy/index.html': html('/legacy/') });
  const after = { ...before, 'a/index.html': html('/a/', '<title>New content</title>'), 'legacy/index.html': html('/legacy/', '<title>New</title>') };
  assert.deepEqual(select(before, after, ['a/index.html', 'legacy/index.html']).entries.map(entry => entry.url), [url('/a/')]);
});
test('root commit does not bootstrap an entire sitemap', () => {
  const result = select(null, files(['/a/', '/b/']), ['a/index.html', 'b/index.html', 'sitemap.xml']);
  assert.equal(result.entries.length, 0);
  assert.match(result.note, /No parent baseline/);
});
test('first sitemap does not submit unchanged existing page inventory', () => {
  const before = { 'a/index.html': html('/a/'), 'b/index.html': html('/b/') };
  const after = files(['/a/', '/b/']);
  assert.equal(select(before, after, ['sitemap.xml', 'sitemap-tools.xml']).entries.length, 0);
  assert.deepEqual(select(before, after, ['sitemap.xml', 'sitemap-tools.xml', 'a/index.html']).entries.map(entry => entry.url), [url('/a/')]);
});
test('curation additions, removal and rename select new and old URLs once', () => {
  const before = files(['/a/', '/old/']), after = files(['/a/', '/new/']);
  const selected = select(before, after, ['sitemap-tools.xml', 'old/index.html', 'new/index.html']).entries;
  assert.deepEqual(selected.map(({ url, kind }) => ({ url, kind })), [
    { url: url('/new/'), kind: 'active' }, { url: url('/old/'), kind: 'removed' }
  ]);
  assert.throws(() => select(before, { ...after, 'sitemap-tools.xml': sitemap(['/a/', '/missing/']) }, ['sitemap-tools.xml']), /no tracked HTML page/);
});
test('referenced downloads, CSS and imported JS changes select only dependent pages', () => {
  const before = files(['/a/', '/b/'], {
    'a/index.html': html('/a/', '<script src="/app.js?v=1"></script><link rel="stylesheet" href="/a.css"><a href="/sample.txt">Download</a>'),
    'app.js': 'import { x } from "./core/x.js";', 'core/x.js': 'export const x=1;',
    'a.css': '@import "/nested.css";', 'nested.css': 'body{}', 'sample.txt': 'Example'
  });
  for (const asset of ['core/x.js', 'nested.css', 'sample.txt']) {
    assert.deepEqual(select(before, before, [asset]).entries.map(entry => entry.url), [url('/a/')]);
  }
  const after = { ...before }; delete after['sample.txt'];
  assert.deepEqual(select(before, after, ['sample.txt']).entries.map(entry => entry.url), [url('/a/')]);
});
test('static fetch references resolve against each page, not the module file', () => {
  const before = files(['/a/', '/b/'], {
    'a/index.html': html('/a/', '<script src="/shared/tool.js"></script>'),
    'shared/tool.js': 'fetch("./data.txt")', 'a/data.txt': 'A', 'shared/data.txt': 'Unrelated'
  });
  assert.equal(select(before, before, ['shared/data.txt']).entries.length, 0);
  assert.deepEqual(select(before, before, ['a/data.txt']).entries.map(entry => entry.url), [url('/a/')]);
});
test('runtime dependencies stay route scoped; middleware is an explicit shared response dependency', () => {
  const before = files(['/a/', '/b/'], { 'injected.css': 'body{}' });
  const localConfig = { ...config, routeAssets: { '/a/': ['injected.css'] } };
  assert.deepEqual(select(before, before, ['injected.css'], localConfig).entries.map(entry => entry.url), [url('/a/')]);
  assert.equal(select(before, before, ['functions/_middleware.js'], localConfig).entries.length, 2);
});
test('off-host, parameterized and path-traversal sitemap URLs fail closed', () => {
  const base = files(['/a/']);
  for (const invalid of ['https://example.com/a/', `${origin}/a/?private=1`, `${origin}/a/../b/`, `${origin}/a/#fragment`]) {
    assert.throws(() => select(base, { ...base, 'sitemap-tools.xml': `<urlset><url><loc>${invalid}</loc></url></urlset>` }, ['sitemap-tools.xml']), /Invalid curated URL/);
  }
});
test('Git arguments reject options, abbreviations and shell syntax before executing Git', () => {
  for (const value of ['--help', 'HEAD~1', 'abc123', '$(touch /tmp/no)', '`id`', 'main']) {
    assert.throws(() => resolveCommit('/nonexistent', value), /Commit must be HEAD/);
  }
});

test('HTML validation handles attribute order and ignores fake tags inside comments/scripts', () => {
  const page = html('/a/', '<!-- <meta name="robots" content="noindex"> --><script>const x=\'<link rel="canonical" href="https://evil.test/">\';</script>');
  assert.deepEqual(htmlSignals(page, url('/a/')), { canonical: url('/a/'), noindex: false });
  assert.equal(htmlSignals(html('/a/', '<link rel="canonical" href="/b/">'), url('/a/')).canonical, null);
});
test('live key requires exact plaintext; HTML fallbacks, extra bytes and redirects fail', async () => {
  assert.equal(await verifyKey(config, network(async () => new Response(config.key, { headers: { 'content-type': 'text/plain; charset=utf-8' } }))), `${origin}/${config.key}.txt`);
  for (const response of [
    new Response(`${config.key}\n`, { headers: { 'content-type': 'text/plain' } }),
    new Response(config.key, { headers: { 'content-type': 'text/html' } }),
    new Response(null, { status: 301, headers: { location: `${origin}/` } })
  ]) await assert.rejects(verifyKey(config, network(async () => response)), /Live IndexNow key/);
});
test('active routes reject redirects, errors, canonical mismatch and every relevant noindex signal', async () => {
  const entry = { url: url('/a/'), kind: 'active' }, current = new Set([entry.url]);
  assert.match(await verifyUrl(entry, current, config, network(async () => htmlResponse('/a/'))), /self canonical/);
  for (const response of [
    new Response(null, { status: 302, headers: { location: '/b/' } }),
    new Response('Gone', { status: 404 }), htmlResponse('/b/'),
    htmlResponse('/a/', '', { 'x-robots-tag': 'noindex, follow' }),
    htmlResponse('/a/', '<meta name="bingbot" content="noindex">'),
    htmlResponse('/a/', '<meta name="robots" content="none">')
  ]) await assert.rejects(verifyUrl(entry, current, config, network(async () => response)));
});
test('withdrawn URLs can notify 404/410, explicit noindex or permanent verified canonical moves', async () => {
  const entry = { url: url('/old/'), kind: 'removed' }, current = new Set([url('/new/')]);
  for (const status of [404, 410]) assert.match(await verifyUrl(entry, current, config, network(async () => new Response('Gone', { status }))), /withdrawn/);
  assert.match(await verifyUrl(entry, current, config, network(async () => htmlResponse('/old/', '<meta content="noindex" name="robots">'))), /withdrawn/);
  const redirect = network(async target => target === entry.url ? new Response(null, { status: 301, headers: { location: '/new/' } }) : htmlResponse('/new/'));
  assert.match(await verifyUrl(entry, current, config, redirect), /moved: HTTP 301/);
  const canonical = network(async () => htmlResponse('/new/'));
  assert.match(await verifyUrl(entry, current, config, canonical), /canonical moved/);
  await assert.rejects(verifyUrl(entry, current, config, network(async () => htmlResponse('/old/'))), /Sitemap removal alone/);
  await assert.rejects(verifyUrl(entry, current, config, network(async () => new Response(null, { status: 301, headers: { location: 'https://other.test/' } }))), /outside the current curated/);
});

function successfulCheck(overrides = {}) {
  return { id: 1, head_sha: head, name: config.deploymentCheck.name, app: { slug: config.deploymentCheck.appSlug }, status: 'completed', conclusion: 'success', ...overrides };
}
test('Cloudflare gate accepts only the exact SHA, app identity and successful latest run', async () => {
  const makeApi = checks => async path => path === 'git/ref/heads/main' ? { object: { sha: head } } : { check_runs: checks };
  const options = { sha: head, check: config.deploymentCheck, timeoutMs: 1, log: quiet };
  assert.equal((await waitForDeployment({ ...options, api: makeApi([successfulCheck()]) })).id, 1);
  for (const check of [successfulCheck({ head_sha: newer }), successfulCheck({ app: { slug: 'other-app' } }), successfulCheck({ name: 'Other Check' })]) {
    await assert.rejects(waitForDeployment({ ...options, api: makeApi([check]) }), /Timed out/);
  }
  await assert.rejects(waitForDeployment({ ...options, api: makeApi([successfulCheck(), successfulCheck({ id: 2, conclusion: 'failure' })]) }), /did not deploy/);
});
test('deployment polling waits for success and skips when main advances', async () => {
  let polls = 0, time = 0;
  const api = async path => path === 'git/ref/heads/main' ? { object: { sha: head } } : { check_runs: [successfulCheck({ status: ++polls === 1 ? 'in_progress' : 'completed' })] };
  await waitForDeployment({ api, sha: head, check: config.deploymentCheck, sleep: async ms => { time += ms; }, now: () => time, log: quiet });
  assert.equal(polls, 2);
  await assert.rejects(waitForDeployment({ api: async () => ({ object: { sha: newer } }), sha: head, check: config.deploymentCheck, log: quiet }), StaleDeployment);
});
test('HTTP 200 and 202 have distinct meanings; pending validation is never retried', async () => {
  for (const status of [200, 202]) {
    let requests = 0;
    const message = await submitBatch(config, [{ url: url('/a/') }], `${origin}/${config.key}.txt`, network(async (target, options) => {
      requests += 1;
      assert.equal(target, ENDPOINT); assert.equal(options.method, 'POST');
      assert.deepEqual(JSON.parse(options.body).urlList, [url('/a/')]);
      assert.equal(options.headers.authorization, undefined);
      return new Response(null, { status });
    }));
    assert.equal(requests, 1);
    assert.match(message, status === 200 ? /does not mean indexed/ : /key validation pending/);
  }
});
test('permanent IndexNow failures are not retried and invalid batches cannot be sent', async () => {
  let calls = 0;
  const net = network(async () => { calls += 1; return new Response(null, { status: 403 }); });
  await assert.rejects(submitBatch(config, [{ url: url('/a/') }], 'unused', net), /Key verification failed/);
  assert.equal(calls, 1);
  await assert.rejects(submitBatch(config, [], 'unused', net), /empty/);
  await assert.rejects(submitBatch(config, [{ url: 'https://other.test/a/' }], 'unused', net), /Invalid curated URL/);
  assert.equal(calls, 1);
});
test('transient HTTP retries honor Retry-After, stay bounded, and fail when the wait would be excessive', async () => {
  const pauses = []; let calls = 0;
  await request(ENDPOINT, {}, { fetchImpl: async () => ++calls === 1 ? new Response(null, { status: 429, headers: { 'retry-after': '3' } }) : new Response(null, { status: 200 }), sleep: async ms => pauses.push(ms) });
  assert.equal(calls, 2); assert.deepEqual(pauses, [3000]);
  assert.equal(retryDelay('Mon, 19 Oct 2026 08:00:05 GMT', 0, Date.parse('Mon, 19 Oct 2026 08:00:00 GMT')), 5000);
  calls = 0;
  await assert.rejects(request(ENDPOINT, {}, network(async () => { calls += 1; return new Response(null, { status: 503 }); })), /after 3 attempts/);
  assert.equal(calls, 3);
  await assert.rejects(request(ENDPOINT, {}, network(async () => new Response(null, { status: 429, headers: { 'retry-after': '3600' } }))), /bounded retry stopped/);
});
test('freshness is checked again before every transient POST retry', async () => {
  let checks = 0, posts = 0;
  await assert.rejects(request(ENDPOINT, { method: 'POST' }, {
    fetchImpl: async () => { posts += 1; return new Response(null, { status: 503 }); },
    sleep: async () => {}, beforeAttempt: async () => { if (++checks === 2) throw new StaleDeployment('main advanced'); }
  }), StaleDeployment);
  assert.equal(posts, 1);
});

// Disposable Git history verifies event semantics and the full production pipeline.
function gitFixture(t, updatedPages = { 'a/index.html': html('/a/', '<title>Changed page</title>') }) {
  const repo = mkdtempSync(join(tmpdir(), 'lettertoolkit-indexnow-test-'));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const command = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  command('init', '-b', 'main'); command('config', 'user.name', 'IndexNow tests'); command('config', 'user.email', 'indexnow-tests@example.invalid');
  function commit(source) {
    for (const [file, contents] of Object.entries(source)) { mkdirSync(dirname(join(repo, file)), { recursive: true }); writeFileSync(join(repo, file), contents); }
    command('add', '--all'); command('commit', '-m', 'fixture'); return command('rev-parse', 'HEAD');
  }
  const base = commit({ ...files(['/a/', '/b/']), 'indexnow.config.json': JSON.stringify(config), [`${config.key}.txt`]: config.key });
  const changed = commit(updatedPages);
  const tip = commit({ 'README.md': 'Documentation only' });
  return { repo, base, changed, tip, command, commit };
}
test('manual defaults to one first-parent diff; PR uses actual event base/head, never the merge SHA', t => {
  const fixture = gitFixture(t);
  const manual = eventSelection(fixture.repo, { GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_SHA: fixture.tip }, {});
  assert.equal(manual.head, fixture.tip); assert.equal(manual.base, fixture.changed); assert.equal(manual.dryRun, true);
  const explicit = eventSelection(fixture.repo, { GITHUB_EVENT_NAME: 'workflow_dispatch', INDEXNOW_COMMIT_SHA: fixture.changed }, {});
  assert.equal(explicit.head, fixture.changed); assert.equal(explicit.base, fixture.base);
  const pr = eventSelection(fixture.repo, { GITHUB_EVENT_NAME: 'pull_request', GITHUB_SHA: newer, INDEXNOW_DRY_RUN: 'false' }, { pull_request: { base: { sha: fixture.base }, head: { sha: fixture.changed } } });
  assert.equal(pr.head, fixture.changed); assert.equal(pr.base, fixture.base); assert.equal(pr.dryRun, true);
  const push = eventSelection(fixture.repo, { GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/heads/main', INDEXNOW_DRY_RUN: 'false' }, { before: fixture.base, after: fixture.tip });
  assert.equal(push.base, fixture.base); assert.equal(push.head, fixture.tip); assert.equal(push.dryRun, false);
  assert.throws(() => eventSelection(fixture.repo, { GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REF: 'refs/heads/topic', INDEXNOW_DRY_RUN: 'false' }, {}), /restricted to main/);
});
test('full dry runs and documentation-only pushes perform zero network calls and write a summary', async t => {
  const fixture = gitFixture(t), summary = join(fixture.repo, 'summary.txt');
  const net = network(async () => { throw new Error('Unexpected network request'); });
  const preview = await main({ repo: fixture.repo, env: { GITHUB_STEP_SUMMARY: summary }, argv: ['--dry-run', '--base', fixture.base, '--head', fixture.changed], network: net, log: quiet });
  assert.deepEqual(preview.entries.map(entry => entry.url), [url('/a/')]);
  assert.match(readFileSync(summary, 'utf8'), /dry run \(no requests\)/);
  const eventPath = join(fixture.repo, 'event.json'); writeFileSync(eventPath, JSON.stringify({ before: fixture.changed, after: fixture.tip }));
  const result = await main({ repo: fixture.repo, env: { GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/heads/main', GITHUB_EVENT_PATH: eventPath, INDEXNOW_DRY_RUN: 'false' }, argv: [], network: net, log: quiet });
  assert.equal(result.entries.length, 0);
});
test('production posts only after exact deploy; A(content) retargets to B(README) without losing A URLs', async t => {
  const fixture = gitFixture(t), eventPath = join(fixture.repo, 'event.json');
  writeFileSync(eventPath, JSON.stringify({ before: fixture.base, after: fixture.changed }));
  const env = { GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/heads/main', GITHUB_EVENT_PATH: eventPath, INDEXNOW_DRY_RUN: 'false', GITHUB_REPOSITORY: 'owner/repo', GITHUB_TOKEN: 'test-read-only-token' };
  for (const stale of [false, true]) {
    let freshness = 0; const calls = [];
    const result = await main({ repo: fixture.repo, env, argv: [], log: quiet, network: network(async (target, options) => {
      calls.push(target);
      if (target.includes('api.github.com')) {
        assert.equal(options.headers.authorization, 'Bearer test-read-only-token');
        if (target.endsWith('/git/ref/heads/main')) { freshness += 1; return Response.json({ object: { sha: stale && freshness >= 3 ? fixture.tip : fixture.changed } }); }
        const deployedSha = stale && freshness >= 3 ? fixture.tip : fixture.changed;
        assert.ok(target.includes(`/commits/${deployedSha}/check-runs?`));
        return Response.json({ check_runs: [successfulCheck({ head_sha: deployedSha })] });
      }
      assert.equal(options.headers.authorization, undefined);
      if (target === `${origin}/${config.key}.txt`) return new Response(config.key, { headers: { 'content-type': 'text/plain' } });
      if (target === url('/a/')) return htmlResponse('/a/');
      if (target === ENDPOINT) { assert.deepEqual(JSON.parse(options.body).urlList, [url('/a/')]); return new Response(null, { status: 202 }); }
      throw new Error(`Unexpected request: ${target}`);
    }) });
    assert.equal(calls.filter(target => target === ENDPOINT).length, 1);
    assert.equal(result.head, stale ? fixture.tip : fixture.changed);
    assert.equal(result.base, fixture.base);
    assert.match(result.status, /HTTP 202/); assert.equal(calls.at(-1), ENDPOINT);
    assert.ok(calls.indexOf(url('/a/')) > calls.indexOf(`${origin}/${config.key}.txt`));
  }
});
test('a deployment changing during live GET retargets removed routes and preserves unrelated changes', async t => {
  const fixture = gitFixture(t, { 'a/index.html': html('/a/', '<title>Updated A</title>'), 'b/index.html': html('/b/', '<title>Updated B</title>') });
  fixture.command('rm', 'a/index.html');
  const latest = fixture.commit({ 'sitemap-tools.xml': sitemap(['/b/']) });
  const eventPath = join(fixture.repo, 'event.json'); writeFileSync(eventPath, JSON.stringify({ before: fixture.base, after: fixture.changed }));
  const env = { GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/heads/main', GITHUB_EVENT_PATH: eventPath, INDEXNOW_DRY_RUN: 'false', GITHUB_REPOSITORY: 'owner/repo', GITHUB_TOKEN: 'test-token' };
  let currentSha = fixture.changed, posts = 0;
  const result = await main({ repo: fixture.repo, env, argv: [], log: quiet, network: network(async (target, options) => {
    if (target.endsWith('/git/ref/heads/main')) return Response.json({ object: { sha: currentSha } });
    if (target.includes('/check-runs?')) { assert.ok(target.includes(`/commits/${currentSha}/`)); return Response.json({ check_runs: [successfulCheck({ head_sha: currentSha })] }); }
    if (target === `${origin}/${config.key}.txt`) return new Response(config.key, { headers: { 'content-type': 'text/plain' } });
    if (target === url('/a/')) { currentSha = latest; return new Response('Deleted by newer deployment', { status: 410 }); }
    if (target === url('/b/')) return htmlResponse('/b/');
    if (target === ENDPOINT) { posts += 1; assert.deepEqual(JSON.parse(options.body).urlList, [url('/a/'), url('/b/')]); return new Response(null, { status: 200 }); }
    throw new Error(`Unexpected request: ${target}`);
  }) });
  assert.equal(posts, 1); assert.equal(result.head, latest); assert.equal(result.base, fixture.base);
  assert.deepEqual(result.entries.map(entry => entry.kind), ['removed', 'active']);
});
test('continually advancing main stops after three retargets and reports the preserved baseline', async t => {
  const fixture = gitFixture(t), eventPath = join(fixture.repo, 'event.json');
  writeFileSync(eventPath, JSON.stringify({ before: fixture.base, after: fixture.changed }));
  const env = { GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/heads/main', GITHUB_EVENT_PATH: eventPath, INDEXNOW_DRY_RUN: 'false', GITHUB_REPOSITORY: 'owner/repo', GITHUB_TOKEN: 'test-token' };
  let checks = 0;
  await assert.rejects(main({ repo: fixture.repo, env, argv: [], log: quiet, network: network(async target => {
    assert.ok(target.endsWith('/git/ref/heads/main'));
    return Response.json({ object: { sha: ++checks % 2 ? fixture.tip : fixture.changed } });
  }) }), new RegExp(`after 3 retargets.*baseline ${fixture.base}`));
  assert.equal(checks, 4);
});
