# Базовый образ с Alpine Linux
FROM alpine:latest

# Установка необходимых пакетов и зависимостей для сборки Nginx
RUN apk update && \
  apk add --no-cache nginx \
  git \
  build-base \
  pcre-dev \
  zlib-dev \
  openssl-dev

# Клонирование push_stream_module
RUN git clone https://github.com/wandenberg/nginx-push-stream-module.git /tmp/push_stream_module

# Сборка Nginx с модулем push_stream
RUN cd /tmp && \
  wget http://nginx.org/download/nginx-1.21.6.tar.gz && \
  tar -zxvf nginx-1.21.6.tar.gz && \
  cd nginx-1.21.6 && \
  ./configure --add-module=/tmp/push_stream_module && \
  make && \
  make install

# Очистка временных файлов
RUN rm -rf /tmp/nginx-1.21.6* /tmp/push_stream_module

# Копирование конфигурационного файла Nginx
COPY ./nginx-settings/main.settings.conf /usr/local/nginx/conf/nginx.conf

# Указываем порт
EXPOSE 80

# Запуск Nginx в режиме демона
CMD ["/usr/local/nginx/sbin/nginx", "-g", "daemon off;"]