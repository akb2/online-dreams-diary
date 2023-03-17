<?

namespace Controllers;

use Decorators\CheckToken;
use Decorators\Request;
use PDO;
use Services\CommentService;

class Comment
{

  private array $config;
  private PDO $pdo;

  private CommentService $commentService;



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
    $this->commentService = new CommentService($this->pdo, $this->config);
  }



  // Отправка комментария
  #[Request('post'), CheckToken]
  public function send(array $data): array
  {
    $code = '5001';
    $userId = $_SERVER['TOKEN_USER_ID'];
    $id = $this->commentService->create($data, $userId);
    // Обновить код
    $code = $id > 0 ? '0001' : $code;
    // Комментарий не отправлен
    return array(
      'code' => $code,
      'data' => $id
    );
  }
}


return new Comment();
