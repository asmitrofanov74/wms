# ---- Development ----
FROM node:22-alpine AS development
WORKDIR /app
COPY package*.json tsconfig*.json nest-cli.json ./
RUN npm install
COPY . .
EXPOSE 3000

# ---- Build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json tsconfig*.json nest-cli.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Production ----
FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
