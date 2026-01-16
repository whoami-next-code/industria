FROM node:20-alpine AS builder
WORKDIR /app

# Build context esperado: raíz del repo
COPY backend/package*.json ./
RUN npm ci

COPY backend/nest-cli.json backend/tsconfig*.json ./
COPY backend/src ./src
COPY backend/public ./public

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
EXPOSE 3001

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

USER node
CMD ["node", "dist/src/main.js"]