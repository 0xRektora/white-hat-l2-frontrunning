FROM node:alpine
WORKDIR /app
COPY --chown=node:node tsconfig.json tsconfig.json
COPY --chown=node:node package.json package.json
COPY --chown=node:node yarn.lock yarn.lock
COPY --chown=node:node rescue.ts rescue.ts
COPY --chown=node:node .env .env
RUN yarn
USER node
ENTRYPOINT ["npx", "ts-node", "-T", "rescue.ts"]