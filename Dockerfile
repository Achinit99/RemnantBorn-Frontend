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
ENV NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_key

ENV NEXT_PUBLIC_API_URL=/api

# For Build Prerendering errors
ENV NEXT_DISABLE_LINT=1
ENV NEXT_SKIP_TYPECHECK=1

# Supabase Storage URL 
ARG NEXT_PUBLIC_SUPABASE_STORAGE_URL
ENV NEXT_PUBLIC_SUPABASE_STORAGE_URL=$NEXT_PUBLIC_SUPABASE_STORAGE_URL

# Next.js Static Build 
RUN npm run build

# Stage 3: Runner stage
FROM nginx:alpine

# Nginx default directory 
WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY --from=builder /app/out/ ./

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]