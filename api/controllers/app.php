<?

namespace Controllers;

use Services\DreamService;
use Services\UserService;
use Services\TokenService;
use Services\FriendService;
use PDO;

class App
{
  private array $config;
  private PDO $pdo;

  private UserService $userService;
  private TokenService $tokenService;
  private DreamService $dreamService;
  private FriendService $friendService;



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
    $this->dreamService = new DreamService($this->pdo, $this->config);
    $this->friendService = new FriendService($this->pdo, $this->config);
  }



  // Создание таблиц
  // * GET
  public function createTable($data): array
  {
    ini_set('max_execution_time', 600);
    // ПРедварительные ответы
    $request = array(
      "code" => "9040",
      "user" => array(),
      "token" => array(),
    );
    // Проверка доступа
    if ($data["password"] === $this->config["appPassword"]) {
      // Запросы на удаление таблиц
      $request["token"]["delete"] = $this->tokenService->deleteTableApi($data["password"]);
      $request["dream"]["delete"] = $this->dreamService->deleteTableApi($data["password"]);
      $request["user"]["delete"] = $this->userService->deleteTableApi($data["password"]);
      $request["friend"]["delete"] = $this->friendService->deleteTableApi($data["password"]);
      // Запросы на создание таблиц
      $request["user"]["create"] = $this->userService->createTableApi($data["password"]);
      $request["token"]["create"] = $this->tokenService->createTableApi($data["password"]);
      $request["dream"]["create"] = $this->dreamService->createTableApi($data["password"]);
      $request["friend"]["create"] = $this->friendService->createTableApi($data["password"]);
      // Запросы на заполнение таблиц
      $request["user"]["fill"] = $this->userService->fillTableApi($data["password"]);
      $request["dream"]["fill"] = $this->dreamService->fillTableApi($data["password"]);
      // Код
      $request["code"] = "0001";
    }
    // Результат
    return $request;
  }
}


return new App();
