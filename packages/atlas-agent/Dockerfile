FROM node:22-slim AS builder
WORKDIR /app

COPY package.json tsconfig.json ./
COPY src/ src/

# CRITICAL: --include=dev ensures typescript is installed for tsc build
# Railway sets NODE_ENV=production which skips devDependencies by default
RUN npm install --include=dev && npm run build

FROM node:22-slim
WORKDIR /app

COPY --from=builder /app/dist/ dist/
COPY --from=builder /app/node_modules/ node_modules/
COPY --from=builder /app/package.json ./

RUN mkdir -p /app/sessions

# Railway injects PORT dynamically — server.ts reads PORT first, then ATLAS_PORT
ENV ATLAS_SESSION_DIR=/app/sessions
ENV NODE_ENV=production

EXPOSE 3001
CMD ["node", "dist/index.js"]
