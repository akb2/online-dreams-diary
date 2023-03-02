<?

namespace Controllers;

use Decorators\CheckToken;
use Decorators\Request;
use Services\TokenService;
use PDO;
use Services\UserService;

class Token
{

  private array $config;
  private PDO $pdo;

  private TokenService $tokenService;
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
    $this->tokenService = new TokenService($this->pdo, $this->config);
    $this->userService = new UserService($this->pdo, $this->config);
  }



  // Проверка токена
  #[Request('get')]
  public function checkToken($data): array
  {
    $response = $this->tokenService->checkTokenApi($data);
    ['code' => $code] = $response;
    // Отправить данные о пользователе подписчикам Long Polling
    if ($code === '0001') {
      ['data' => ['tokenData' => ['user_id' => $userId]]] = $response;
      $this->userService->sendUserToLongPolling($userId);
    }
    // Вернуть данные
    return $response;
  }

  // Удалить токен
  #[Request('post'), CheckToken]
  public function deleteToken($data): array
  {
    return $this->tokenService->deleteTokenApi($_COOKIE['api-token'] ?? '');
  }

  // Сведения о токене
  #[Request('get'), CheckToken]
  public function getToken($data): array
  {
    return $this->tokenService->getTokenApi($data);
  }

  // Сведения о токенах
  #[Request('get'), CheckToken]
  public function getTokens($data): array
  {
    return $this->tokenService->getTokensApi($data);
  }

  // Удалить токен по ID токена
  #[Request('post'), CheckToken]
  public function deleteTokenById($data): array
  {
    return $this->tokenService->deleteTokenByIdApi($data['tokenId']);
  }

  // Удалить токен по ID пользователя
  #[Request('post'), CheckToken]
  public function deleteTokensByUser($data): array
  {
    $id = $_SERVER['TOKEN_USER_ID'];
    $token = $_COOKIE['api-token'] ?? '';
    $hideCurrent = !!$data['hideCurrent'];
    // Удаление токена
    return $this->tokenService->deleteTokensByUserApi($id, $hideCurrent, $token);
  }
}


return new Token();
