FROM node:24.5.0-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/domain/package.json packages/domain/package.json
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts

RUN addgroup -S -g 10001 gestorconta \
  && adduser -S -D -H -u 10001 -G gestorconta gestorconta \
  && mkdir -p /app/apps/api/data/uploads/rut \
  && chown -R gestorconta:gestorconta /app \
  && chmod 750 /app/apps/api/data/uploads /app/apps/api/data/uploads/rut
USER gestorconta

EXPOSE 3000 4000
CMD ["npm", "run", "start:api"]
