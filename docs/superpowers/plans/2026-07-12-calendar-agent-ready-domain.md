# Calendar Agent-Ready Domain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the Calendar documentation from `https://calendar.gobrand.app`, remove the former shared-host deployment and references, and expose honest machine-readable discovery and Markdown content.

**Architecture:** TanStack Start remains the HTML application, now rooted at `/`. The docs generator owns llms, sitemap, robots, skill discovery, and a generated route-to-Markdown module; a small server-entry wrapper handles content negotiation and discovery headers before delegating normal requests to TanStack Start.

**Tech Stack:** TypeScript, TanStack Start, Vite, Cloudflare Workers Custom Domains, Node test runner through `tsx`, Wrangler.

## Global Constraints

- `https://calendar.gobrand.app` is the only public and canonical website URL.
- The former shared-host Worker routes are removed without redirects.
- Do not advertise MCP, A2A, authentication, commerce, API catalog, DNS-AID, or other capabilities the site does not provide.
- The generator remains deterministic and source-controlled artifacts come from the existing MDX documentation.
- Preserve the user-owned untracked `AGENTS.md`.
- Work on `staging`, synchronize the verified commit to `main`, and finish on `staging`.

---

### Task 1: Root-domain routing and canonical references

**Files:**
- Modify: `apps/www/vite.config.ts`
- Modify: `apps/www/src/router.tsx`
- Modify: `apps/www/src/routes/__root.tsx`
- Modify: `apps/www/public/site.webmanifest`
- Delete: `apps/www/scripts/restructure-assets.js`
- Modify: `apps/www/package.json`
- Modify: `apps/www/wrangler.jsonc`
- Modify: `README.md`
- Modify: `packages/core/package.json`
- Modify: `packages/react/package.json`
- Modify: `packages/core/README.md`
- Modify: `packages/react/README.md`
- Modify: `apps/www/README.md`
- Modify: current source-controlled documents containing the old Calendar URL

**Interfaces:**
- Consumes: existing `/calendar`-based Vite, router, asset, and Cloudflare configuration.
- Produces: a root-based site and one Custom Domain route for `calendar.gobrand.app`.

- [ ] **Step 1: Add a failing repository contract check**

Create `scripts/calendar-site-contract.test.ts` with Node tests that inspect tracked text files, excluding the user-owned `AGENTS.md`, and assert that no file contains the former shared hostname. Separately inspect deployable website files for root-relative `/calendar/` site paths. Assert that `apps/www/wrangler.jsonc` contains `"pattern": "calendar.gobrand.app"` and `"custom_domain": true`.

- [ ] **Step 2: Run the contract test and confirm the old configuration fails**

Run: `pnpm exec tsx --test scripts/calendar-site-contract.test.ts`

Expected: FAIL with matches in Vite config, router config, Worker routes, generated files, READMEs, and package metadata.

- [ ] **Step 3: Move the app to the hostname root**

Set Vite `base: '/'`, remove the TanStack Router `basepath`, change icons, manifest, and search endpoints to root-relative paths, and update manifest asset URLs. Change the docs build script to `vite build`; delete the obsolete asset-moving script.

Replace Worker routes with:

```json
"routes": [
  {
    "pattern": "calendar.gobrand.app",
    "custom_domain": true
  }
]
```

- [ ] **Step 4: Replace current old-domain references**

Replace every former shared-host reference with a canonical dedicated-host URL across active source, READMEs, package metadata, skills, generated artifacts, and project docs. Calendar links use `https://calendar.gobrand.app`; unrelated links must use their real dedicated hostname or be removed. Do not rewrite Git history. Update local development instructions from `/calendar/` to `/`.

- [ ] **Step 5: Run the contract test and app typecheck**

Run: `pnpm exec tsx --test scripts/calendar-site-contract.test.ts && pnpm --filter @gobrand/calendar-docs typecheck`

Expected: both commands exit 0.

---

### Task 2: Deterministic agent discovery and Markdown output

**Files:**
- Modify: `scripts/generate-docs.ts`
- Modify: `package.json`
- Create: `scripts/generate-docs.test.ts`
- Generate: `apps/www/public/robots.txt`
- Generate: `apps/www/public/sitemap.xml`
- Generate: `apps/www/public/llms.txt`
- Generate: `apps/www/public/llms-full.txt`
- Generate: `apps/www/public/.well-known/agent-skills/index.json`
- Generate: `apps/www/public/.well-known/agent-skills/calendar/SKILL.md`
- Generate: `apps/www/src/generated/agent-markdown.ts`
- Generate: `skills/calendar/SKILL.md`

**Interfaces:**
- Consumes: ordered MDX files and metadata from `apps/www/content/docs`.
- Produces: `agentMarkdownByPath: Readonly<Record<string, string>>` plus static discovery files.

- [ ] **Step 1: Write failing generator tests**

Add Node tests which run `pnpm generate:docs`, parse the generated skill index JSON, validate sitemap XML and robots directives, assert `/llms-full.txt` is linked from `/llms.txt`, assert the published skill digest has the `sha256:` prefix, assert every absolute Calendar URL begins with `https://calendar.gobrand.app`, and rerun generation to verify identical bytes.

- [ ] **Step 2: Run the generator tests and confirm missing artifacts fail**

Run: `pnpm exec tsx --test scripts/generate-docs.test.ts`

Expected: FAIL because robots, sitemap, llms-full, discovery index, published skill, and the generated Markdown module do not exist.

- [ ] **Step 3: Extend the generator**

Use `SITE_URL = 'https://calendar.gobrand.app'` and `DOCS_URL = `${SITE_URL}/docs``. Generate:

```text
User-agent: *
Allow: /
Content-Signal: ai-train=no, search=yes, ai-input=yes
Sitemap: https://calendar.gobrand.app/sitemap.xml
```

