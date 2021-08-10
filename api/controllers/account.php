<?

namespace OnlineDreamsDiary\Controllers;

include_once "services/recaptcha.php";
include_once "services/database.php";
include_once "services/user.php";
include_once "config/database.php";

use OnlineDreamsDiary\Services\ReCaptchaService;
use OnlineDreamsDiary\Services\DataBaseService;
use OnlineDreamsDiary\Services\UserService;
use PDO;



class Account
{

  private array $config;
  private PDO $pdo;

  private UserService $userService;



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
  }



  // Создание таблиц
  // * POST
  public function createTable($data): array
  {
    return $this->userService->createTableApi($data["password"]);
  }

  // Проверка токена
  // * POST
  public function checkToken($data): array
  {
    return $this->userService->checkTokenApi($data);
  }

  // Удалить токен
  // * DELETE
  public function deleteToken($data): array
  {
    return $this->userService->deleteTokenApi($data["token"]);
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
    if ($this->userService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->userService->getUserIdFromToken($token)) {
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
    if ($this->userService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->userService->getUserIdFromToken($token)) {
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
}


return new Account();
