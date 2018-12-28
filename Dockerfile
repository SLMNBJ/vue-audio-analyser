FROM node:8.10.0-alpine
RUN apk update && apk add ffmpeg && rm -rf /var/cache/apk/*

WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
EXPOSE 3000
CMD node index.js