<?

namespace Services;

use PDO;



class CommentService
{
  private PDO $pdo;
  private array $config;

  private DataBaseService $dataBaseService;
  private TokenService $tokenService;
  private FriendService $friendService;

  public function __construct(PDO $pdo, array $config)
  {
    $this->pdo = $pdo;
    $this->config = $config;
    // Подключить сервисы
    $this->dataBaseService = new DataBaseService($this->pdo);
    $this->tokenService = new TokenService($this->pdo, $this->config);
    $this->friendService = new FriendService($this->pdo, $this->config);
  }



  // Пересобрать таблицы БД
  public function createTableApi(string $password): bool
  {
    // Проверить секретный пароль
    if ($password == $this->config["appPassword"]) {
      // Настройка таблиц
      return $this->dataBaseService->executeFromFile("comment/createTable.sql");
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
      return $this->dataBaseService->executeFromFile("comment/deleteTable.sql");
    }
    // Результат работы функции
    return false;
  }



  // Новый комментарий
  public function create(array $data, int $userId): int
  {
    $sqlData = array(
      "user_id" => intval($userId),
      "reply_to_user_id" => intval($data["replyToUserId"] ?? null),
      "material_type" => intval($data["materialType"]),
      "material_id" => intval($data["materialId"]),
      "text" => strval($data["text"]),
      "attachment" => $data['attachment'] ?? null
    );
    // Попытка сохранения
    if ($this->dataBaseService->executeFromFile("comment/send.php", $sqlData)) {
      return $this->pdo->lastInsertId();
    }
    // Сновидение не сохранено
    return 0;
  }
}
