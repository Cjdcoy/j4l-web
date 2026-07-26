# Jump4Life Web

Frontend-only website for the Jump4Life Call of Duty 2 jumping mod. The app is built with React, TypeScript, and Vite, and can run directly with Node.js or through Docker Compose.

## Development

Start the Docker-based development server:

```sh
mise run dev
```

The site will be available at http://localhost:5173. Run `mise run help` to see the other Docker-based tasks.

To run the app directly on the host instead:

```sh
npm install
npm run dev
```

The site reads live data from the separately deployed cj-stats API. It defaults to `https://jhstats.fly.dev`, requests J4L data with `source=j4l`, and overlays 125 FPS map difficulty data from `source=jh`.

Copy the example environment file to override those defaults:

```sh
cp .env.example .env
```

The supported settings are:

- `VITE_API_BASE_URL`
- `VITE_API_SOURCE`
- `VITE_MAP_DIFFICULTY_SOURCE`
- `VITE_DISCORD_URL`

## Validation and deployment

Run the production build with either `mise run verify` or `npm run build`. The generated static site is written to `dist/`.

GitHub Actions installs the locked dependencies and runs the production build for every pull request and push to `main`. A separate workflow publishes `dist/` to Cloudflare Pages after changes land on `main`.

Configure the deployment workflow with:

- Repository secret `CLOUDFLARE_API_TOKEN`: a token scoped to the account with `Cloudflare Pages: Edit`.
- Repository secret `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account that owns the Pages project.
- Repository variable `CLOUDFLARE_PAGES_PROJECT`: the existing Pages project name.
- Repository variable `CLOUDFLARE_DEPLOY_ENABLED`: set to `true` after the other values are configured.

If the Pages project uses Cloudflare's Git integration, disable its automatic production and preview branch deployments before enabling the GitHub Actions deploy workflow. This prevents the same commit from being deployed twice.

The `static` Docker target builds the app and serves it with nginx:

```sh
docker build --target static -t j4l-web .
```

Set `VITE_API_BASE_URL` as a build argument when deploying against a different API instance.

## Generated data and assets

- `npm run sync:commands` refreshes `src/data/commands.ts` from the sibling `jump4life` repository. Set `J4L_GAME_REPO` to use a different source path.
- `mise run maps:optimize` rebuilds the AVIF map cards in `public/maps` from screenshots under `cod2/added_to_mod`.
- `npm run optimize:ranks` rebuilds rank images in `public/ranks` from the sibling `jump4life` repository. Set `J4L_RANK_SOURCE_DIR` to override the source path.
