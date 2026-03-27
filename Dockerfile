FROM node:22-slim AS builder
WORKDIR /app

# Copy only the agent package (not wizard)
COPY packages/atlas-agent/package.json packages/atlas-agent/tsconfig.json ./
COPY packages/atlas-agent/src/ src/

# Install dependencies and build
RUN npm install --ignore-scripts && npm run build

FROM node:22-slim
WORKDIR /app

COPY --from=builder /app/dist/ dist/
COPY --from=builder /app/node_modules/ node_modules/
COPY --from=builder /app/package.json ./

RUN mkdir -p /app/sessions

ENV ATLAS_PORT=3001
ENV ATLAS_SESSION_DIR=/app/sessions
ENV NODE_ENV=production

EXPOSE 3001
CMD ["node", "dist/index.js"]
