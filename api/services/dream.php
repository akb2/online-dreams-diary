<?

namespace Services;

use PDO;



class DreamService
{
  private PDO $pdo;
  private array $config;

  private DataBaseService $dataBaseService;
  private TokenService $tokenService;

  public function __construct(PDO $pdo, array $config)
  {
    $this->pdo = $pdo;
    $this->config = $config;
    // Подключить сервисы
    $this->dataBaseService = new DataBaseService($this->pdo);
    $this->tokenService = new TokenService($this->pdo, $this->config);
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



  // Проверить доступность сновидения
  public function checkAvail(string $id, string $userId, bool $edit = true): bool
  {
    $dream = $this->getById($id);
    // Сновидение существует
    if (isset($dream["id"]) && $dream["id"] > 0) {
      if (
        // Доступно владельцу
        $dream["user_id"] == $userId ||
        // Прочие пользователи
        (!$edit && $dream["user_id"] != $userId && (
          // ? public(5)
          $dream["status"] == 5 ||
          // ? users(4)
          ($userId > 0 && ($dream["status"] == 4))
        ))
      ) {
        return true;
      }
    }
    // Недоступно
    return false;
  }

  // Получить сновидение по ID
  public function getById(string $id, string $userId = "0"): array
  {
    if ($id > 0) {
      $sqlData = array($id);
      $dream = $this->dataBaseService->getDatasFromFile("dream/getById.sql", $sqlData);
      // Проверить сновидение
      if (count($dream) > 0) {
        if ($dream[0]["user_id"] == $userId || !($userId > 0)) {
          return $dream[0];
        }
      }
    }
    // Сон не найден
    return array();
  }

  // Получить список сновидений
  public function getList(array $search, string $token, string $userId): array
  {
    $count = 0;
    $result = array();
    $limit = $this->config["dreams"]["limit"];
    $checkToken = $this->tokenService->checkToken($userId, $token);
    // Данные для поиска
    $sqlData = array(
      // Значения полей
      "checkToken" => $checkToken,
      "currentUser" => strval($userId),
      // Параметры
      "status" => strval($search["status"]),
      "user" => strval($search["user"])
    );
    // Запрос
    $sql = $this->dataBaseService->interpolateQuery("dream/searchDreams.php", "", $sqlData);
    // $page = isset($search["page"]) && $search["page"] > 0 ? $search["page"] : 1;
    // $whereQuery = "";
    // $orderQuery = " ORDER BY `create_date` DESC ";
    // Данные поиска
    // $sqlData = array();
    // Уточнение данных
    /*if (count($search) > 0) {
      // Поиск по пользователю
      if (isset($search["user"]) && $search["user"] > 0) {
        $whereQuery .= " AND `user_id` = :user_id ";
        $sqlData["user_id"] = strval($search["user"]);
      }
      // Поиск по статусам
      {
        // Собственные сновидения
        // ? draft(0), private(1), hash(2), friends(3), users(4), public(5)
        if (isset($search["user"]) && $checkToken && $search["user"] === $userId) {
        }
        // Сновидения определенного пользователя
        // ? !friends(3)!, *users(4)*, public(5)
        else if (isset($search["user"]) && $search["user"] !== $userId) {
          $whereQuery .=
            " AND ( " .
            " `status` = 5 " .
            ($checkToken ? " OR `status` = 4 " : "") .
            ")";
        }
        // Общий дневник
        // ? *users(4)*, public(5)
        else {
          $whereQuery .= " AND ( `status` = 5 " . ($checkToken ? " OR `status` = 4 " : "") . ")";
        }
      }
    }*/
    // Запрос подсчета
    // $count = $this->dataBaseService->getCountFromFileString("dream/getListCount.sql", $whereQuery, $sqlData);
    // Получение данных
    /*if ($count > 0) {
      $maxPage = ceil($count / $limit);
      $page = $page < 1 ? 1 : ($page > $maxPage ? $maxPage : $page);
      $limitQuery = " LIMIT " . (($page * $limit) - $limit) . ", " . $limit . " ";
      // Список данных
      $result = $this->dataBaseService->getDatasFromFileString("dream/getList.sql", $whereQuery . $orderQuery . $limitQuery, $sqlData);
    }*/
    // Сон не найден
    return array(
      "count" => $count,
      "limit" => $limit,
      "result" => $result,
      "sql" => $sql // Test: удалить
    );
  }



  // Новое сновидение
  public function createDream($data): int
  {
    $sqlData = array(
      "user_id" => strval($data["userId"]),
      "mode" => strval($data["mode"]),
      "status" => strval($data["status"]),
      "date" => date("Y-m-d", strtotime($data["date"])),
      "title" => $data["title"],
      "description" => $data["description"],
      "keywords" => $data["keywords"],
      "text" => $data["text"],
      "places" => $data["places"],
      "members" => $data["members"],
      "map" => $data["map"],
      "header_type" => $data["headerType"],
      "header_background" => strval($data["headerBackgroundId"]),
    );
    // Попытка сохранения
    if ($this->dataBaseService->executeFromFile("dream/create.sql", $sqlData)) {
      return $this->pdo->lastInsertId();
    }
    // Сновидение не сохранено
    return 0;
  }

  // Обновить сновидение
  public function updateDream($data): string
  {
    $sqlData = array(
      "id" => $data["id"],
      "mode" => $data["mode"],
      "status" => $data["status"],
      "date" => date("Y-m-d", strtotime($data["date"])),
      "title" => $data["title"],
      "description" => $data["description"],
      "keywords" => $data["keywords"],
      "text" => $data["text"],
      "places" => $data["places"],
      "members" => $data["members"],
      "map" => $data["map"],
      "header_type" => $data["headerType"],
      "header_background" => $data["headerBackgroundId"],
    );
    // Попытка сохранения
    if ($this->dataBaseService->executeFromFile("dream/update.sql", $sqlData)) {
      return intval($data["id"]);
    }
    // Сновидение не сохранено
    return 0;
  }

  // Удалить сновидение
  public function delete(int $dreamId, int $userId): string
  {
    $sqlData = array($dreamId, $userId);
    // Попытка удаления
    return $this->dataBaseService->executeFromFile("dream/delete.sql", $sqlData);
  }
}
