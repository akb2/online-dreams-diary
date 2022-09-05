<?

namespace Controllers;

use Services\UserService;
use Services\TokenService;
use PDO;



class Account
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



  // Авторизация пользователя
  // * POST
  public function auth($data): array
  {
    return $this->userService->authUserApi($data);
  }

  // Регистрация пользователя
  // * POST
  public function register($data): array
  {
    return $this->userService->registerUserApi($data);
  }

  // Проверить настройку приватности
  // * POST
  public function checkPrivate(array $dataIn): array
  {
    $code = "0000";
    $id = $_GET["user_id"];
    $token = $_GET["token"];
    $dataOut = false;

    // Проверка входящих данных
    if (strlen($dataIn['rule']) > 0 & strlen($dataIn['user']) > 0) {
      // Проверка токена
      if ($this->tokenService->checkToken($id, $token) || (!strlen($id) && !strlen($token))) {
        $dataOut = $this->userService->checkPrivate($dataIn['rule'], $dataIn['user'], intval($id) ?? 0);
        // Доступ разрешен
        if ($dataOut) {
          $code = '0001';
        }
        // Доступ не разрешен
        else{
          $code = '8100';
        }
      }
      // Неверный токен
      else {
        $code = "9015";
      }
    }
    // Переданы пустые/неполные данные
    else {
      $code = "1000";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => "",
      "data" => $dataOut
    );
  }



  // Поиск
  // * GET
  public function search($data): array
  {
    $code = "0002";
    $userId = $_GET["user_id"];
    $token = $_GET["token"];
    $search = array(
      "q" => $data["search_q"] ?? null,
      "sex" => $data["search_sex"] ?? null,
      "birth_year" => $data["search_birthYear"] ?? null,
      "birth_month" => $data["search_birthMonth"] ?? null,
      "birth_day" => $data["search_birthDay"] ?? null,
      "ids" => strlen($data["search_ids"]) > 0? explode(",", $data["search_ids"]): array(),
      "exclude_ids" => strlen($data["search_excludeIds"]) > 0? explode(",", $data["search_excludeIds"]): array(),
      "page" => $data["search_page"] ?? 1,
      "limit" => $data["search_limit"] ?? null
    );
    $testUsers = $this->userService->getList($search, $token, $userId);
    $people = array();
    // Сновидение найдено
    if ($testUsers["count"] > 0) {
      // Доступность для просмотра или редактирования
      $code = "0001";
      // Список пользователей
      $people = $testUsers["result"];
    }
    // Сновидение не найдено
    else {
      $code = "0002";
    }
    // Вернуть результат
    return array(
      "data" => array(
        "count" => $testUsers["count"],
        "limit" => $testUsers["limit"],
        "people" => $people
      ),
      "code" => $code
    );
  }

  // Получить данные о пользователе
  // * GET
  public function getUser($data): array
  {
    $code = "0000";
    $user = array();

    // Проверка ID
    if (strlen($data["id"]) > 0) {
      $code = "9013";
      // Запрос данных о пользователе
      $user = $this->userService->getUser($data["id"]);
      // Проверить авторизацию
      if ($user) {
        $code = "0001";
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



  // Изменение пароля
  // * POST
  public function changePassword($data): array {
    $code = "0000";
    $message = "";
    $id = $_GET["id"];
    $token = $_GET["token"];

    // Проверка входящих данных
    if (strlen($data['current_password']) > 0 & strlen($data['new_password']) > 0) {
      // Проверка токена
      if ($this->tokenService->checkToken($id, $token)) {
        // Проверка доступа
        if ($id == $this->tokenService->getUserIdFromToken($token)) {
          $sqlData = array(
            'id' => $id,
            'password' => $data['current_password']
          );
          // Проверка совпадения пароля
          if ($this->userService->checkUserPassword($sqlData)) {
            $sqlData['password'] = $data['new_password'];
            // Сохранение пароля
            return $this->userService->changePasswordApi($sqlData);
          }
          // Пароль неверный
          else {
            $code = '0002';
          }
        }
        // Ошибка доступа
        else {
          $code = "9040";
        }
      }
      // Неверный токен
      else {
        $code = "9015";
      }
    }
    // Переданы пустые/неполные данные
    else {
      $code = "1000";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => $message,
      "data" => array()
    );
  }

  // Сохранить данные пользователя
  // * POST
  public function saveUserData($data): array
  {
    $code = "0000";
    $id = $_GET["id"];
    $token = $_GET["token"];

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        return $this->userService->saveUserDataApi($id, $data);
      }
      // Ошибка доступа
      else {
        $code = "9040";
      }
    }
    // Неверный токен
    else {
      $code = "9015";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => "",
      "data" => array()
    );
  }

  // Сохранить настройки пользователя
  // * POST
  public function saveUserSettings($data): array
  {
    $code = "0000";
    $id = $_GET["id"];
    $token = $_GET["token"];

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        return $this->userService->saveUserSettingsApi($id, $data);
      }
      // Ошибка доступа
      else {
        $code = "9040";
      }
    }
    // Неверный токен
    else {
      $code = "9015";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => "",
      "data" => array()
    );
  }

  // Сохранить настройки приватности пользователя
  // * POST
  public function saveUserPrivate($data): array
  {
    $code = "0000";
    $id = $_GET["id"];
    $token = $_GET["token"];

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        return $this->userService->saveUserPrivateApi($id, $data["private"]);
      }
      // Ошибка доступа
      else {
        $code = "9040";
      }
    }
    // Неверный токен
    else {
      $code = "9015";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => "",
      "data" => array()
    );
  }



  // Загрузить аватарку
  // * POST
  public function uploadAvatar($data): array
  {
    $code = "0000";
    $id = $_GET["id"];
    $token = $_GET["token"];

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        $data["file"] = $_FILES["file"];
        // Загрузка
        return $this->userService->uploadAvatarApi($id, $data);
      }
      // Ошибка доступа
      else {
        $code = "9040";
      }
    }
    // Неверный токен
    else {
      $code = "9015";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => "",
      "data" => array()
    );
  }

  // Обрезать аватарку
  // * POST
  public function cropAvatar($data): array
  {
    $code = "0000";
    $id = $_GET["id"];
    $token = $_GET["token"];

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        // Загрузка
        return $this->userService->cropAvatarApi($id, $data);
      }
      // Ошибка доступа
      else {
        $code = "9040";
      }
    }
    // Неверный токен
    else {
      $code = "9015";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => "",
      "data" => array()
    );
  }

  // Удалить аватарку
  // * DELETE
  public function deleteAvatar(): array
  {
    $code = "0000";
    $id = $_GET["id"];
    $token = $_GET["token"];

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        // Загрузка
        return $this->userService->deleteAvatarApi($id);
      }
      // Ошибка доступа
      else {
        $code = "9040";
      }
    }
    // Неверный токен
    else {
      $code = "9015";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => "",
      "data" => array()
    );
  }
}


return new Account();
