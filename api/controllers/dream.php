<?

namespace OnlineDreamsDiary\Controllers;

include_once "services/database.php";
include_once "services/dream.php";
include_once "services/token.php";
include_once "config/database.php";

use OnlineDreamsDiary\Services\DreamService;
use OnlineDreamsDiary\Services\TokenService;
use PDO;



class Dream
{

  private array $config;
  private PDO $pdo;

  private DreamService $dreamService;
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
    $this->dreamService = new DreamService($this->pdo, $this->config);
    $this->tokenService = new TokenService($this->pdo, $this->config);
  }



  // Сохранение сновидения
  // * POST
  public function save($data): array
  {
    $id = 0;
    $code = "7001";
    $userId = $_GET["user_id"];
    $token = $_GET["token"];
    $dream = $this->dreamService->getById($data["id"], $userId);
    // Проверка доступности
    if ($this->tokenService->checkToken($userId, $token)) {
      // Переписать старое
      if (isset($dream["id"]) && $dream["id"] > 0) {
        $id = $this->dreamService->updateDream($data);
      }
      // Новое сновидение
      else {
        $id = $this->dreamService->createDream($data);
      }
    }
    // Неверный токен
    else {
      $code = "9015";
    }
    // Обновить код
    $code = $id > 0 ? "0001" : $code;
    // Сновидение не сохранено
    return array(
      "code" => $code,
      "data" => $id
    );
  }

  // Получить сновидение
  // * GET
  public function getById($data): array
  {
    $code = "0002";
    $userId = $_GET["user_id"];
    $token = $_GET["token"];
    $testDream = $this->dreamService->getById($data["id"]);
    $dream = array();
    // Проверка доступности
    if ($this->tokenService->checkToken($userId, $token)) {
      // Сновидение найдено
      if (isset($testDream["id"]) && $testDream["id"] > 0) {
        // Доступность для просмотра
        if ($this->dreamService->checkAvail($testDream["id"], $userId)) {
          $code = "0001";
          $dream = array(
            "id" => intval($testDream["id"]),
            "userId" => intval($testDream["user_id"]),
            "createDate" => $testDream["create_date"],
            "date" => $testDream["date"],
            "title" => $testDream["title"],
            "description" => $testDream["description"],
            "keywords" => $testDream["keywords"],
            "text" => $testDream["text"],
            "places" => $testDream["places"],
            "members" => $testDream["members"],
            "map" => $testDream["map"],
            "mode" => intval($testDream["mode"]),
            "status" => intval($testDream["status"]),
            "headerType" => $testDream["header_type"],
            "headerBackgroundId" => intval($testDream["header_background"])
          );
        }
        // Нельяз смотреть
        else {
          $code = "7002";
        }
      }
      // Сновидение не найдено
      else {
        $code = "0002";
      }
    }
    // Неверный токен
    else {
      $code = "9015";
    }
    // Вернуть результат
    return array(
      "data" => $dream,
      "code" => $code
    );
  }
}


return new Dream();
