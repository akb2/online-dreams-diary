<?

namespace Decorators;

use Attribute;
use PDO;
use Services\TokenService;



#[Attribute(Attribute::IS_REPEATABLE | Attribute::TARGET_METHOD)]
class CheckToken
{
  private PDO $pdo;
  private array $config;

  private TokenService $tokenService;

  private bool $anonimusAvail;
  private string $userId;
  private string $token;



  public function __construct(bool $anonimusAvail = false)
  {
    $this->userId = $_SERVER['TOKEN_USER_ID'];
    $this->token = $_COOKIE['api-token'] ?? '';
    $this->anonimusAvail = !!$anonimusAvail;
  }

  // Получить настройки приложения
  public function setConfig(array $config): void
  {
    $this->config = $config;
  }

  // Получить настройки БД
  public function setDbContext(PDO $pdo): void
  {
    $this->pdo = $pdo;
  }

  // Запуск сервисов
  public function setServices(): void
  {
    $this->tokenService = new TokenService($this->pdo, $this->config);
  }



  // Преобразование
  public function execute(array $data): array|true
  {
    $code = '0000';
    $isAnonimus = $this->anonimusAvail && !$this->token;
    // Проверить токен
    if ($this->tokenService->checkToken($this->userId, $this->token) || $isAnonimus) {
      // Проверка доступа
      if ($this->userId == $this->tokenService->getUserIdFromToken($this->token) || $isAnonimus) {
        return true;
      }
      // Ошибка доступа
      else {
        $code = '9040';
      }
    }
    // Неверный токен
    else {
      $code = '9015';
    }
    // Вернуть результат
    return array(
      'data' => array(),
      'code' => $code
    );
  }
}
