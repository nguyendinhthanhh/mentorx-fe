# MentorX Frontend

A modern React + TypeScript frontend application for the MentorX platform - connecting mentors with mentees.

## Features

- 🔐 Authentication (Login, Register, 2FA)
- 👤 User Management
- 🎓 Mentor Profiles
- 💼 Job Management
- 📚 Course Management
- 💰 Wallet & Transactions
- 💬 Chat System
- ⭐ Reviews & Ratings

## Tech Stack

- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **React Router** - Routing
- **React Hook Form** - Form Management
- **Zod** - Schema Validation
- **Axios** - HTTP Client
- **Zustand** - State Management
- **React Query** - Data Fetching
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── api/              # API client and endpoints
├── components/       # Reusable components
│   ├── auth/        # Authentication forms
│   ├── user/        # User management forms
│   ├── mentor/      # Mentor profile forms
│   ├── job/         # Job management forms
│   ├── course/      # Course management forms
│   ├── wallet/      # Wallet transaction forms
│   └── ui/          # UI components
├── hooks/           # Custom React hooks
├── layouts/         # Layout components
├── pages/           # Page components
├── store/           # Zustand stores
├── types/           # TypeScript types
├── utils/           # Utility functions
└── main.tsx         # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

See `.env.example` for required environment variables.

## License

MIT
