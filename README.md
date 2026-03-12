# Markdown CMS

A private, self-hosted Markdown file manager built with Next.js, PostgreSQL, and Prisma. Create, edit, organize, and preview Markdown documents with a clean split-view editor.

## Features

- **Secure Authentication** — JWT-based login with httpOnly cookies; no public signup
- **Full CRUD** — Create, read, update, and delete Markdown documents
- **Live Preview** — Split-view editor with real-time Markdown rendering (GFM + syntax highlighting)
- **Search** — Full-text search across titles and content
- **Dark Mode** — System-aware with manual toggle
- **Responsive** — Works on desktop and mobile with collapsible sidebar
- **Keyboard Shortcuts** — `Ctrl/Cmd + S` to save

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL + Prisma 7
- **Auth:** JWT (jose) + bcrypt + httpOnly cookies
- **Styling:** Tailwind CSS 4
- **Markdown:** react-markdown + remark-gfm + rehype-highlight

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL running locally or remotely

### 1. Install dependencies

```bash
cd markdown-cms
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/markdown_cms?schema=public"
JWT_SECRET="your-secret-key-here"
```

### 3. Create the database

```bash
createdb markdown_cms
```

### 4. Set up the schema and seed data

```bash
npm run setup
```

This runs Prisma generate, pushes the schema to your database, and seeds a default user.

**Default credentials:**
- Email: `admin@example.com`
- Password: `password123`

You can customize these with `SEED_EMAIL` and `SEED_PASSWORD` env vars before running the seed.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run setup` | Generate client + push schema + seed |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
markdown-cms/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts             # Seed script
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   └── me/route.ts
│   │   │   └── files/
│   │   │       ├── route.ts        # GET (list), POST (create)
│   │   │       └── [id]/route.ts   # GET, PUT, DELETE
│   │   ├── dashboard/page.tsx
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── confirm-dialog.tsx
│   │   ├── icons.tsx
│   │   ├── markdown-preview.tsx
│   │   └── theme-provider.tsx
│   ├── lib/
│   │   ├── api.ts          # Response helpers + auth middleware
│   │   ├── auth.ts         # JWT sign/verify + cookie mgmt
│   │   ├── db.ts           # Prisma client singleton
│   │   └── slug.ts         # Slug generation
│   ├── generated/prisma/   # Generated Prisma client (gitignored)
│   └── middleware.ts        # Route protection
├── .env.example
├── prisma.config.ts
└── package.json
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email + password |
| POST | `/api/auth/logout` | Clear auth cookie |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/files` | List files (supports `?search=`) |
| POST | `/api/files` | Create new file |
| GET | `/api/files/:id` | Get single file |
| PUT | `/api/files/:id` | Update file |
| DELETE | `/api/files/:id` | Delete file |

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT stored in httpOnly, sameSite cookies
- All `/dashboard` and `/api/files` routes protected by middleware
- Server-side input validation on all API endpoints
- SQL injection prevented by Prisma ORM
