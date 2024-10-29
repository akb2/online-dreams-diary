FROM node:18-alpine

WORKDIR /var/www/client
COPY ./client/package*.json ./
RUN npm install
COPY ./client .
EXPOSE 4200

CMD ["npm", "run", "start:docker"]