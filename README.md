# Mentor X Frontend

Mentor X Frontend is the React application for a multi-role mentor marketplace where users can discover mentors, post support requests, compare proposals, pay through wallet and escrow flows, and continue delivery inside a shared workspace.

This repository is designed as a real product client, not a landing page demo or a generic admin template.

## Overview

Mentor X separates the product into four practical surfaces:

- `Public marketplace` for browsing mentors, jobs, and courses
- `User workspace` for managing jobs, proposals received, wallet activity, purchases, and profile settings
- `MentorHub` for managing profile setup, proposals, contracts, courses, schedule, earnings, and messages
- `AdminHub` for moderation, mentor verification, support, reports, and operational controls

## Why This Project Is Strong Portfolio Material

- It handles real multi-role application structure rather than a single dashboard flow
- It includes complex product states such as proposal negotiation, contract readiness, wallet balance, escrow, and messaging
- It uses typed API integration against a non-trivial backend
- It supports both legacy local uploads and new Cloudinary-hosted media URLs
- It has been iterated for responsive behavior on dense operational screens, not just marketing pages

## Product Capabilities

- Authentication and onboarding
- Mentor discovery and public profile browsing
- Job posting and job marketplace browsing
- Proposal review and negotiation support
- Wallet, payment-return, and escrow-aware UI states
- Chat and contextual collaboration flows
- Mentor profile setup, portfolio, availability, and course management
- Admin review and moderation workflows

## Frontend Architecture

```text
src/
  api/           typed API clients and request wrappers
  components/    reusable UI and workflow modules
  layouts/       app shells for public, user, mentor, and admin areas
  pages/         route-level orchestration
  store/         client state and auth state
  types/         shared request and response contracts
  utils/         formatting, media, and helper utilities
```

Key implementation choices:

- API calls are centralized in `src/api`
- Server state is managed with `react-query`
- Client auth and session state are managed with `zustand`
- Forms use `react-hook-form` with `zod` validation
- Layout boundaries are explicit across marketplace, workspace, mentor, and admin areas

## Tech Stack

- `React 18`
- `TypeScript`
- `Vite`
- `React Router`
- `React Query`
- `Zustand`
- `React Hook Form`
- `Zod`
- `Axios`
- `Tailwind CSS`
- `Lucide React`
- `Radix UI`

## UI / Engineering Focus

This frontend emphasizes product usability over decorative UI:

- dense but readable workspace layouts
- clear state handling for contracts, negotiation, and payments
- responsive behavior for mobile and laptop workflows
- role-aware navigation and route protection
- practical handling of uploaded media and file URLs

## Local Development

### Prerequisites

- `Node.js 18+`
- `npm`
- Backend API running locally or accessible through the configured base URL

### Environment Setup

Create a local environment file:

```bash
cp .env.example .env
```

Example variables:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=MentorX
VITE_GOOGLE_CLIENT_ID=google-client-id
VITE_GITHUB_CLIENT_ID=github-client-id
```

### Run the App

```bash
npm install
npm run dev
```

Default local URL:

- `http://localhost:3000`

## Scripts

- `npm run dev` starts the local development server
- `npm run build` builds the production bundle
- `npm run preview` previews the production build locally
- `npm run lint` runs ESLint

## Build

```bash
npm run build
```

## Representative Technical Work

- Multi-layout SPA with route segmentation by product role
- Wallet and payment return flows integrated into workspace UX
- Media URL normalization for absolute Cloudinary URLs and legacy `/uploads/...` paths
- Responsive rework across jobs, mentor, wallet, chat, and admin screens
- Marketplace pages that preserve operational clarity instead of collapsing into generic SaaS patterns

## Recruiter Notes

If you are reviewing this repository as hiring signal, the strongest parts are:

- product-oriented frontend architecture
- handling of real business workflows beyond CRUD
- integration discipline between UI, auth, routing, and API layers
- practical attention to responsive detail in complex screens
- separation between public marketplace, customer workspace, mentor workspace, and admin operations

## Related Repository

- Backend API: [mentorx-be](https://github.com/nguyendinhthanhh/mentorx-be)
