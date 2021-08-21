<?

namespace OnlineDreamsDiary\Services;

use PDO;



class TokenService
{
  private PDO $pdo;
  private array $config;

  private DataBaseService $dataBaseService;

  private int $tokenLifeTime = 36000;

  function __construct(PDO $pdo, array $config)
  {
    $this->pdo = $pdo;
    $this->config = $config;
    // Подключить сервисы
    $this->dataBaseService = new DataBaseService($this->pdo);
    // Определить переменные
    $this->tokenLifeTime = $this->config["auth"]["tokenLifeTime"] ? $this->config["auth"]["tokenLifeTime"] : $this->tokenLifeTime;
  }



  // Пересобрать таблицы БД
  public function createTableApi(string $password): array
  {
    $result = array(
      "deleteTable" => false,
      "createTable" => false,
    );
    // Проверить секретный пароль
    if ($password == $this->config["appPassword"]) {
      // Настройка таблиц
      $result["deleteTable"] = $this->dataBaseService->executeFromFile("token/deleteTokensTable.sql");
      $result["createTable"] = $this->dataBaseService->executeFromFile("token/createTokensTable.sql");
    }
    // Результат работы функции
    return $result;
  }

  // Удаление токена
  public function deleteTokenApi(string $token): array
  {
    $code = "0000";
    $message = "";
    $sqlData = array();

    // Если получены данные
    if (strlen($token) > 0) {
      // Удаление токена
      if ($this->dataBaseService->executeFromFile("token/deleteToken.sql", array($token))) {
        $code = "0001";
      }
      // Неудалось удалить токен
      else {
        $code = "9017";
      }
    }
    // Получены пустые данные
    else {
      $code = "9030";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => $message,
      "data" => array(
        "input" => $sqlData,
        "result" => $code == "0001"
      )
    );
  }

  // Проверить токен
  public function checkTokenApi(array $data): array
  {
    $code = "0000";
    $message = "";
    $sqlData = array();
    $tokenData = array();

    // Если получены данные
    if (strlen($data["token"]) > 0) {
      $code = "9015";
      // Данные
      $sqlData = array($data["token"]);
      // Запрос проверки токена
      $auth = $this->dataBaseService->getDatasFromFile("token/checkToken.sql", $sqlData);
      // Проверить авторизацию
      if (count($auth) > 0) {
        if (strlen($auth[0]["id"]) > 0) {
          // Проверка времени жизни токена
          if (gmdate("U") - $this->tokenLifeTime < strtotime($auth[0]["last_action_date"])) {
            // Обновить токен
            if ($this->dataBaseService->executeFromFile("token/updateTokenLastAction.sql", array($auth[0]["id"]))) {
              $tokenData = $auth[0];
              $code = "0001";
            }
            // Ошибка сохранения токена
            else {
              $code = "9014";
            }
          }
          // Токен просрочен
          else {
            $code = "9016";
          }
        }
      }

      // Удалить токен
      if ($code != "0001") {
        $this->dataBaseService->executeFromFile("token/deleteToken.sql", array($data["token"]));
      }
    }
    // Получены пустые данные
    else {
      $code = "9030";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => $message,
      "data" => array(
        "input" => $sqlData,
        "tokenData" => $tokenData,
        "result" => $code == "0001"
      )
    );
  }



  // Проверить токен
  public function checkToken(string $id, string $token): bool
  {
    if (strlen($id) > 0 && strlen($token) > 0) {
      // Данные
      $sqlData = array($token);
      // Запрос проверки токена
      $auth = $this->dataBaseService->getDatasFromFile("token/checkToken.sql", $sqlData);
      // Проверить авторизацию
      if (count($auth) > 0) {
        if (strlen($auth[0]["id"]) > 0) {
          // Проверка времени жизни токена
          if (gmdate("U") - $this->tokenLifeTime < strtotime($auth[0]["last_action_date"])) {
            // Проверка привязки пользователя
            if ($id === $auth[0]["user_id"]) {
              return true;
            }
          }
        }
      }
    }
    // Токен не валидный
    return false;
  }

  // ID по токену
  public function getUserIdFromToken(string $token): int
  {
    if (strlen($token) > 0) {
      // Данные
      $sqlData = array($token);
      // Запрос проверки токена
      $auth = $this->dataBaseService->getDatasFromFile("token/checkToken.sql", $sqlData);
      // Проверить авторизацию
      if (count($auth) > 0) {
        if (strlen($auth[0]["user_id"]) > 0) {
          return $auth[0]["user_id"];
        }
      }
    }
    // Токен не валидный
    return 0;
  }

  // Создать токен
  public function createToken(string $id): string
  {
    $token = hash("sha512", $this->config["hashSecret"] . $id . "_" . gmdate("U"));
    // Сохранить токен
    if ($this->dataBaseService->executeFromFile("token/createToken.sql", array($token, $id))) {
      return $token;
    }
    // Ошибка сохранения токена
    return "";
  }
}
