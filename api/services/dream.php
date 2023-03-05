<?

namespace Services;

use PDO;



class DreamService
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

  // Заполнить таблицы БД
  public function fillTableApi(string $password): bool
  {
    // Проверить секретный пароль
    if ($password == $this->config["appPassword"]) {
      // Настройка таблиц
      return $this->dataBaseService->executeFromFile("dream/createDreams.php");
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
        (!$edit && $dream["user_id"] != $userId && $userId > 0 && (
          // ? public(5)
          $dream["status"] == 5 ||
          // ? users(4)
          $dream["status"] == 4
        )) ||
        // Без авторизации
        // ? public(5)
        (!$edit && $userId <= 0 && $dream["status"] == 5)
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
    $limit = $search['limit'] > 0 & $search['limit'] <= 100 ? $search['limit'] : $this->config["dreams"]["limit"];
    $checkToken = $this->tokenService->checkToken($userId, $token);
    $areFriends = false;
    // Проверка статуса в друзьях
    if (intval($search['user']) > 0 && intval($userId) > 0 && intval($search['user']) != intval($userId)) {
      $friend = $this->friendService->getFriendStatus($userId, $search['user']);
      // Заявка существует
      if (!!$friend) {
        $areFriends = ($friend['status'] == 1 ||
          ($userId == $friend['in_user_id'] && $friend['status'] == 0) ||
          ($userId == $friend['out_user_id'] && $friend['status'] == 2)
        );
      }
    }
    // Данные для поиска
    $sqlData = array(
      // Значения полей
      "status" => intval($search["status"]),
      "user_id" => intval($search["user"]),
      // Параметры
      "are_friends" => $areFriends,
      "check_token" => $checkToken,
      "current_user" => intval($userId),
    );
    // Запрос
    $count = $this->dataBaseService->getCountFromFile("dream/searchDreamsCount.php", $sqlData);
    $page = isset($search["page"]) && $search["page"] > 0 ? $search["page"] : 1;
    // Сновидения найдены
    if ($count > 0) {
      $maxPage = ceil($count / $limit);
      $page = $page < 1 ? 1 : ($page > $maxPage ? $maxPage : $page);
      // Настройки ограничения данных
      $sqlData['limit_start'] = intval(($page * $limit) - $limit);
      $sqlData['limit_length'] = intval($limit);
      // Список данных
      $result = $this->dataBaseService->getDatasFromFile("dream/searchDreams.php", $sqlData);
    }
    // Сон не найден
    return array(
      "count" => $count,
      "limit" => $limit,
      "result" => $result
    );
  }



  // Новое сновидение
  public function createDream($data): int
  {
    $sqlData = array(
      "user_id" => intval($data["userId"]),
      "mode" => intval($data["mode"]),
      "status" => intval($data["status"]),
      "type" => intval($data["type"]),
      "mood" => intval($data["mood"]),
      "date" => date("Y-m-d", strtotime($data["date"])),
      "title" => strval($data["title"]),
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
      "id" => intval($data["id"]),
      "mode" => intval($data["mode"]),
      "status" => intval($data["status"]),
      "type" => intval($data["type"]),
      "mood" => intval($data["mood"]),
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
