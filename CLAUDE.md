# @gundo/feedback-sdk

Shared React component library and hooks for the GUNDO Feedback Hub. Provides click-anywhere feedback capture, review mode, dashboards, and comment threads across all GUNDO projects.

## Architecture

**No build step** — consumers import TypeScript source directly via pnpm `file:` protocol (same pattern as `@gundo/ui`).

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

- **No build step**: Export TypeScript source directly — consumers transpile
- **`erasableSyntaxOnly`**: Do NOT use TypeScript parameter properties (`constructor(private x: string)`). Use explicit field declarations instead.
- **CSS**: Use `var(--ui-*)` tokens with fallback values for standalone usage
- **Exports**: Everything must be exported from `src/index.ts`
- **pnpm `file:` protocol**: Creates copies, not symlinks. Consumers must run `pnpm install` after SDK changes.

## Known Gotchas

- `html2canvas` must be installed in each consumer frontend (not bundled by SDK)
- Finance Dockerfile needs `COPY gundo-feedback-sdk/ /gundo-feedback-sdk/` (and `cloudbuild.yaml` clones this repo)
- Engine and JP Assistant Dockerfiles use `--filter backend` so they skip frontend `file:` deps — no Docker changes needed
- This repo is **public** on GitHub (required for Finance Cloud Build to clone it)
- `FeedbackToggle` uses `onClick` prop (not `onToggle`)
