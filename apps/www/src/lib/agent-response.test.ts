import assert from 'node:assert/strict';
import test from 'node:test';
import { handleAgentRequest } from './agent-response';

test('returns generated Markdown when the route requests it', async () => {
  let delegated = false;
  const request = new Request('https://calendar.gobrand.app/docs', {
    headers: { Accept: 'text/markdown' },
  });

  const response = await handleAgentRequest(request, async () => {
    delegated = true;
    return new Response('html');
  });

  assert.equal(delegated, false);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/markdown; charset=utf-8');
  assert.equal(response.headers.get('vary'), 'Accept');
  assert.match(response.headers.get('x-markdown-tokens') ?? '', /^\d+$/);
  assert.match(await response.text(), /^# React Calendar/m);
});

test('delegates normal browser requests and adds discovery headers', async () => {
  const request = new Request('https://calendar.gobrand.app/docs', {
    headers: { Accept: 'text/html' },
  });

  const response = await handleAgentRequest(
    request,
    async () =>
      new Response('html', {
        headers: { 'Content-Type': 'text/html', Vary: 'Origin', 'X-Existing': 'yes' },
      }),
  );

  assert.equal(await response.text(), 'html');
  assert.equal(response.headers.get('x-existing'), 'yes');
  assert.equal(response.headers.get('vary'), 'Origin, Accept');
  assert.equal(response.headers.get('content-signal'), 'ai-train=no, search=yes, ai-input=yes');
  assert.match(response.headers.get('link') ?? '', /\/llms\.txt/);
  assert.match(response.headers.get('link') ?? '', /agent-skills\/index\.json/);
});

test('delegates unknown Markdown routes and preserves their status', async () => {
  const request = new Request('https://calendar.gobrand.app/not-found', {
    headers: { Accept: 'text/markdown' },
  });

  const response = await handleAgentRequest(
    request,
    async () => new Response('missing', { status: 404 }),
  );

  assert.equal(response.status, 404);
  assert.equal(await response.text(), 'missing');
});

test('normalizes trailing slashes for Markdown routes', async () => {
  const request = new Request('https://calendar.gobrand.app/docs/', {
    headers: { Accept: 'text/markdown, text/html;q=0.8' },
  });

  const response = await handleAgentRequest(request, async () => new Response('html'));

  assert.equal(response.headers.get('content-type'), 'text/markdown; charset=utf-8');
  assert.match(await response.text(), /^# React Calendar/m);
});
