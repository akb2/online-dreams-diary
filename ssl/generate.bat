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
REM ����ன��
REM =======================
setlocal enabledelayedexpansion
set CERT_NAME=Online Dreams Diary Development Server
set SSL_DIR=ssl
set CERT_KEY_FILE=%SSL_DIR%\localhost.key
set CERT_CRT_FILE=%SSL_DIR%\localhost.crt
set OPENSSL_CONFIG_FILE=%SSL_DIR%\openssl.cnf
set CERT_VALIDITY_DAYS=365

REM =======================
REM �஢�ઠ �ࠢ
REM =======================
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo !ErrLabel! ����室��� �������� �ਯ� �� ����� �����������
  exit /b
)

REM Main script starts here
echo !SucLabel! ��ਯ� ����饭 �� ����� �����������

REM =======================
REM �஢�ઠ ������ OpenSSL
REM =======================
where openssl >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo !ErrLabel! � ��६����� PATH �� ������ OpenSSL
  echo !ErrLabel! �஢����, �� OpenSSL ��⠭����� � �������� � ��६����� PATH
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
  echo !SucLabel! �ᯮ�짮����� ���������� IP: !BlueColor!!LOCAL_IP!!ClearColor!
)

:found_ip
if not defined LOCAL_IP (
  echo !ErrLabel! �� 㤠���� ��।����� ������� IP-����
  exit /b 1
)
echo !SucLabel! ������� IP: !BlueColor!!LOCAL_IP!!ClearColor!

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
  echo !ErrLabel! �訡�� �� ᮧ����� ���䨪��
  exit /b 1
)

REM Make the certificate trusted
REM Check if the certificate already exists in the store
certutil -store "Root" | findstr /C:"%CERT_NAME%" >nul
if %ERRORLEVEL% NEQ 0 (
  echo !SucLabel! ���������� ���䨪�� � �࠭���� ����७��� ��୥��� 業�஢ ���䨪�樨...
  certutil -addstore -f "Root" %CERT_CRT_FILE% >nul 2>&1
  if %ERRORLEVEL% EQU 0 (
    echo !SucLabel! ����䨪�� �ᯥ譮 ��������
  ) else (
    echo !ErrLabel! �訡�� �� ���������� ���䨪��. �������⨪� ����:
    certutil -addstore -f "Root" %CERT_CRT_FILE%
    exit /b 1
  )
) else (
  echo !SucLabel! ���������� ���䨪�� � �࠭���� ����७��� ��୥��� 業�஢ ���䨪�樨...
  certutil -delstore "Root" "%CERT_NAME%" >nul 2>&1
  if %ERRORLEVEL% NEQ 0 (
    echo !ErrLabel! �訡�� �� 㤠����� ��ண� ���䨪��. �������⨪� ����:
    certutil -delstore "Root" "%CERT_NAME%"
    exit /b 1
  )
  certutil -addstore -f "Root" %CERT_CRT_FILE% >nul 2>&1
  if %ERRORLEVEL% EQU 0 (
    echo !SucLabel! ����䨪�� �ᯥ譮 ��������
  ) else (
    echo !ErrLabel! �訡�� �� ���������� ���䨪��. �������⨪� ����:
    certutil -addstore -f "Root" %CERT_CRT_FILE%
    exit /b 1
  )
)

echo !SucLabel! ����䨪�� �ᯥ譮 ᮧ��� � �������� � �࠭���� ����७��� ��୥��� 業�஢ ���䨪�樨
echo !SucLabel! ���� � ���箬: !YellowColor!!CERT_KEY_FILE!!ClearColor!
echo !SucLabel! ���� ���䨪��: !YellowColor!!CERT_CRT_FILE!!ClearColor!
echo !SucLabel! ���������� ����:
echo     !GrayColor!������� ���!ClearColor!                           !BlueColor!localhost!ClearColor!
echo     !GrayColor!������� ��� BrowserStack!ClearColor!              !BlueColor!bs-local.com!ClearColor!
echo     !GrayColor!������� IP!ClearColor!                             !BlueColor!127.0.0.1!ClearColor!
echo     !GrayColor!������� IP ����� � Android Studio!ClearColor!  !BlueColor!10.0.2.2!ClearColor!
echo     !GrayColor!IP ���ன�⢠ � �����쭮� ��!ClearColor!           !BlueColor!!LOCAL_IP!!ClearColor!
