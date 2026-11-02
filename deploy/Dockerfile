FROM node:24.22.1-bookworm-slim@sha256:be8204d4bd327363357f532187b752ff62759c31bedf98e9e18fc08c9cbd605c AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/ ./apps/
COPY packages/ ./packages/
COPY tools/ ./tools/
ARG BUILD_ID
ARG VITE_PUBLIC_WSS_URL
ENV BUILD_ID=$BUILD_ID VITE_PUBLIC_WSS_URL=$VITE_PUBLIC_WSS_URL
RUN npm ci && npm run build

FROM node:24.22.1-bookworm-slim@sha256:be8204d4bd327363357f532187b752ff62759c31bedf98e9e18fc08c9cbd605c
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 CLIENT_DIR=/app/dist/client
COPY --from=build --chown=node:node /app/dist /app/dist
COPY --from=build --chown=node:node /app/node_modules/ws /app/node_modules/ws
USER node
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:8080/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist/server/main.js"]
