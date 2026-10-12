FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lockb ./

# Dependencies
RUN bun install --frozen-lockfile

COPY . .

# Build Vite application
RUN bun run build

ENV VITE_APP_ENV="production"

EXPOSE 5173

CMD ["bun", "start"]