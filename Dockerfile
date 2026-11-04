# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm install --production --legacy-peer-deps

COPY --from=builder /app/dist ./dist
COPY server.js ./

EXPOSE 8080

ENV PORT=8080

CMD ["node", "server.js"]
