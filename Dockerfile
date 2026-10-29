# ---- build: Vite → static dist/ ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

# Vite bakes VITE_* into the bundle at build time — pass them as
# build args (Dokploy: Build Args), not runtime env.
ARG VITE_WATCH_REGION=IN
ARG VITE_TMDB_KEY=
ARG VITE_SUPABASE_URL=
ARG VITE_SUPABASE_ANON_KEY=
ENV VITE_WATCH_REGION=$VITE_WATCH_REGION \
    VITE_TMDB_KEY=$VITE_TMDB_KEY \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# ---- serve: nginx ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chmod=a+rX /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
