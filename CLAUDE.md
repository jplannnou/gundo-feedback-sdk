# @gundo/feedback-sdk

Shared React component library and hooks for the GUNDO Feedback Hub. Provides click-anywhere feedback capture, review mode, dashboards, and comment threads across all GUNDO projects.

## Architecture

Published to **GitHub Packages** as `@jplannnou/feedback-sdk`. Consumers use npm alias: `"@gundo/feedback-sdk": "npm:@jplannnou/feedback-sdk@^1.0.3"` — zero code changes needed.

```
gundo-feedback-sdk/
├── src/
│   ├── index.ts                    # All exports
│   ├── types.ts                    # Shared TypeScript types
│   ├── FeedbackProvider.tsx        # React context provider
│   ├── api/
│   │   └── feedback-client.ts      # HTTP client (FeedbackClient class)
│   ├── components/
│   │   ├── ReviewMode.tsx          # Click-anywhere feedback capture + screenshot
│   │   ├── FeedbackToggle.tsx      # Floating toggle button to activate review mode
│   │   ├── FeedbackDashboard.tsx   # Admin dashboard (list, filter, stats)
│   │   ├── FeedbackItemCard.tsx    # Individual feedback item card
│   │   ├── CommentThread.tsx       # Threaded comments on feedback items
│   │   └── HealthScoreCard.tsx     # Project health score KPI
│   ├── hooks/
│   │   ├── useFeedbackMode.ts      # Activate/deactivate feedback mode
│   │   ├── useReviewMode.ts        # Toggle state for ReviewMode
│   │   ├── useFeedbackList.ts      # Fetch feedback items (with filters)
│   │   └── useFeedbackSubmit.ts    # Submit new feedback mutation
│   └── utils/
│       ├── screenshot-capture.ts   # html2canvas wrapper
│       └── time-helpers.ts         # Date formatting utilities
└── package.json
```

## Tech Stack

- **React 19** — peer dependency
- **TypeScript** — source only, no build
- **html2canvas** — screenshot capture (must be installed in each consumer)
- **CSS Custom Properties** — uses `--ui-*` tokens from `@gundo/ui` with fallbacks

## Usage in Consumers

```tsx
import { FeedbackProvider, ReviewMode, FeedbackToggle, useReviewMode } from '@gundo/feedback-sdk';

function App() {
  const reviewMode = useReviewMode();
  return (
    <FeedbackProvider
      project="engine"                           // engine | radar | finance | jp-assistant
      apiBaseUrl="/api/feedback-hub"              // Backend proxy path
      getUser={() => ({ email, name, avatarUrl })} // From existing auth
    >
      <ReviewMode active={reviewMode.active} onDeactivate={reviewMode.toggle} />
      <FeedbackToggle active={reviewMode.active} onClick={reviewMode.toggle} />
      {/* App content */}
    </FeedbackProvider>
  );
}
```

## Consumer Projects

| Project | Backend Proxy Path | Frontend Entry |
|---------|-------------------|----------------|
| Engine | `/api/feedback-hub/*` | `frontend/src/App.tsx` |
| Finance | `/api/feedback-hub/*` | `frontend/src/main.tsx` |
| JP Assistant | `/api/feedback-hub/*` | `frontend/src/App.tsx` |
| Radar | `/api/feedback-proxy/*` | `client/src/` |

## Hub API

- **URL**: `https://gundo-feedback-api-744494884826.us-central1.run.app`
- **Repo**: `~/projects/gundo-feedback/` (GitHub: `jplannnou/gundo-feedback`)
- **Auth**: Each consumer backend proxies with `X-Feedback-Api-Key` + `X-Feedback-User-Email` headers
- **DB**: Cloud SQL PostgreSQL (`gundo-feedback-hub` instance in `gundo-content-engine` project)

## Conventions

- **`erasableSyntaxOnly`**: Do NOT use TypeScript parameter properties (`constructor(private x: string)`). Use explicit field declarations instead.
- **CSS**: Use `var(--ui-*)` tokens with fallback values for standalone usage
- **Exports**: Everything must be exported from `src/index.ts`

## Build & Distribution

Published to **GitHub Packages** via `publish.yml` workflow (triggered by `v*` tags).

```bash
# After making SDK changes:
1. Edit src/ files
2. Bump version in package.json
3. Commit and push to main
4. Tag: git tag v1.0.X && git push origin v1.0.X
5. publish.yml runs automatically: tsc → copy-assets → verify → npm publish
# Consumers pick up new version automatically via ^1.0.X range
```

- `dist/` is in `.gitignore` — generated at publish time by CI
- Consumers use npm alias: `"@gundo/feedback-sdk": "npm:@jplannnou/feedback-sdk@^1.0.3"`
- Each consumer project needs `.npmrc` with `@jplannnou:registry=https://npm.pkg.github.com`
- CI needs `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` for auth

## Known Gotchas

- `html2canvas` must be installed in each consumer frontend (not bundled by SDK)
- `FeedbackToggle` uses `onClick` prop (not `onToggle`)
- GitHub Packages requires auth even for public packages — `.npmrc` + `NODE_AUTH_TOKEN` always needed
- Finance Cloud Build uses `GITHUB_NPM_TOKEN` from Secret Manager (passed as Docker build arg)
- Default branch is `main` (renamed from `master` on 2026-03-18)
