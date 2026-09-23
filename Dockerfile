FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY mobile/package.json mobile/package.json
RUN npm ci --workspaces=false

FROM dependencies AS build
COPY . .
ARG NEXT_PUBLIC_URL_LINK_SHARE
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000 DIRECTORY_UPLOADS=/app/uploads
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/scripts/start-mobile-backend.mjs /app/scripts/mobile-cleanup-worker.mjs ./scripts/
COPY --from=build --chown=node:node /app/scripts/migrate-mobile-family.mjs ./scripts/
COPY --from=build --chown=node:node /app/scripts/migrate-mobile-upload.mjs ./scripts/
COPY --from=build --chown=node:node /app/scripts/migrate-mobile-management.mjs ./scripts/
COPY --from=build --chown=node:node /app/database/mobile-test-family.sql ./database/
COPY --from=build --chown=node:node /app/database/mobile-test-upload.sql ./database/
COPY --from=build --chown=node:node /app/database/mobile-test-study-delete.sql /app/database/mobile-test-study-analysis.sql ./database/
COPY --from=build --chown=node:node /app/src/mobile-server ./src/mobile-server/
RUN mkdir -p /app/uploads && chown node:node /app/uploads
VOLUME ["/app/uploads"]
USER node
EXPOSE 3000
CMD ["node", "scripts/start-mobile-backend.mjs"]
