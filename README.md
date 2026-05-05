# EfiChain Full-Stack Prototype

This repository contains both parts of the interim assessment:

- `backend/` - Node.js, Express, MongoDB, Mongoose, JWT auth, REST API.
- `frontend/` - Vite-powered EfiChain frontend consuming the API.

## API Routes

Authentication:

- `POST /register` - create account with `name`, `email`, `password`.
- `POST /login` - authenticate and set a JWT HTTP-only cookie.
- `POST /logout` - clear the auth cookie.
- `GET /profile` - protected profile route.
- `PATCH /profile/avatar` - protected profile picture update.

Crypto:

- `GET /crypto` - all tradable cryptocurrencies.
- `GET /crypto/gainers` - positive 24h changes sorted highest first.
- `GET /crypto/new` - newest listings first.
- `POST /crypto` - protected route to add a cryptocurrency.

The assignment text labels register/login/profile as `GET` pages, but the backend uses REST-safe methods for actions that create sessions or accounts. The frontend provides the visible register, login, and profile pages.

## Clone And Setup

1. Clone the repository:

```bash
git clone https://github.com/Abigail-Asiedu-Efi/dcit323-IA-11230782.git
cd dcit323-IA-11230782
```

On Windows, run the same commands in PowerShell or Windows Terminal. If `pnpm` is not available yet, enable it with `corepack enable` after installing Node.js.

1. Install dependencies for both apps:

```bash
cd backend
pnpm install

cd ../frontend
pnpm install
```

1. Configure the backend environment:

```bash
cp backend/.env.example backend/.env
```

If you are using PowerShell on Windows, use this command instead:

```powershell
Copy-Item backend/.env.example backend/.env
```

1. Set the required environment values in `backend/.env`, especially `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL`.

## Run Locally

1. Start MongoDB locally or create a MongoDB Atlas database.
2. Install and start the backend:

```bash
cd backend
pnpm seed
pnpm dev
```

1. In another terminal, start the frontend:

```bash
cd frontend
pnpm dev
```

1. Open the Vite URL, normally `http://localhost:5173`.

On Windows, you can use PowerShell commands such as `Set-Location backend` and `Set-Location frontend` instead of `cd` if you prefer.

## Deployment Notes

Backend on Render:

- Root directory: `backend`
- Build command: `corepack enable && pnpm install --frozen-lockfile`
- Start command: `pnpm start`
- Required environment variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`

Frontend on Netlify/Vercel/Render static site:

- Root directory: `frontend`
- Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm build`
- Publish directory: `frontend/dist`
- Environment variable: `VITE_API_URL=https://your-render-api-url`

After deploying the frontend, update the backend `CLIENT_URL` to match the deployed frontend origin so cookies and CORS work.
