# Publishing

`pnpm release <patch|minor|major>` checks, builds, bumps both packages, tags `vX.Y.Z`, and pushes. The tag runs the `publish` job in `.github/workflows/ci.yml`, which publishes `@gobrand/calendar-core` and then `@gobrand/react-calendar`.

Publishing uses npm trusted publishing: GitHub Actions gives the job an OIDC token, and npm exchanges it for a short-lived publish token. There is no npm token to store or rotate, and every release carries a provenance attestation.

## Trusted publisher setup

Each package has its own setting on npmjs.com: **Settings → Trusted publishing → GitHub Actions**.

- Organization or user: `go-brand`
- Repository: `calendar`
- Workflow filename: `ci.yml`
- Environment: empty
- Allowed actions: **npm publish**

A new trusted publisher must publish once within 2 days or it expires; if it does, delete it and add it again.

After the first release through the workflow, set **Settings → Publishing access** to "Require two-factor authentication and disallow tokens" on both packages.
