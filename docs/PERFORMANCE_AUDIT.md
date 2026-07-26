# Mentor X Performance Audit

Last verified: 2026-07-26

## Scope And Method

This audit covers production bundle output, public route smoke tests, frontend
request/render patterns, high-traffic backend queries, local API latency, and
responsive behavior. Measurements were taken against a local PostgreSQL,
Spring Boot API, and Vite production preview. They are comparative engineering
baselines, not production Web Vitals.

## Prioritized Findings

### Critical

- `src/App.tsx` statically imported every layout and page. Vite emitted one
  2,609,270-byte JavaScript bundle (678.89 kB gzip), so every user downloaded
  admin, mentor, chat, chart, editor, and payment code on first load.

### High

- Session bootstrap returned `null`, producing a blank screen while refresh
  authentication completed.
- Concurrent 401 responses each started an independent refresh-token request.
- Course dashboard statistics executed one course query plus seven aggregate
  queries per course, including a duplicate enrollment count and an unused
  average-progress query.
- Chat room listing fetched members with an entity graph, then queried members
  again once per room while mapping the response.

### Medium

- Article progress tracking measured layout on every scroll event.
- Repeated card images decoded eagerly below the viewport.
- The desktop login hero was a 792,068-byte PNG.
- Development logging printed SQL and bind values by default.
- Two separate Google Fonts stylesheet requests loaded the product fonts.
- `/grid-pattern.svg` was referenced but missing.

## Implemented Changes

- All route layouts and pages now use route-level `React.lazy` chunks. The AI
  assistant is loaded only for authenticated sessions.
- Auth and route loading use an accessible, reduced-motion-aware skeleton.
- Refresh-token recovery is single-flight and retries each original request
  with the shared new access token.
- Course lesson scroll tracking is coalesced with `requestAnimationFrame`.
- Below-fold list/card images use lazy loading and asynchronous decoding.
- The login hero is an 183,143-byte JPEG with explicit dimensions and high
  fetch priority; unused PNG output was removed.
- Backend course stats use three batch aggregates for enrollment/revenue,
  lesson views, and ratings. Total query count is fixed at four including the
  course lookup.
- Chat response mapping reuses members already fetched by `@EntityGraph`.
- Dev SQL and bind logging is off by default and can be re-enabled with
  `JPA_SHOW_SQL`, `HIBERNATE_SQL_LOG_LEVEL`, and
  `HIBERNATE_BIND_LOG_LEVEL`.
- Font stylesheets were consolidated and the missing grid SVG was added.

## Before And After

| Metric | Before | After | Change |
| --- | ---: | ---: | ---: |
| Initial JS, minified | 2,609,270 B | 400,670 B | -84.6% |
| Initial JS, gzip | 678.89 kB | 125.82 kB | -81.5% |
| Main CSS, minified | 236,889 B | 237,160 B | +0.1% |
| Login hero | 792,068 B | 183,143 B | -76.9% |
| Course stats queries | `1 + 7N` | `4` | Constant |
| Chat room member queries | `1 + N` | `1` | Constant |

Local list APIs were already fast enough that speculative backend caching was
not added: sampled endpoints returned in roughly 9-91 ms. React Query already
disabled focus refetching, and search pages already debounce input or filter
cached data, so those areas were left unchanged.

## Verification

- Frontend: `npm run lint -- --quiet`
- Frontend: `npm run build`
- Backend: `mvnw.cmd -q -Dtest=CourseStatsServiceImplTest test`
- Backend: `mvnw.cmd -q -DskipTests compile`
- Production smoke: `/`, `/login`, and `/courses` at 1440 px and 390 px.
- Smoke result: no horizontal overflow, broken images, or console errors.

## Remaining Work

- Collect LCP, INP, CLS, route transition, and request-waterfall metrics in a
  deployed environment with Lighthouse CI or browser RUM. The local browser
  harness did not expose reliable Navigation Timing data.
- The initial CSS remains about 237 KB minified. Audit Tailwind content and
  legacy global styles before pruning; do not remove classes without route
  coverage.
- The build emits many small shared icon chunks. Measure HTTP/2 request
  overhead in deployment before grouping them into a vendor chunk.
- The shared API response normalizer recursively traverses response objects.
  It is tracked as architecture finding `ARCH-001`; replace it with typed API
  adapters rather than another heuristic optimization.
- Existing lint debt remains (warnings, no errors). Address hook dependency
  warnings by feature with regression tests instead of applying bulk memoization.
- The scheduled earnings aggregation still performs per-course view/rating
  queries. It is off the interactive request path but should reuse the new
  batch aggregates in a separate tested change.
