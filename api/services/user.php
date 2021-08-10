<?

namespace OnlineDreamsDiary\Services;

include_once "./libs/thumbs.php";

use PDO;
use OnlineDreamsDiary\Libs\Thumbs;



class UserService
{
  private PDO $pdo;
  private array $config;

  private DataBaseService $dataBaseService;

  private int $tokenLifeTime = 36000;

  private string $avatarDir = "../media/images/user_avatars";
  private string $avatarUrl = "/media/images/user_avatars";
  private array $avatarExts = array("png", "jpg", "jpeg");
  private array $avatarKeys = array("full", "crop", "middle", "small");

  function __construct(PDO $pdo, array $config)
  {
    $this->pdo = $pdo;
    $this->config = $config;
    // Подключить сервисы
    $this->dataBaseService = new DataBaseService($this->pdo);
    $this->reCaptchaService = new ReCaptchaService("", $this->config);
    // Определить переменные
    $this->tokenLifeTime = $this->config["auth"]["tokenLifeTime"] ? $this->config["auth"]["tokenLifeTime"] : $this->tokenLifeTime;
  }



  // Пересобрать таблицы БД
  public function createTableApi(string $password): array
  {
    $result = array(
      "deleteTable" => false,
      "deleteTokensTable" => false,
      "createTable" => false,
      "createTokensTable" => false,
      "createAdmin" => false,
    );
    // Проверить секретный пароль
    if ($password == $this->config["appPassword"]) {
      // Настройка таблиц
      $result["deleteTable"] = $this->dataBaseService->executeFromFile("account/deleteTable.sql");
      $result["deleteTokensTable"] = $this->dataBaseService->executeFromFile("account/deleteTokensTable.sql");
      $result["createTable"] = $this->dataBaseService->executeFromFile("account/createTable.sql");
      $result["createTokensTable"] = $this->dataBaseService->executeFromFile("account/createTokensTable.sql");
      $result["createAdmin"] = $this->dataBaseService->executeFromFile("account/createAdmin.sql");
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
      if ($this->dataBaseService->executeFromFile("account/deleteToken.sql", array($token))) {
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
      $auth = $this->dataBaseService->getDatasFromFile("account/checkToken.sql", $sqlData);
      // Проверить авторизацию
      if (count($auth) > 0) {
        if (strlen($auth[0]["id"]) > 0) {
          // Проверка времени жизни токена
          if (gmdate("U") - $this->tokenLifeTime < strtotime($auth[0]["last_action_date"])) {
            // Обновить токен
            if ($this->dataBaseService->executeFromFile("account/updateTokenLastAction.sql", array($auth[0]["id"]))) {
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
        $this->dataBaseService->executeFromFile("account/deleteToken.sql", array($data["token"]));
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
      $auth = $this->dataBaseService->getDatasFromFile("account/checkToken.sql", $sqlData);
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
      $auth = $this->dataBaseService->getDatasFromFile("account/checkToken.sql", $sqlData);
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
  private function createToken(string $id): string
  {
    $token = hash("sha512", $this->config["hashSecret"] . $id . "_" . gmdate("U"));
    // Сохранить токен
    if ($this->dataBaseService->executeFromFile("account/createToken.sql", array($token, $id))) {
      return $token;
    }
    // Ошибка сохранения токена
    return "";
  }



  // Авторизация
  public function authUserApi(array $data): array
  {
    $code = "9010";
    $message = "";
    $id = "";
    $token = "";
    $sqlData = array();

    // Если получены данные
    if (strlen($data["login"]) > 0 && strlen($data["password"]) > 0) {
      $code = "9013";
      // Данные
      $sqlData = array(
        $data["login"],
        hash("sha512", $this->config["hashSecret"] . $data["password"])
      );
      // Запрос авторизации
      $auth = $this->dataBaseService->getDatasFromFile("account/auth.sql", $sqlData);
      // Проверить авторизацию
      if (count($auth) > 0) {
        if (strlen($auth[0]["id"]) > 0) {
          $id = $auth[0]["id"];
          $token = $this->createToken($id);
          $code = strlen($token) > 0 ? "0001" : "9014";
        }
      }
      // Убрать метку пароля
      unset($sqlData[1]);
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
        "id" => $id,
        "token" => $token,
        "input" => $sqlData,
        "result" => $code == "0001"
      )
    );
  }

  // Регистрация нового пользователя
  public function registerUserApi(array $data): array
  {
    $code = "9010";
    $message = "";
    $id = "";
    $sqlData = array();

    // Если получены данные
    if (strlen($data["login"]) > 0 && strlen($data["email"]) > 0) {
      $this->reCaptchaService->setCaptchaCode($data["captcha"]);
      // Данные
      $sqlData = array(
        $data["login"],
        hash("sha512", $this->config["hashSecret"] . $data["password"]),
        $data["name"],
        $data["lastName"],
        date("Y-m-d", strtotime($data["birthDate"])),
        $data["sex"],
        $data["email"],
        json_encode(array())
      );

      // Проверить капчу
      if ($this->reCaptchaService->checkCaptcha()) {
        $checkLogin = $this->dataBaseService->getDatasFromFile("account/checkLoginEmail.sql", array($data["login"], $data["email"]));
        // Проверить логин
        if (count($checkLogin) == 0) {
          // Регистрация пользователя
          if ($this->dataBaseService->executeFromFile("account/registerUser.sql", $sqlData)) {
            // TODO: Добавить отправку письма на почту
            $code = "0001";
          }
          // Регистрация неудалась
          else {
            $code = "9021";
          }
        }
        // Логин или почта повторяются
        else {
          foreach ($checkLogin as $row) {
            // Логин
            if ($row["login"] == $data["login"]) {
              $code = "9011";
            }
            // Почта
            else {
              $code = "9012";
            }
            break;
          }
        }
      }
      // Ошибка капчи
      else {
        $code = "9010";
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
        "id" => $id,
        "input" => $sqlData,
        "result" => $code == "0001"
      )
    );
  }



  // Сведения о пользователе
  public function getUserApi(string $id): array
  {
    $code = "0000";
    $user = array();
    $users = array();

    // Проверка ID
    if (strlen($id) > 0) {
      $code = "9013";
      // Запрос данных о пользователе
      $users = $this->dataBaseService->getDatasFromFile("account/getUser.sql", array($id));
      // Проверить авторизацию
      if (count($users) > 0) {
        if (strlen($users[0]["id"]) > 0) {
          // Данные пользователя
          $user = $this->getUserData($users[0]);
          $code = "0001";
        }
      }
    }
    // Получены пустые данные
    else {
      $code = "9030";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => "",
      "data" => $user
    );
  }

  // Сохранить данные
  public function saveUserDataApi(string $id, array $data): array
  {
    $code = "0000";

    // Проверка ID
    if (strlen($id) > 0) {
      $checkLogin = $this->dataBaseService->getDatasFromFile("account/checkEmail.sql", array($id, $data["email"]));
      // Проверить почту
      if (count($checkLogin) == 0) {
        // Данные
        $sqlData = array(
          $data["name"],
          $data["lastName"],
          $data["patronymic"],
          date("Y-m-d", strtotime($data["birthDate"])),
          $data["sex"],
          $data["email"],
          $id
        );
        // Сохранение данных
        if ($this->dataBaseService->executeFromFile("account/saveUserData.sql", $sqlData)) {
          $code = "0001";
        }
        // Регистрация неудалась
        else {
          $code = "9021";
        }
      }
      // Почта повторяется
      else {
        $code = "9012";
      }
    }
    // Получены пустые данные
    else {
      $code = "9030";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => "",
      "data" => array()
    );
  }

  // Загрузить аватарку
  public function uploadAvatarApi(string $id, array $data): array
  {
    $code = "0000";

    // Проверка ID
    if (strlen($id) > 0 && is_array($data["file"])) {
      // Успешное удаление аватарок
      if ($this->deleteUserAvatars($id)) {
        // Проверка размера файла
        if ($data["file"]["size"] <= $this->config["user"]["avaMaxSize"]) {
          $nameParse = explode(".", $data["file"]["name"]);
          $fileExt = end($nameParse);
          $file = $this->avatarDir . "/" . $this->avatarKeys[0] . "/" . $id . "." . $fileExt;
          // Файл успешно загружен
          if (move_uploaded_file($data["file"]["tmp_name"], $file)) {
            $data["test"] = $this->createDefaultAvatars($id);
            // Созданы дополнительные аватарки
            if ($this->createDefaultAvatars($id)) {
              $code = "0001";
            }
            // Дополнительные аватарки не созданы
            else {
              $code = "8013";
            }
          }
          // Ошибка загрузки файла
          else {
            $code = "8011";
          }
        }
        // Слишком большой файл
        else {
          $code = "8012";
        }
      }
      // Неудалось удалить аватарки
      else {
        $code = "8010";
      }
    }
    // Получены пустые данные
    else {
      $code = "9030";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => "",
      "data" => $data
    );
  }



  // Преобразовать данные
  private function getUserData(array $user): array
  {
    $avatars = array();
    foreach ($this->avatarKeys as $key) {
      $avatars[$key] = "";
    }

    // Проверить аватарки
    foreach ($this->avatarExts as $ext) {
      $file = $this->avatarDir . "/" . $this->avatarKeys[0] . "/" . $user["id"] . "." . $ext;
      if (file_exists($file)) {
        foreach ($this->avatarKeys as $key) {
          $avatars[$key] = $this->config["mediaDomain"] . $this->avatarUrl . "/" . $key . "/" . $user["id"] . "." . $ext . "?time=" . filemtime($file);
        }
        break;
      }
    }

    // Вернуть данные
    return array(
      "id" => $user["id"],
      "name" => $user["name"],
      "lastName" => $user["last_name"],
      "patronymic" => $user["patronymic"],
      "birthDate" => $user["birth_date"],
      "registerDate" => $user["register_date"],
      "sex" => $user["sex"],
      "email" => $user["email"],
      "roles" => json_decode($user["roles"]),
      "avatars" => $avatars
    );
  }

  // Удалить все аватарки
  private function deleteUserAvatars(string $id): bool
  {
    $delete = 0;
    // Удалить аватарки
    foreach ($this->avatarExts as $ext) {
      foreach ($this->avatarKeys as $key) {
        $file = $this->avatarDir . "/" . $key . "/" . $id . "." . $ext;
        if (file_exists($file)) {
          $delete++;
          if (@unlink($file)) {
            $delete--;
          }
        }
      }
    }
    // Неудалось удалить
    return $delete == 0;
  }

  // Установить аватарки по умолчанию
  private function createDefaultAvatars(string $id)
  {
    // Поиск оригинальной аватарки
    $originalFile = "";
    $fileExt = "";
    foreach ($this->avatarExts as $ext) {
      $file = $this->avatarDir . "/" . $this->avatarKeys[0] . "/" . $id . "." . $ext;
      if (file_exists($file)) {
        $fileExt = $ext;
        $originalFile = $file;
        break;
      }
    }
    // Аватарка найдена
    if (strlen($originalFile) > 0) {
      $avas = count($this->avatarKeys);
      // Цикл по типам аватарок
      foreach ($this->avatarKeys as $key) {
        $file = $this->avatarDir . "/" . $key . "/" . $id . "." . $fileExt;
        // Копировать файл
        $copy = $key == $this->avatarKeys[0] ? true : copy($originalFile, $file);
        // Обработка
        if ($copy) {
          // Параметры
          $config = $this->config["user"]["avaSettings"][$key];
          $image = new Thumbs($file);
          // Для квадратных картинок
          if ($config["square"]) {
            $image->thumb($config["maxX"], $config["maxY"]);
          }
          // Для неквадратных картинок
          else {
            $image->reduce($config["maxX"], $config["maxY"]);
          }
          // Сохранить изменения
          $image->save();
          $avas--;
        }
      }
      // Вернуть результат
      return $avas === 0;
    }
    // Неудалось создать набор аватарок
    return false;
  }
}
