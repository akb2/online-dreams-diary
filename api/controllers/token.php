<?

namespace Controllers;

use Services\TokenService;
use PDO;



class Token
{

  private array $config;
  private PDO $pdo;

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
    $this->tokenService = new TokenService($this->pdo, $this->config);
  }



  // Проверка токена
  // * GET
  public function checkToken($data): array
  {
    return $this->tokenService->checkTokenApi($data);
  }

  // Удалить токен
  // * POST
  public function deleteToken($data): array
  {
    return $this->tokenService->deleteTokenApi($data["token"]);
  }

  // Сведения о токене
  // * GET
  public function getToken($data): array
  {
    return $this->tokenService->getTokenApi($data);
  }

  // Сведения о токенах
  // * GET
  public function getTokens($data): array
  {
    return $this->tokenService->getTokensApi($data);
  }

  // Удалить токен по ID токена
  // * POST
  public function deleteTokenById($data): array
  {
    $code = "0000";
    $id = $data["token_user_id"];
    $token = $data["token"];

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        return $this->tokenService->deleteTokenByIdApi($data["tokenId"]);
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

  // Удалить токен по ID пользователя
  // * POST
  public function deleteTokensByUser($data): array
  {
    $code = "0000";
    $id = $data["token_user_id"];
    $token = $data["token"];
    $hideCurrent = !!$data["hideCurrent"];

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        return $this->tokenService->deleteTokensByUserApi($id, $hideCurrent, $token);
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


return new Token();
