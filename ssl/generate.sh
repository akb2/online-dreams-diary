#!/bin/bash

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
GRAY="\033[0;90m"
CLEAR="\033[0m"

SUCCESS_LABEL="${GREEN}[+]${CLEAR}"
ERROR_LABEL="${RED}[-]${CLEAR}"
POINT_LABEL="${YELLOW}[*]${CLEAR}"

# =======================
# Параметры скрипта
# =======================
ABSOLUTE_DIR=$(cd "$(dirname "$0")" && pwd)/
# Настройки
CERT_NAME="Online Dreams Diary Development Server"
SSL_DIR=""
ANDROID_ASSETS_DIR="${ABSOLUTE_DIR}../client-android/app/src/main/res/raw/"
ANDROID_CERT_FILE="${ANDROID_ASSETS_DIR}localhost.crt"
CERT_KEY_FILE="${ABSOLUTE_DIR}${SSL_DIR}localhost.key"
CERT_CRT_FILE="${ABSOLUTE_DIR}${SSL_DIR}localhost.crt"
OPENSSL_CONFIG_FILE="${ABSOLUTE_DIR}${SSL_DIR}/openssl.cnf"
CERT_VALIDITY_DAYS=365
PROMPT_TIMEOUT=20
KEYCHAIN_PATH=/Library/Keychains/System.keychain

# =======================
# Функции
# =======================

# Определение локального IP-адреса
get_local_ip() {
  if command -v ip &> /dev/null; then
    ip -4 addr show | awk '/inet / && $2 !~ /^127\./ {print $2}' | cut -d/ -f1 | grep -E '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))' | head -n 1
  elif command -v ifconfig &> /dev/null; then
    ifconfig | awk '/inet / && $2 != "127.0.0.1" {print $2}' | grep -E '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))' | head -n 1
  else
    echo -e "${ERROR_LABEL} Невозможно определить локальный IP-адрес. Убедитесь, что утилиты ip или ifconfig установлены"
    exit 1
  fi
}

# Удаление сертификатов
update_or_create_cert() {
  echo -e "${POINT_LABEL} Проверка существующего сертификата ${CYAN}${CERT_NAME}${CLEAR} в ${CYAN}Keychain${CLEAR}"
  EXISTING_CERT=$(sudo security find-certificate -a -c "$CERT_NAME" -p $KEYCHAIN_PATH 2>/dev/null)

  if [ -n "$EXISTING_CERT" ]; then
    echo -e "${POINT_LABEL} Удаление существующего сертификата"
    sudo security delete-certificate -c "$CERT_NAME" $KEYCHAIN_PATH
  fi

  echo -e "${POINT_LABEL} Добавление нового сертификата"
  sudo security add-trusted-cert -d -r trustRoot -k $KEYCHAIN_PATH "$CERT_CRT_FILE" &> /dev/null
  echo -e "${SUCCESS_LABEL} Сертификат ${CYAN}${CERT_NAME}${CLEAR} успешно установлен"
}

# Создание конфигурационного файла OpenSSL
create_config() {
  local config_path=$1
  local local_ip=$2

  cat > "$config_path" <<EOL
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_ca
prompt = no

[req_distinguished_name]
CN = $CERT_NAME

[v3_ca]
keyUsage = critical, digitalSignature, keyEncipherment, keyCertSign
extendedKeyUsage = serverAuth
basicConstraints = critical, CA:true
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = bs-local.com
IP.1 = 127.0.0.1
IP.2 = 10.0.2.2
IP.3 = $local_ip
EOL
}

# Проверка сертификата
check_cert() {
  sudo security find-certificate -a -c "$CERT_NAME" -p &> /dev/null

  if [ $? -eq 0 ]; then
    echo -e "${SUCCESS_LABEL} Сертификат установлен и доверен"
  else
    echo -e "${ERROR_LABEL} Не удалось сделать сертификат доверенным"
    exit 1
  fi
}

# Скопировать сертификат в папку Android Studio
copy_for_android_studio() {
  mkdir -p "$ANDROID_ASSETS_DIR"
  cp "$CERT_CRT_FILE" "$ANDROID_CERT_FILE"

  # Проверяем код возврата последней команды
  if [ $? -ne 0 ]; then
    echo -e "${ERROR_LABEL} Ошибка при копировании сертификата в проект Android Studio"
    exit 1
  fi

  echo -e "${SUCCESS_LABEL} Сертификат скопирован в проект Android Studio"
}

# =======================
# Основной код
# =======================

clear

# Получение локального IP
LOCAL_IP=$(get_local_ip "$1")

# Удаление старых файлов
rm -rf $CERT_KEY_FILE $CERT_CRT_FILE $OPENSSL_CONFIG_FILE

# Создание конфигурации
mkdir -p "$ABSOLUTE_DIR$SSL_DIR"
chmod 755 "$ABSOLUTE_DIR$SSL_DIR"
create_config "$OPENSSL_CONFIG_FILE" "$LOCAL_IP"

# Генерация сертификата
openssl req -x509 -nodes -days "$CERT_VALIDITY_DAYS" -newkey rsa:2048 \
  -keyout "$CERT_KEY_FILE" \
  -out "$CERT_CRT_FILE" \
  -config "$OPENSSL_CONFIG_FILE" \
  -extensions v3_ca \
  -&> /dev/null

copy_for_android_studio

if [ $? -eq 0 ]; then
  echo -e "${SUCCESS_LABEL} Сертификат успешно создан!"
  echo -e "${SUCCESS_LABEL} Файл ключа: ${YELLOW}${CERT_KEY_FILE}${CLEAR}"
  echo -e "${SUCCESS_LABEL} Сертификат: ${YELLOW}${CERT_CRT_FILE}${CLEAR}"
  echo -e "${SUCCESS_LABEL} Включены адреса:"
  echo -e "    ${GRAY}Локальный хост                         ${BLUE}localhost${CLEAR}"
  echo -e "    ${GRAY}Локальный хост BrowserStack            ${BLUE}bs-local.com${CLEAR}"
  echo -e "    ${GRAY}Локальный IP                           ${BLUE}127.0.0.1${CLEAR}"
  echo -e "    ${GRAY}Локальный IP эмулятора Android Studio  ${BLUE}10.0.2.2${CLEAR}"
  echo -e "    ${GRAY}Внешний IP локальной сети              ${BLUE}${LOCAL_IP}${CLEAR}"

  # Установка или обновление сертификата
  update_or_create_cert

  # Проверка сертификата
  check_cert
else
  echo -e "${ERROR_LABEL} Ошибка при создании сертификата"
  exit 1
fi
