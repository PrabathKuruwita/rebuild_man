# Build stage
FROM node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm ci --legacy-peer-deps || npm ci --legacy-peer-deps || npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Create .env.local
RUN echo "NEXT_PUBLIC_API_URL=/api" > .env.local

# Define build arguments for Next.js build
ARG BACKEND_URL=http://backend:8000
ENV BACKEND_URL=$BACKEND_URL

# Build the Next.js app
RUN npm run build

# Keep build-only packages out of the production image and its vulnerability scan
RUN npm prune --omit=dev

# Production stage
FROM node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914

WORKDIR /app

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env.local ./.env.local
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Start the app
CMD ["npm", "run", "start"]
