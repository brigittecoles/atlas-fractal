FROM node:22-slim AS builder
WORKDIR /app
COPY package.json tsconfig.json ./
COPY src/ src/
RUN npm install && npm run build

FROM node:22-slim
WORKDIR /app
COPY --from=builder /app/dist/ dist/
COPY --from=builder /app/node_modules/ node_modules/
COPY package.json ./
RUN mkdir -p /app/sessions
ENV ATLAS_PORT=3001
ENV ATLAS_SESSION_DIR=/app/sessions
EXPOSE 3001
CMD ["node", "dist/index.js"]
