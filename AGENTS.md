# Agent guidance

## Validation

- Use Node.js 22 and install locked dependencies with `npm ci`.
- Before handing off changes, run `npm run build`. This performs both TypeScript checks and the Vite production build.
- Keep CI and deployment self-contained. They must not depend on the private sibling `jump4life` repository.
- Commands that regenerate data or assets may use the sibling repository locally, but only when the task explicitly requires regeneration.

## Git workflow

- Make changes through a pull request targeting `main`.
- Do not bypass branch protection or push directly to `main` unless the repository owner explicitly requests it.
- Preserve unrelated user changes and existing merged history.
- Use the repository identity `cjdcoy <22911399+Cjdcoy@users.noreply.github.com>` for commits.

## Production deployment

- Production is the existing Cloudflare Worker named `jump4life`, serving `jump4life.org` and `www.jump4life.org`.
- The normal deployment path is a merge to `main`. `.github/workflows/deploy-cloudflare-worker.yml` rebuilds the site and deploys `dist/`.
- Do not run a production deployment, enable or disable its gate, or manually dispatch its workflow without explicit authorization from the repository owner.
- When authorized to dispatch production manually, run:
  `gh workflow run deploy-cloudflare-worker.yml --ref main --repo Cjdcoy/j4l-web`
- Watch the resulting run through completion and verify both production domains return successful HTML responses.

## Cloudflare safety

- For local deployment validation, build first and then run:
  `npx --yes wrangler@4.114.0 deploy --dry-run --config wrangler.jsonc`
- Do not run `wrangler deploy` against production directly unless the repository owner explicitly requests that exact method.
- Keep `workers_dev` and preview URLs disabled.
- Keep custom domains and routes managed in the Cloudflare dashboard; do not add `route` or `routes` to `wrangler.jsonc`.
- Do not retrieve, print, copy, or commit Cloudflare credentials. GitHub production environment secrets provide them to the deployment workflow.
- Do not change Worker bindings, variables, routes, domains, or token permissions unless the task explicitly requires it.
