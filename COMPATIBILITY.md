citadel_cli tracks compatibility across the most common React hosting frameworks. The
table below lists the environments we prioritize; items marked `N` still need a
full verification run before release.

| Framework                      | Version(s) | Verified |
| ------------------------------ | ---------- | -------- |
| React 19 + Vite                | 19.1.0     | Y        |
| React 18 + Vite                | 18.3.1     | Y        |
| React + Next.js (App Router)   | 15.2.4     | Y        |
| React + Next.js (Pages Router) | 14.2.11    | N        |
| Remix (React runtime)          | 2.10.0     | N        |
| Astro (with `@astrojs/react`)  | 4.5.8      | N        |
| Gatsby                         | 5.13.4     | N        |
| Storybook (React framework)    | 8.1.2      | N        |

## Verification fixtures

### React 18 + Vite

- Dockerfile: `compatibility/react18-vite/Dockerfile`
- Runner script: `scripts/test-react18-vite.sh`

The runner builds the React 18 demo app, exposes it on port 5173, and executes
the Playwright E2E suite against the container. Set `PLAYWRIGHT_PORT` before
invocation if you need a different host port.

### React + Next.js (App Router)

- Dockerfile: `compatibility/nextjs-app-router/Dockerfile`
- Runner script: `scripts/test-nextjs-app-router.sh`

The runner spins up a Next.js 15 App Router demo on port 3000 and runs the shared
Playwright scenarios. Override `NEXT_APP_ROUTER_PORT` to use a different host port.
