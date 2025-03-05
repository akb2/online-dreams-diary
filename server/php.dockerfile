FROM php:8.2-fpm-alpine

RUN apk add --no-cache libpng-dev libjpeg-turbo-dev freetype-dev
RUN docker-php-ext-configure gd --with-freetype --with-jpeg && docker-php-ext-install gd pdo pdo_mysql

COPY ./server/php.ini /usr/local/etc/php/php.ini
COPY ./server/browscap.ini /usr/local/etc/php/browscap.ini
COPY ./server/fill-tables/ /var/www/server/fill-tables/
COPY ./api/ /var/www/api/
COPY ./media/ /var/www/media/
COPY ./api/Config/secretDatas.dev.json /var/www/api/Config/secretDatas.json

RUN chown www-data:www-data /var/www/media/

WORKDIR /var/www/api