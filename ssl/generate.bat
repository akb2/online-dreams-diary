@echo off
cls
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"

set ClearColor=%ESC%[0m
set GrayColor=%ESC%[90m
set GreenColor=%ESC%[32m
set RedColor=%ESC%[31m
set BlueColor=%ESC%[36m
set YellowColor=%ESC%[33m

set SucLabel=%GreenColor%[+]%ClearColor%
set ErrLabel=%RedColor%[-]%ClearColor%

REM =======================
REM Настройки
REM =======================
setlocal enabledelayedexpansion
set CERT_NAME=Online Dreams Diary Development Server
set SSL_DIR=ssl
set CERT_KEY_FILE=%SSL_DIR%\localhost.key
set CERT_CRT_FILE=%SSL_DIR%\localhost.crt
set OPENSSL_CONFIG_FILE=%SSL_DIR%\openssl.cnf
set CERT_VALIDITY_DAYS=365

REM =======================
REM Проверка прав
REM =======================
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo !ErrLabel! Необходимо запустить скрипт от имени администратора
  exit /b
)

REM Main script starts here
echo !SucLabel! Скрипт запущен от имени администратора

REM =======================
REM Проверка наличия OpenSSL
REM =======================
where openssl >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo !ErrLabel! В переменной PATH не найден OpenSSL
  echo !ErrLabel! Проверьте, что OpenSSL установлен и добавлен в переменную PATH
  exit /b 1
)

REM =======================
REM Detecting local IP
REM =======================
if "%~1"=="" (
  FOR /F "tokens=2 delims=:" %%A IN ('ipconfig ^| findstr /R /C:"IPv4" ^| findstr /C:"192\.168\."') DO (
    set LOCAL_IP=%%A
    set LOCAL_IP=!LOCAL_IP: =!
    goto found_ip
  )
) else (
  set LOCAL_IP=%~1
  echo !SucLabel! Использование введенного IP: !BlueColor!!LOCAL_IP!!ClearColor!
)

:found_ip
if not defined LOCAL_IP (
  echo !ErrLabel! Не удалось определить локальный IP-адрес
  exit /b 1
)
echo !SucLabel! Локальный IP: !BlueColor!!LOCAL_IP!!ClearColor!

REM =======================
REM Main process
REM =======================

REM Delete old files
if exist %CERT_KEY_FILE% del /q %CERT_KEY_FILE%
if exist %CERT_CRT_FILE% del /q %CERT_CRT_FILE%
if exist %OPENSSL_CONFIG_FILE% del /q %OPENSSL_CONFIG_FILE%

REM Create an SSL directory
if not exist %SSL_DIR% mkdir %SSL_DIR%

REM Create an OpenSSL config file
(
  echo [req]
  echo distinguished_name = req_distinguished_name
  echo x509_extensions = v3_ca
  echo prompt = no
  echo.
  echo [req_distinguished_name]
  echo CN = %CERT_NAME%
  echo.
  echo [v3_ca]
  echo keyUsage = critical, digitalSignature, keyEncipherment, keyCertSign
  echo extendedKeyUsage = serverAuth
  echo basicConstraints = critical, CA:true
  echo subjectAltName = @alt_names
  echo.
  echo [alt_names]
  echo DNS.1 = localhost
  echo DNS.2 = bs-local.com
  echo IP.1 = 127.0.0.1
  echo IP.2 = 10.0.2.2
  echo IP.3 = !LOCAL_IP!
) > %OPENSSL_CONFIG_FILE%

REM Generate a certificate
@openssl req -x509 -nodes -days %CERT_VALIDITY_DAYS% -newkey rsa:2048 ^
  -keyout %CERT_KEY_FILE% ^
  -out %CERT_CRT_FILE% ^
  -config %OPENSSL_CONFIG_FILE% ^
  -extensions v3_ca >nul 2>&1

if %ERRORLEVEL% NEQ 0 (
  echo !ErrLabel! Ошибка при создании сертификата
  exit /b 1
)

REM Make the certificate trusted
REM Check if the certificate already exists in the store
certutil -store "Root" | findstr /C:"%CERT_NAME%" >nul
if %ERRORLEVEL% NEQ 0 (
  echo !SucLabel! Добавление сертификата в хранилище доверенных корневых центров сертификации...
  certutil -addstore -f "Root" %CERT_CRT_FILE% >nul 2>&1
  if %ERRORLEVEL% EQU 0 (
    echo !SucLabel! Сертификат успешно добавлен
  ) else (
    echo !ErrLabel! Ошибка при добавлении сертификата. Диагностика ниже:
    certutil -addstore -f "Root" %CERT_CRT_FILE%
    exit /b 1
  )
) else (
  echo !SucLabel! Обновление сертификата в хранилище доверенных корневых центров сертификации...
  certutil -delstore "Root" "%CERT_NAME%" >nul 2>&1
  if %ERRORLEVEL% NEQ 0 (
    echo !ErrLabel! Ошибка при удалении старого сертификата. Диагностика ниже:
    certutil -delstore "Root" "%CERT_NAME%"
    exit /b 1
  )
  certutil -addstore -f "Root" %CERT_CRT_FILE% >nul 2>&1
  if %ERRORLEVEL% EQU 0 (
    echo !SucLabel! Сертификат успешно обновлен
  ) else (
    echo !ErrLabel! Ошибка при обновлении сертификата. Диагностика ниже:
    certutil -addstore -f "Root" %CERT_CRT_FILE%
    exit /b 1
  )
)

echo !SucLabel! Сертификат успешно создан и добавлен в хранилище доверенных корневых центров сертификации
echo !SucLabel! Файл с ключом: !YellowColor!!CERT_KEY_FILE!!ClearColor!
echo !SucLabel! Файл сертификата: !YellowColor!!CERT_CRT_FILE!!ClearColor!
echo !SucLabel! Добавленные хосты:
echo     !GrayColor!Локальный хост!ClearColor!                           !BlueColor!localhost!ClearColor!
echo     !GrayColor!Локальный хост BrowserStack!ClearColor!              !BlueColor!bs-local.com!ClearColor!
echo     !GrayColor!Локальный IP!ClearColor!                             !BlueColor!127.0.0.1!ClearColor!
echo     !GrayColor!Локальный IP эмулятора в Android Studio!ClearColor!  !BlueColor!10.0.2.2!ClearColor!
echo     !GrayColor!IP устройства в локальной сети!ClearColor!           !BlueColor!!LOCAL_IP!!ClearColor!
