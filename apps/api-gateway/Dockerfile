# apps/api-gateway/Dockerfile
FROM node:24-alpine

WORKDIR /app

# 1. Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig*.json ./

# 2. Install dependencies
RUN npm ci

# 3. Copy the API Gateway app source
COPY apps/api-gateway ./apps/api-gateway

# 4. Build the app
RUN npx nx sync
RUN npx nx build api-gateway

# 5. Expose port
EXPOSE 7000

# 6. Start the app
CMD ["npx", "nx", "serve", "api-gateway"]