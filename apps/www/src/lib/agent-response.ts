import { agentMarkdownByPath } from '../generated/agent-markdown';

const contentSignal = 'ai-train=no, search=yes, ai-input=yes';
const discoveryLinks = [
  '<https://calendar.gobrand.app/llms.txt>; rel="describedby"; type="text/markdown"',
  '<https://calendar.gobrand.app/.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
].join(', ');

function acceptsMarkdown(request: Request): boolean {
  return (request.headers.get('accept') ?? '').split(',').some((value) => {
    const [mediaType, ...parameters] = value.split(';').map((part) => part.trim());
    const quality = parameters.find((parameter) => parameter.startsWith('q='));
    return mediaType === 'text/markdown' && quality !== 'q=0';
  });
}

function normalizePath(pathname: string): string {
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '');
}

function addAgentHeaders(headers: Headers): void {
  const vary = headers.get('vary');
  const varyValues = new Set(
    (vary ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );
  varyValues.add('Accept');

  headers.set('Vary', [...varyValues].join(', '));
  headers.set('Link', discoveryLinks);
  headers.set('Content-Signal', contentSignal);
}

export async function handleAgentRequest(
  request: Request,
  next: () => Promise<Response>,
): Promise<Response> {
  const methodSupportsRepresentation = request.method === 'GET' || request.method === 'HEAD';
  const pathname = normalizePath(new URL(request.url).pathname);
  const markdown = agentMarkdownByPath[pathname];

  if (methodSupportsRepresentation && markdown && acceptsMarkdown(request)) {
    const headers = new Headers({
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(markdown.length / 4)),
    });
    addAgentHeaders(headers);

    return new Response(request.method === 'HEAD' ? null : markdown, { headers });
  }

  const response = await next();
  const headers = new Headers(response.headers);
  addAgentHeaders(headers);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
