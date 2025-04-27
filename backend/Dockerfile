# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

# Copy source files
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app

# Copy package files and install ALL dependencies
# This ensures all required packages are available
COPY package.json package-lock.json ./
RUN npm ci

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# # Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Environment
EXPOSE 5000

# Use entrypoint script to create .env file at runtime
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
