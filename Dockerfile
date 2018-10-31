FROM node:8-alpine
WORKDIR /usr/src/omnium
COPY package*.json yarn.lock ./
RUN apk --no-cache --virtual build-dependencies add \
  python \
  make \
  g++ \
  && yarn --frozen-lockfile \
  && apk del build-dependencies
COPY . .
CMD [ "yarn", "start" ]
