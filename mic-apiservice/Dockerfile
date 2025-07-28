# Construction stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Final stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY package*.json ./

RUN npm ci --only=production

ENV API_PORT=3000

EXPOSE 3000
CMD ["npm", "start"]