# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Clean install for production
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build time
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_key

# For Build Prerendering errors
ENV NEXT_DISABLE_LINT=1
ENV NEXT_SKIP_TYPECHECK=1

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build-time argument (Supabase URL)
ARG NEXT_PUBLIC_SUPABASE_STORAGE_URL
ENV NEXT_PUBLIC_SUPABASE_STORAGE_URL=$NEXT_PUBLIC_SUPABASE_STORAGE_URL

RUN echo "NEXT_PUBLIC_API_URL=http://139.59.222.212" > .env.production
RUN npm run build

# Next.js build
RUN npm run build

# Stage 3: Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Only copy necessary files to keep the image small
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]