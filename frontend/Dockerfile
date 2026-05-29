# 🎯 Update ONLY Stage 1 of your frontend/Dockerfile:
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# 🚀 ACCEPT THE BUILD ARGUMENT & INJECT INTO ENVIRONMENT
ARG VITE_API_URL
ENV VITE_API_URL=http://localhost:5000/api

RUN npm run build

# ─── STAGE 2 ───
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]