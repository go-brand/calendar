# Calendar Agent-Ready Domain Design

## Goal

Move the Calendar website to `https://calendar.gobrand.app`, remove the old
`eng.gobrand.app/calendar` deployment completely, and make the documentation
site as agent-ready as its real capabilities justify.

## Decisions

- `https://calendar.gobrand.app` is the only public and canonical website URL.
- The site is served from the hostname root. Documentation lives under `/docs`,
  not `/calendar/docs`.
- The Cloudflare Worker uses a Custom Domain for `calendar.gobrand.app`.
- The old `eng.gobrand.app/calendar` and `eng.gobrand.app/calendar/*` Worker
  routes are removed. They do not redirect.
- Every current Calendar URL reference in source, package metadata, READMEs,
  generated documentation, skills, and active project documentation is changed
  to the new hostname and root-based path.
- Historical Git commits and external published package versions are not
  rewritten.
- Agent readiness must describe real Calendar documentation capabilities. The
  site will not advertise MCP, A2A, authentication, commerce, or an API catalog
  that the project does not provide.

## Website Routing

The Vite base and TanStack Router base path are changed from `/calendar` to `/`.
Static assets, the web manifest, search requests, navigation, and generated
documentation URLs use root-relative paths.

The build no longer moves client assets into a `calendar` directory. Its
post-build step only performs work that remains necessary for deployment and
must not recreate the deleted `eng` routes.

Cloudflare configuration declares this Custom Domain:

```json
{
  "pattern": "calendar.gobrand.app",
  "custom_domain": true
}
```

## Agent Discovery

The deployed root exposes:

- `/robots.txt` with a sitemap declaration, an explicit wildcard rule, and
  explicit rules for established AI crawlers. The policy allows documentation
  search and agent input while declining model training.
- `/sitemap.xml` with canonical `https://calendar.gobrand.app` URLs generated
  from the real documentation routes.
- `/llms.txt` as a concise index of the library and its important documentation.
- `/llms-full.txt` as a detailed Markdown representation of the documentation,
  linked from `/llms.txt`.
- `/.well-known/agent-skills/index.json` using the Agent Skills discovery schema.
- `/.well-known/agent-skills/calendar/SKILL.md`, generated from the repository's
  existing Calendar skill.

HTML responses include registered `Link` relations that point agents to the
Markdown description and skill discovery index. They also include a consistent
content-use signal.

DNS-AID is excluded: this documentation site does not expose a separate agent
service, and adding a DNS service advertisement would claim a capability that
does not exist.

## Markdown Content Negotiation

A small custom TanStack Start server entry wraps the existing request handler.
For documentation and landing-page requests with `Accept: text/markdown`, it
returns the corresponding generated Markdown resource with
`Content-Type: text/markdown; charset=utf-8`, `Vary: Accept`, and a token-count
hint when available. Normal browser requests continue through the existing SSR
handler unchanged.

Markdown resources are generated from the same MDX content and route metadata
as the website. There is no second hand-maintained documentation tree.
Unsupported routes preserve their normal status instead of returning unrelated
Markdown.

## Generation Boundaries

`scripts/generate-docs.ts` remains the source-controlled generator for agent and
skill output. It is extended to generate the full Markdown corpus and discovery
artifacts from source content. Generated files live under `apps/www/public` so
the Worker can serve them directly.

The generator must be deterministic. Running it twice without source changes
produces no diff. Generated links use only `https://calendar.gobrand.app`.

## Testing

Tests are added before implementation for the behavior that can regress:

- generated discovery files have valid structure and canonical new-domain URLs;
- no generated artifact contains `eng.gobrand.app` or `/calendar/` site paths;
- Markdown negotiation selects Markdown only when requested and preserves normal
  SSR behavior otherwise;
- response headers include discovery links, `Vary: Accept`, and content signals;
- the deployment configuration contains only the new Custom Domain.

The existing package test, typecheck, build, formatting, lint, package
verification, and docs build commands remain release gates.

## Deployment and Acceptance

Deploy from `staging`, then verify the live hostname with direct HTTP requests
for HTML, Markdown negotiation, robots, sitemap, llms files, and skill discovery.
Run the isitagentready.com scanner against `https://calendar.gobrand.app` and
iterate on genuine findings until remaining failures require irrelevant or
fictional capabilities.

After live verification, commit and push the completed work to `staging`, update
`main` to the same verified commit, push `main`, and switch the working tree back
to `staging`.

This is a website and documentation deployment. It does not publish a new npm
version unless implementation uncovers a package-runtime change that requires
one.
