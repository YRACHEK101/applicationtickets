# src/Dockerfile
FROM node:18 AS builder
WORKDIR /app

# Install shared dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy frontend source files
COPY vite.config.ts .
COPY tsconfig*.json .
COPY tailwind.config.js .
COPY postcss.config.js .
COPY index.html .
COPY src ./src

# Build the application
RUN npm run build

# ---- PRODUCTION STAGE ----
FROM node:18-alpine
WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Serve the application
CMD ["serve", "-s", "dist", "-l", "3000"]
