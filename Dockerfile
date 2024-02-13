ARG NPM_VERSION="10.2.4"

FROM node:20-alpine

WORKDIR /app

# See .dockerignore for exclusions
COPY . .

RUN npm i -g npm@${NPM_VERSION}
RUN npm ci --omit dev

EXPOSE 8000
ENV NODE_ENV="production"
ENV PORT="8000"
USER node

CMD ["node", "server.js"]
