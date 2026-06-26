# glibc base (Debian bookworm-slim) — NOT alpine/musl. The server-side PDF route
# (report/pdf) uses @sparticuz/chromium whose bundled Chromium binary requires
# glibc and will NOT launch on Alpine. Using a glibc base for ALL stages also
# avoids any musl→glibc mismatch for native modules traced into .next/standalone.
FROM node:22-bookworm-slim AS base

# Install pnpm — pin to version that generated pnpm-lock.yaml.
# pnpm 11.x requires Node 22+; we use Node 22 here for forward compatibility
# but keep pnpm pinned to 10.x for lockfile determinism.
RUN corepack enable && corepack prepare pnpm@10.33.1 --activate
ENV COREPACK_INTEGRITY_KEYS=0

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Production Dependencies ----
FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# ---- Build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* eru INLINE-uð á BUILD-tíma. .env.local er dockerignore-að og
# Dokploy byggir í hreinu umhverfi, svo án þessara build-args bakast þau inn TÓM
# á beton.is (þá detta dashboard-leiðir á tóma Supabase-stillingu). Settu þessi
# sem BUILD ARGS í Dokploy (ekki bara runtime env). admin.beton.is (Vercel)
# fær sín gildi sjálfkrafa og er óbreytt. service.ts deriveUrlFromKey og
# (dashboard)/layout.tsx force-dynamic eru áfram til staðar sem öryggisnet.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- Production ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install the distro Chromium for the server-side PDF route. The @sparticuz
# Chromium binary's executablePath() extracts via tar-fs, which does NOT trace
# into the pnpm .next/standalone output (ERR_MODULE_NOT_FOUND: tar-fs). So on
# Docker we use the apt Chromium directly (pulls all its own shared libs) and
# point the route at it via PUPPETEER_EXECUTABLE_PATH. Vercel keeps using the
# @sparticuz binary (PUPPETEER_EXECUTABLE_PATH is unset there).
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      fonts-liberation \
      ghostscript \
  && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# Ghostscript path for report-PDF compression (render-pdf.ts). Chromium embeds
# photos at ~1MB each → a 100-photo report is ~100MB, over Supabase Storage's
# upload limit. gs downsamples images to 150 DPI (plenty for print) → ~2MB.
ENV GHOSTSCRIPT_PATH=/usr/bin/gs

# Non-root user (groupadd/useradd from passwd — always present on Debian, unlike
# Alpine's addgroup/adduser). Home dir so Chromium has a writable profile/cache.
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs --create-home --home-dir /home/nextjs nextjs

COPY --from=builder /app/public ./public

# Standalone output (includes the traced chromium.br ~62MB via
# outputFileTracingIncludes in next.config.ts).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# The Next standalone trace keeps some pnpm packages under node_modules/.pnpm
# without every top-level symlink that Node's external loader expects. Copy the
# production install over the standalone node_modules so dynamic server imports
# such as puppeteer-core resolve in the isolated Docker image.
RUN rm -rf node_modules
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
