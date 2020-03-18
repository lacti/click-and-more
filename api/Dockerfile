FROM node:12-alpine

WORKDIR /opt
COPY package.json yarn.lock /opt/
RUN yarn

COPY . /opt/

ENV STAGE "local"
ENV REDIS_HOST "localhost"
ENV REDIS_PASSWORD ""
ENV WS_ENDPOINT "http://localhost:3001"

CMD yarn start:docker
