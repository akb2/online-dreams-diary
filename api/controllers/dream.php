<?

namespace OnlineDreamsDiary\Controllers;

include_once "services/database.php";
include_once "services/dream.php";
include_once "config/database.php";

use OnlineDreamsDiary\Services\DreamService;
use PDO;



class Dream
{

  private array $config;
  private PDO $pdo;

  private DreamService $dreamService;



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
  }



  // Сохранение сновидения
  // * POST
  public function save($data): array
  {
    $id = 0;
    $code = "7001";
    $dream = $this->dreamService->getById($data["id"], $data["userId"]);
    // Переписать старое
    if (isset($dream["id"]) && $dream["id"] > 0) {
    }
    // Новое сновидение
    else {
      $id = $this->dreamService->createDream($data);
      $code = $id > 0 ? "0001" : $code;
    }
    // Сновидение не сохранено
    return array(
      "code" => $code,
      "id" => $id
    );
  }
}


return new Dream();
