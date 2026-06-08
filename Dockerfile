# ==========================================
# 🐳 Step 1: Build Stage
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configs
COPY package.json package-lock.json ./
# Clean install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build argument to inject VITE_API_URL during image building
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build client distribution folder
RUN npm run build

# ==========================================
# 🐳 Step 2: Web Server Stage (Nginx)
# ==========================================
FROM nginx:alpine

# Copy custom Nginx configuration to support SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
