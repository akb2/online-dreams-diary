<?

namespace OnlineDreamsDiary\Controllers;

include_once "services/recaptcha.php";
include_once "services/database.php";
include_once "services/user.php";
include_once "services/token.php";
include_once "config/database.php";

use OnlineDreamsDiary\Services\UserService;
use OnlineDreamsDiary\Services\TokenService;
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



  // Создание таблиц
  // * POST
  public function createTable($data): array
  {
    return $this->userService->createTableApi($data["password"]);
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

  // Получить данные о пользователе
  // * GET
  public function getUser($data): array
  {
    return $this->userService->getUserApi($data["id"]);
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
