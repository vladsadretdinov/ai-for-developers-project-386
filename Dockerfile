# syntax=docker/dockerfile:1

# --- Этап 1: сборка фронтенда (Angular) ---
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Этап 2: сборка бэкенда (Go) ---
FROM golang:1.22-alpine AS backend
WORKDIR /src
COPY backend/ ./backend/
WORKDIR /src/backend
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /server ./cmd/server

# --- Этап 3: финальный образ ---
FROM alpine:3.20
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

# Бинарь бэкенда и собранная статика фронтенда.
COPY --from=backend /server /app/server
COPY --from=frontend /app/frontend/dist/frontend/browser /app/public

ENV STATIC_DIR=/app/public
ENV PORT=3001
EXPOSE 3001

USER app
CMD ["/app/server"]
