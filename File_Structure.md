# Bitrot Project File Structure

## 📂 Backend (Python / FastAPI)
backend/
├── 📂 __pycache__/             # Compiled Python files
├── 📂 static/                  # Static assets served by backend
├── 📂 venv/                    # Virtual Environment
├── .env                        # Environment variables (Supabase Keys)
├── cleanup.py                  # Background task for archiving dead images
├── database.py                 # Supabase client connection & queries
├── debug_db.py                 # Script for testing DB connections manually
├── decay.py                    # Core logic for bit-rot / image degradation
├── main.py                     # Main FastAPI application entry point
├── requirements.txt            # Python dependencies
└── utils.py                    # Helper functions (User ID generation, etc.)

## 📂 Frontend (Next.js / TypeScript)
frontend/
├── 📂 .next/                   # Next.js build output
├── 📂 node_modules/            # Node.js dependencies
├── 📂 public/                  # Static public assets
│   ├── file.svg
│   ├── globe.svg
│   ├── image.png
│   ├── knixcs-logo-v2.png      # Custom logo asset
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── 📂 src/
│   ├── 📂 app/                 # App Router (Pages & Layouts)
│   │   ├── 📂 about/
│   │   │   └── page.tsx        # About page
│   │   ├── 📂 archive/
│   │   │   └── page.tsx        # Archive/Graveyard page
│   │   ├── 📂 auth/
│   │   │   ├── 📂 callback/
│   │   │   │   └── route.ts    # Supabase Auth Callback handler
│   │   │   └── 📂 logout/
│   │   │       └── actions.ts  # Server Action for logout
│   │   ├── 📂 decipher/[id]/   # Dynamic Route for Decryption
│   │   │   └── page.tsx        # Decipher Secret Page
│   │   ├── 📂 login/
│   │   │   └── page.tsx        # Login Page
│   │   ├── 📂 profile/
│   │   │   └── page.tsx        # User Profile Page
│   │   ├── globals.css         # Global Styles (Tailwind imports)
│   │   ├── icon.png            # App Favicon
│   │   ├── layout.tsx          # Root Layout (Fonts, Metadata)
│   │   └── page.tsx            # Home Page (Landing)
│   │
│   ├── 📂 components/          # Reusable React Components
│   │   ├── 📂 auth/
│   │   │   └── social-button.tsx
│   │   ├── 📂 ui/
│   │   │   ├── CyberCard.tsx
│   │   │   └── ScanlineOverlay.tsx
│   │   ├── comment-section.tsx
│   │   ├── decay-progress-bar.tsx
│   │   ├── feed-card.tsx
│   │   ├── feed.tsx
│   │   ├── knixcs-logo.tsx
│   │   ├── matrix-rain.tsx
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   └── upload-modal.tsx
│   │
│   ├── 📂 hooks/
│   │   └── useSecretGate.ts    # Custom hook for secret logic
│   │
│   └── 📂 utils/
│       └── 📂 supabase/
│           ├── client.ts       # Supabase Client-side helper
│           └── server.ts       # Supabase Server-side helper
│
├── .env.local                  # Local Environment Variables (API URLs)
├── .gitignore                  # Git ignore rules
├── eslint.config.mjs           # ESLint Configuration
├── middleware.ts               # Next.js Middleware (Auth & CSP Security)
├── next-env.d.ts               # Next.js TypeScript declarations
├── next.config.mjs             # Next.js Configuration (Image Whitelists & Rewrites)
├── package-lock.json           # Dependency lock file
├── package.json                # Project dependencies & scripts
├── postcss.config.mjs          # PostCSS Configuration
├── README.md                   # Project Documentation
├── render.yaml                 # Render Deployment Config (if used)
├── tailwind.config.ts          # Tailwind CSS Configuration
└── tsconfig.json               # TypeScript Configuration