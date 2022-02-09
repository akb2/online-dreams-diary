<?

namespace OnlineDreamsDiary\Services;

use PDO;



class DreamService
{
  private PDO $pdo;
  private array $config;

  private DataBaseService $dataBaseService;

  function __construct(PDO $pdo, array $config)
  {
    $this->pdo = $pdo;
    $this->config = $config;
    // Подключить сервисы
    $this->dataBaseService = new DataBaseService($this->pdo);
  }



  // Пересобрать таблицы БД
  public function createTableApi(string $password): bool
  {
    // Проверить секретный пароль
    if ($password == $this->config["appPassword"]) {
      // Настройка таблиц
      return $this->dataBaseService->executeFromFile("dream/createTable.sql");
    }
    // Результат работы функции
    return false;
  }

  // Удалить таблицы БД
  public function deleteTableApi(string $password): bool
  {
    // Проверить секретный пароль
    if ($password == $this->config["appPassword"]) {
      // Настройка таблиц
      return $this->dataBaseService->executeFromFile("dream/deleteTable.sql");
    }
    // Результат работы функции
    return false;
  }
}
