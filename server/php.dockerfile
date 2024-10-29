FROM php:8.2-fpm-alpine

RUN docker-php-ext-install pdo pdo_mysql

COPY ./server/php.ini /usr/local/etc/php/php.ini
COPY ./server/fill-tables/ /var/www/server/fill-tables/
COPY ./api/ /var/www/api/
COPY ./api/Config/secretDatas.dev.json /var/www/api/Config/secretDatas.json

WORKDIR /var/www/api