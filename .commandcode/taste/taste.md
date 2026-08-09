# cloud-services
- Use free tier options only, never select paid/chargeable services. User has explicitly stated no budget for paid services. Confidence: 0.80

# communication
- Prefers communicating in Vietnamese. Confidence: 0.85

# deployment
- Uses Vercel for production deployments (via `npx vercel --prod`). Confidence: 0.70
- Prefers deploying the `main` branch to production rather than feature branches. Confidence: 0.65
- Prefers automated CI/CD workflows — values Git-push-triggered deployment over manual CLI-triggered deployment when available. Confidence: 0.70
- After updating any `VITE_`-prefixed environment variable on Vercel, a redeploy is mandatory (not optional) because these variables are embedded into the bundle at build time. Confidence: 0.85

# documentation
- Maintains feature specification documents in the project's `docs/` directory (e.g., `ADMIN_DASHBOARD.md`) and expects them to be treated as authoritative implementation requirements alongside any visual/design references. Confidence: 0.65

# browser
- Prefer Chrome for browser automation. User may suggest Edge for pre-saved accounts, but Chrome is the reliable default. Confidence: 0.60
- Keep browser windows open after completing tasks. Do not close the browser window automatically when finished. Confidence: 0.70
