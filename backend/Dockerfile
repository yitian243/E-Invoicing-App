# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
# COPY .env ./
# Install all dependencies
RUN npm ci

# Copy source files
COPY src ./src
COPY *.ts ./

# Build TypeScript (typecheck and convert .ts to .js)
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine AS production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/.env ./

# Environment
EXPOSE 5000

# Use shell form to expand env vars
CMD ["node", "dist/server.js"]
# CMD ["npm", "start"]
