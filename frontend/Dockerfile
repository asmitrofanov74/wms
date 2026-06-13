# ---- Development ----
FROM node:22-alpine AS development
WORKDIR /app
COPY package*.json angular.json tsconfig*.json ./
RUN npm install
COPY . .
EXPOSE 4200

# ---- Build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json angular.json tsconfig*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Production ----
FROM nginx:alpine AS production
COPY --from=build /app/dist/frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
