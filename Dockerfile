# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies for build
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage - MINIMAL
FROM node:18-alpine

# Install required system dependencies
RUN apk add --no-cache \
    postgresql-client \
    tzdata \
    curl \
    dumb-init

# Set timezone to Iran
ENV TZ=Asia/Tehran
RUN cp /usr/share/zoneinfo/Asia/Tehran /etc/localtime

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies in final image
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder (dist only, no node_modules)
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/attached_assets ./attached_assets
COPY --from=builder --chown=nodejs:nodejs /app/client/public ./client/public

# Create necessary directories (volumes will be mounted over these at runtime)
RUN mkdir -p uploads logs recordings transcripts api/audio && \
    chown -R nodejs:nodejs uploads logs recordings transcripts api

# Switch to nodejs user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]