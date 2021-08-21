<?

namespace OnlineDreamsDiary\Controllers;

include_once "services/recaptcha.php";
include_once "services/database.php";
include_once "services/user.php";
include_once "services/token.php";
include_once "config/database.php";

use OnlineDreamsDiary\Services\TokenService;
use PDO;



class Token
{

  private array $config;
  private PDO $pdo;

  private TokenService $tokenService;



  // Получить настройки БД
  public function setDbContext(PDO $pdo): void
  {
    $this->pdo = $pdo;
  }

  // Получить настройки приложения
  public function setConfig(array $config): void
  {
    $this->config = $config;
  }

  // Запуск сервисов
  public function setServices(): void
  {
    $this->tokenService = new TokenService($this->pdo, $this->config);
  }



  // Создание таблиц
  // * POST
  public function createTable($data): array
  {
    return $this->tokenService->createTableApi($data["password"]);
  }

  // Проверка токена
  // * POST
  public function checkToken($data): array
  {
    return $this->tokenService->checkTokenApi($data);
  }

  // Удалить токен
  // * DELETE
  public function deleteToken($data): array
  {
    return $this->tokenService->deleteTokenApi($data["token"]);
  }
}


return new Token();