Add explicit blocks with the same policy for GPTBot, OAI-SearchBot, Claude-Web, Google-Extended, Amazonbot, anthropic-ai, Bytespider, CCBot, and Applebot-Extended. Build the sitemap from `/`, `/docs`, every discovered documentation route, `/llms.txt`, `/llms-full.txt`, and the skill endpoints.

Generate the Agent Skills discovery index using schema `https://schemas.agentskills.io/discovery/0.2.0/schema.json`, the existing `calendar` name and description, the public SKILL URL, and the SHA-256 digest of the generated skill bytes.

Generate `agentMarkdownByPath` for `/`, `/docs`, and each documentation route. Each value contains its title, description, canonical URL, and MDX body after frontmatter removal. Generate `/llms-full.txt` by concatenating the same ordered Markdown documents.

- [ ] **Step 4: Add generator verification to normal scripts**

Add `"test:docs": "tsx --test scripts/generate-docs.test.ts scripts/calendar-site-contract.test.ts"` to the root scripts and keep `pnpm generate:docs` as the sole generation entry point.

- [ ] **Step 5: Generate twice and run tests**

Run: `pnpm generate:docs && pnpm generate:docs && pnpm test:docs`

Expected: all tests pass and the second generation produces no additional diff.

---

### Task 3: Worker content negotiation and discovery headers

**Files:**
- Create: `apps/www/src/lib/agent-response.ts`
- Create: `apps/www/src/lib/agent-response.test.ts`
- Create: `apps/www/src/server.ts`
- Modify: `apps/www/wrangler.jsonc`

**Interfaces:**
- Consumes: `agentMarkdownByPath` from `@/generated/agent-markdown` and the default TanStack Start handler.
- Produces: `handleAgentRequest(request: Request, next: () => Promise<Response>): Promise<Response>`.

- [ ] **Step 1: Write failing response-handler tests**

Test that `Accept: text/markdown` returns the matching generated Markdown with status 200 and `Content-Type: text/markdown; charset=utf-8`; a normal HTML request delegates to `next`; an unknown Markdown route delegates and preserves its status; and all delegated HTML responses gain `Vary: Accept`, `Link`, and `Content-Signal` headers without losing existing headers.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `pnpm exec tsx --test apps/www/src/lib/agent-response.test.ts`

Expected: FAIL because `handleAgentRequest` does not exist.

- [ ] **Step 3: Implement the pure response wrapper**

Normalize trailing slashes, match only GET/HEAD requests, use the generated map for Markdown, and otherwise clone the delegated response headers. Set:

```text
Link: <https://calendar.gobrand.app/llms.txt>; rel="describedby"; type="text/markdown", <https://calendar.gobrand.app/.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"
Content-Signal: ai-train=no, search=yes, ai-input=yes
Vary: Accept
```

Set `x-markdown-tokens` to the deterministic ceiling of character count divided by four for generated Markdown responses.

- [ ] **Step 4: Wire the custom TanStack Start entry**

In `apps/www/src/server.ts`, import the default handler and `createServerEntry` from `@tanstack/react-start/server-entry`, then delegate through `handleAgentRequest`. Change Wrangler `main` to `./src/server.ts`.

- [ ] **Step 5: Run focused and website verification**

Run: `pnpm exec tsx --test apps/www/src/lib/agent-response.test.ts && pnpm --filter @gobrand/calendar-docs typecheck && pnpm --filter @gobrand/calendar-docs build`

Expected: tests, typecheck, and build exit 0.

---

### Task 4: Full verification, deployment, scanning, and branch synchronization

**Files:**
- Modify only files required by genuine live scanner findings.

**Interfaces:**
- Consumes: built Worker and Cloudflare Custom Domain configuration.
- Produces: verified production responses at `https://calendar.gobrand.app` and matching `main`/`staging` commits.

- [ ] **Step 1: Run the complete local verification suite**

Run: `pnpm test --run && pnpm test:docs && pnpm typecheck && pnpm build && pnpm lint && pnpm format:check && pnpm verify:packages && pnpm --filter @gobrand/calendar-docs build && git diff --check`

Expected: every command exits 0.

- [ ] **Step 2: Verify the migration diff**

Run targeted searches for the former shared hostname, `/calendar/`, old Worker routes, and the new canonical hostname. Confirm the former hostname has no tracked matches and that no deployable/config/generated artifact uses the old base path.

- [ ] **Step 3: Deploy the Worker**

Run: `pnpm --filter @gobrand/calendar-docs run deploy`

Expected: Wrangler creates or updates the `calendar.gobrand.app` Custom Domain and reports a successful deployment.

- [ ] **Step 4: Verify production protocols**

Use direct HTTP requests to confirm `/`, `/docs`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`, and both skill discovery URLs return 200. Confirm `Accept: text/markdown` on `/docs` returns Markdown and normal requests return HTML with discovery headers.

- [ ] **Step 5: Scan and iterate**

POST `{"url":"https://calendar.gobrand.app","format":"agent"}` to `https://isitagentready.com/api/scan`. Correct only findings supported by the site's real capabilities, rerun local verification for each edit, redeploy, and rescan until no further sensible improvement remains.

- [ ] **Step 6: Commit and synchronize branches**

Commit the implementation on `staging`, push `staging`, fast-forward `main` to the same verified commit, push `main`, and switch back to `staging`. Do not add or commit `AGENTS.md`.

- [ ] **Step 7: Final live and Git verification**

Confirm `git status --short --branch` shows `staging` tracking `origin/staging` with only the user-owned untracked `AGENTS.md`; confirm `origin/main` and `origin/staging` resolve to the same implementation commit; and repeat the critical production HTTP checks after the final push.
