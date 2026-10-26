FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lockb ./

# Dependencies
RUN bun install --frozen-lockfile

COPY . .

ENV VITE_APP_ENV="production"

# Build Vite application
RUN bun run build


