<?

namespace Controllers;

use Decorators\CheckToken;
use Decorators\Request;
use PDO;
use Services\CommentService;
use Services\MediaService;
use Services\UserSettingsService;

class Comment
{

  private array $config;
  private PDO $pdo;

  private CommentService $commentService;
  private UserSettingsService $userSettingsService;
  private MediaService $mediaService;



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
    $this->userSettingsService = new UserSettingsService($this->pdo, $this->config);
    $this->mediaService = new MediaService($this->pdo, $this->config);
  }



  // Отправка комментария
  #[Request('post'), CheckToken]
  public function send(array $data): array
  {
    $code = '5001';
    $userId = $_SERVER['TOKEN_USER_ID'];
    $ownerId = $data['materialOwner'];
    // Проверка доступа
    if ($this->userSettingsService->checkPrivate('myCommentsWrite', $ownerId, $userId)) {
      $data['attachment'] = $data['attachment'] ?? array();
      // Создание медиафайла для графити
      if (!!$_FILES['graffityUpload']) {
        $graffityMediaId = $this->mediaService->createFromUpload($_FILES['graffityUpload'], 'графити');
        // Файл граффити создан
        if ($graffityMediaId > 0) {
          $data['attachment']['graffity'] = $graffityMediaId;
        }
      }
      // Отправка комментария
      $id = $this->commentService->create($data, $userId);
      // Обновить код
      $code = $id > 0 ? '0001' : $code;
    }
    // Нет доступа
    else {
      $code = '8103';
    }
    // Комментарий не отправлен
    return array(
      'code' => $code,
      'data' => $id
    );
  }



  // Список комментариев
  #[Request('get'), CheckToken(true)]
  public function getList(array $data): array
  {
    $comments = array();
    $hasAccess = true;
    $code = '0002';
    $userId = intval($_SERVER['TOKEN_USER_ID']) ?? 0;
    $search = array(
      'material_type' => $data['search_materialType'] ?? 0,
      'material_id' => $data['search_materialId'] ?? 0,
      'limit' => $data['search_limit'] ?? 0,
      'skip' => $data['search_skip'] ?? 0
    );
    $testComments = $this->commentService->getList($search);
    $comments = array();
    // Сновидение найдено
    if ($testComments['count'] > 0) {
      ['code' => $code, 'comments' => $comments] = $this->checkUserDataPrivate($testComments['result'], $userId);
    }
    // Сновидение не найдено
    else {
      $code = '0002';
    }
    // Обработка данных
    $testComments['count'] = $code !== '8100' && isset($testComments['count']) ? $testComments['count'] : 0;
    // Вернуть результат
    return array(
      'data' => array(
        'count' => $testComments['count'],
        'limit' => $testComments['limit'],
        'comments' => $comments,
        'hasAccess' => $hasAccess
      ),
      'code' => $code
    );
  }

  // Информация об уведомлении по ID
  #[Request('get'), CheckToken(true)]
  public function getById(array $data): array
  {
    $commentId = intval($data['comment_id'] ?? "0");
    $code = '0000';
    $userId = $_SERVER['TOKEN_USER_ID'];
    $testComment = $this->commentService->get($commentId);
    $result = array();
    // Проверка доступа
    if (!!$testComment) {
      ['code' => $code, 'comments' => $result] = $this->checkUserDataPrivate(array($testComment), $userId);
      $result = $result[0] ?? array();
    }
    // Комментарий не найден
    else {
      $code = '0002';
    }
    // Вернуть результат
    return array(
      'data' => $result,
      'code' => $code
    );
  }



  // Проверка доступа к комментарию
  private function checkUserDataPrivate(array $commentsData, int $userId): array
  {
    $code = '8100';
    $comments = null;
    // Данные определены
    if (is_array($commentsData)) {
      $code = '0001';
      $comments = array();
      // Обработать список сновидений
      foreach ($commentsData as $comment) {
        if ($this->userSettingsService->checkPrivate('myCommentsRead', intval($comment['material_owner']), $userId)) {
          $comment['attachment'] = json_decode($comment['attachment'], true);
          $graffityId = intval($comment['attachment']['graffity'] ?? 0);
          // Загрузка данных о графити
          if ($graffityId > 0) {
            $comment['attachment']['graffity'] = $this->mediaService->getById($graffityId);
          }
          // Данные комментария
          $comments[] = array(
            'id' => intval($comment['id']),
            'userId' => intval($comment['user_id']),
            'replyToUserId' => intval($comment['reply_to_user_id']),
            'materialType' => intval($comment['material_type']),
            'materialId' => intval($comment['material_id']),
            'materialOwner' => intval($comment['material_owner']),
            'text' => $comment['text'],
            'createDate' => $comment['create_date'],
            'attachment' => $comment['attachment']
          );
        }
        // Нет доступа
        else {
          $comments = array();
          $code = '8104';
          // остановить
          break;
        }
      }
    }
    // Ошибка
    return array(
      'code' => $code,
      'comments' => $comments
    );
  }
}


return new Comment();
