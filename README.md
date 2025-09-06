# nextjs-boilerplate

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Puppeteer automation (chromium-min)

This project runs Puppeteer in a Next.js App Router API route and supports both local development and Vercel deployments.

- Local: uses `puppeteer` (full Chrome) automatically.
- Vercel: uses `puppeteer-core` with `@sparticuz/chromium-min`.

### Files and settings

- `app/api/vercfunctions/route.ts`
	- Imports `chromium` from `@sparticuz/chromium-min` and uses `chromium.executablePath()` and `chromium.args` when running on Vercel.
	- Exports `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`, and `maxDuration = 60`.

- `next.config.ts`
	- `serverExternalPackages: ["@sparticuz/chromium-min", "puppeteer-core"]`
	- `outputFileTracingIncludes` includes `node_modules/@sparticuz/chromium-min/**` to bundle Chromium assets for the serverless function.

- `vercel.json`
	- Ensures the built API route bundles Chromium assets:

		```json
		{
			"functions": {
				"app/api/**/route.js": {
					"maxDuration": 60,
					"memory": 1024,
					"includeFiles": "node_modules/@sparticuz/chromium-min/**/*"
				}
			}
		}
		```

### Deploy tips

- After changing Chromium/Puppeteer config, redeploy on Vercel with “Clear build cache” once so new assets are traced and bundled.
- Keep `@sparticuz/chromium-min` and `puppeteer-core` in `dependencies` (not `devDependencies`).
- If your route changes, ensure the glob in `vercel.json` still matches (`app/api/**/route.js`).

### Troubleshooting

- Error about missing brotli/bin files: confirm `vercel.json` `includeFiles` points to `@sparticuz/chromium-min/**/*` and that you cleared the build cache.
- Runtime errors only on Vercel: check logs to verify `chromium.executablePath()` resolves and `runtime = 'nodejs'` is in the route.
- Timeouts: increase `maxDuration` (and Project > Functions limits if needed) or simplify the automation steps.
