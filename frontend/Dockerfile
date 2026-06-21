# Build stage
FROM node:22-alpine AS builder

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
ARG BACKEND_URL
ENV BACKEND_URL=$BACKEND_URL

# Build the Next.js app
RUN npm run build

# Production stage
FROM node:22-alpine

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
