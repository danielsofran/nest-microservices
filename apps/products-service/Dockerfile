# apps/products-service/Dockerfile
FROM node:24-alpine

WORKDIR /app

# 1. Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig*.json ./

# 2. Install dependencies
RUN npm ci

# 3. Copy the API Gateway app source
COPY apps/products-service ./apps/products-service

# 4. Build the app
RUN npx nx sync
RUN npx nx build products-service

# 5. Start the app
CMD ["npx", "nx", "serve", "products-service"]