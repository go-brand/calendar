# Calendar documentation site

The public documentation and runnable examples for `@gobrand/calendar-core` and
`@gobrand/react-calendar`. Built with TanStack Start and Fumadocs.

Run commands from the repository root:

```bash
pnpm install
pnpm --filter @gobrand/calendar-docs dev
```

Open [http://127.0.0.1:3000/calendar/](http://127.0.0.1:3000/calendar/).

Documentation lives in `apps/www/content/docs`. Runnable React examples live in
`apps/www/src/components/examples`; the preview shows those exact source files.

```bash
pnpm --filter @gobrand/calendar-docs typecheck
pnpm --filter @gobrand/calendar-docs build
```
