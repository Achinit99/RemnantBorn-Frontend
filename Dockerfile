# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build time
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_STORAGE_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SUPABASE_STORAGE_URL=$NEXT_PUBLIC_SUPABASE_STORAGE_URL
# -----------------------------------

# For Build Prerendering errors
ENV NEXT_DISABLE_LINT=1
ENV NEXT_SKIP_TYPECHECK=1

# Next.js Static Build 
RUN npm run build

# Stage 3: Runner stage
FROM nginx:alpine AS runner

RUN mkdir -p /usr/share/nginx/html

RUN chmod -R 755 /usr/share/nginx/html

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY --from=builder /app/out .

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]