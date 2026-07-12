# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Auto-repair shop management system (Thai-language UI). Two independent npm projects:
- `client/` — React 19 + Vite SPA (admin/employee dashboard for repairs, inventory, vehicles, reports).
- `server/` — Express 5 REST API + a separate background worker that polls a ZKTeco fingerprint device for employee attendance and sends Telegram notifications.

User-facing strings and many code comments are in Thai. Match that when adding messages.

## Commands

Client (`cd client`):
- `npm run dev` — Vite dev server on port 5173 (`host: true`).
- `npm run build` / `npm run preview`
- `npm run lint` — ESLint (flat config in `eslint.config.js`). Prettier + `prettier-plugin-tailwindcss` are configured but there is no format script.

Server (`cd server`):
- `npm run dev` — runs API **and** worker together via `concurrently`.
- `npm run dev:server` — API only (`nodemon server.js`, port 3000).
- `npm run dev:worker` — ZKTeco/attendance worker only (`nodemon worker.js`).
- `npx prisma migrate dev` / `npx prisma generate` — schema changes (MySQL).
- `npx prisma db seed` — runs `prisma/seed.js`.

There is **no test framework** in either project (`npm test` on server intentionally errors).

## Server architecture

Two entry points share one Prisma client (`config/prisma.js`) and DB but run as separate processes:
- `server.js` — HTTP API. Auto-mounts every file in `routes/` under `/api` via `readdirSync`. So a new endpoint = drop a file in `routes/`, no central registration.
- `worker.js` — starts `zkteco/index.js`; long-running, not part of the HTTP server.

Per-domain layering is consistent: `routes/<domain>.js` → `middlewares/auth.js` + `utils/validator.js` → `controllers/<domain>.js` → Prisma. Route files, controllers, and client `api/` files are named 1:1 per domain (repair, inventory, part, service, vehicle, employee, user, attendance, category, cloudinary).

### Error handling convention (important)
- Controllers wrap logic in `try/catch` and call `next(error)`. All errors funnel to `middlewares/error.js`.
- To raise an expected client error, call `createError(statusCode, thaiMessage)` (`utils/createError.js`) — it **throws**, so it must be inside the `try`. The error middleware only echoes the message back to the client when `err.code` is a **number**; anything else becomes a generic 500 (prevents internal leakage). Prisma FK errors `P2003`/`P2014` are mapped to 409.
- `validate(schema)` (`utils/validator.js`) is Zod-based middleware that replaces `req.body` with parsed data and returns `400 { errors: [{field, message}] }` on failure. Attach it in the route, not the controller.

### Auth
- JWT in `Authorization: Bearer <token>` header (not cookies, despite `logout` clearing a cookie). `authCheck` verifies the token and re-checks the user still exists in DB; `adminCheck` requires `role === "ADMIN"`. Requires `JWT_SECRET` env.

### ZKTeco attendance worker (`zkteco/`)
- `index.js` orchestrates: `config.js` (device/telegram/attendance settings, all tunables live here), `device.js` (node-zklib connection), `attendance.js` (employee cache + status resolution + save), `formatter.js`/`telegram.js` (notifications), `time.js` (day-key/range helpers).
- Design principle stated in comments: **DB is the source of truth**, not in-RAM state — on every poll it reconciles the device log against today's `Attendance` rows so it survives network drops and restarts. Scan status (เข้างาน/พักเที่ยง/…) is derived from how many scans already exist in DB for that employee that day; repeat taps within `minScanGapMinutes` are ignored.
- Employees are matched by `zkUserId` (the device user id) → `Employee`. Scans from unknown ids are logged and skipped.
- Env needed: `ZKTECO_DEVICE_IP`, `ZKTECO_DEVICE_PORT`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_IDS`.

## Data model (`server/prisma/schema.prisma`, MySQL)

Core flow: a `Repair` belongs to a `User` (staff), a `Vehicle`, and a `Customer`, and has many `RepairItem`s. A `RepairItem` optionally links to a `Part` (inventory) or a `Service`, or is a free-form `customName`. `Vehicle` = `LicensePlate` (unique plate+province) + `VehicleModel` (unique brand+model). `Part` carries stock fields plus flexible `typeSpecificData`/`compatibleVehicles` JSON columns. `Employee`/`Attendance` are the ZKTeco side and are independent of the repair/user tables. Deletes are mostly `Restrict` (hence the 409 mapping); repair items cascade.

## Client architecture

- Routing in `src/routes/AppRoutes.jsx` (react-router v7). Guard wrappers: `ProtectRouteGuest`, `ProtectRouteUser`, `ProtectRouteAdmin`. Admin pages live under `/admin/*`.
- State: Zustand with `persist` to localStorage. `useAuthStore` holds `{ user, token }` (persist key `auth-store`); the token is read from here and passed explicitly into `api/` calls as a Bearer header.
- API layer: one module per domain in `src/api/`, all hitting `import.meta.env.VITE_API_URL` + `/api/...`. Requires `VITE_API_URL` env.
- UI: Tailwind v4 (via `@tailwindcss/vite`) + shadcn/ui (`components.json`, "new-york" style) in `src/components/ui`. `@` aliases `src/` (configured in both `vite.config.js` and `jsconfig.json`). Forms use react-hook-form + Zod via `@hookform/resolvers`. Toasts via `sonner`.
- Thai font "Athiti"; toast styling set globally in `App.jsx`.
