<?

namespace OnlineDreamsDiary\Controllers;

include_once "services/database.php";
include_once "services/user.php";
include_once "services/token.php";
include_once "config/database.php";

use OnlineDreamsDiary\Services\UserService;
use OnlineDreamsDiary\Services\TokenService;
use PDO;



class App
{
  private array $config;
  private PDO $pdo;

  private UserService $userService;
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
    $this->userService = new UserService($this->pdo, $this->config);
    $this->tokenService = new TokenService($this->pdo, $this->config);
  }



  // Создание таблиц
  // * GET
  public function createTable($data): array
  {
    $request = array(
      "user" => array(),
      "token" => array(),
    );
    // Запросы на удаление таблиц
    $request["token"]["delete"] = $this->tokenService->deleteTableApi($data["password"]);
    $request["user"]["delete"] = $this->userService->deleteTableApi($data["password"]);
    // Запросы на создание таблиц
    $request["user"]["create"] = $this->userService->createTableApi($data["password"]);
    $request["token"]["create"] = $this->tokenService->createTableApi($data["password"]);
    // Запросы на заполнение таблиц
    $request["user"]["fill"] = $this->userService->fillTableApi($data["password"]);
    // Результат
    return $request;
  }
}


return new App();
