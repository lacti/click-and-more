FROM node:12-alpine AS builder

WORKDIR /tmp/
COPY package.json yarn.lock /tmp/
RUN yarn

ENV NODE_ENV "production"
ENV REACT_APP_LOCAL "1"
ENV REACT_APP_AUTH_URL ""
ENV REACT_APP_LOBBY_URL ""
ENV REACT_APP_GAME_APPLICATION_ID "abc"

COPY . /tmp/
RUN yarn build

FROM nginx

COPY --from=builder /tmp/build /usr/share/nginx/html

