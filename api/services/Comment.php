<?

namespace Services;

use PDO;



class CommentService
{
  private PDO $pdo;
  private array $config;

  private DataBaseService $dataBaseService;
  private LongPollingService $longPollingService;
  private NotificationService $notificationService;

  public function __construct(PDO $pdo, array $config)
  {
    $this->pdo = $pdo;
    $this->config = $config;
    // Подключить сервисы
    $this->dataBaseService = new DataBaseService($this->pdo);
    $this->longPollingService = new LongPollingService($this->config);
    $this->notificationService = new NotificationService($this->pdo, $this->config);
  }



  // Пересобрать таблицы БД
  public function createTableApi(string $password): bool
  {
    // Проверить секретный пароль
    if ($password == $this->config['appPassword']) {
      // Настройка таблиц
      return $this->dataBaseService->executeFromFile('comment/createTable.sql');
    }
    // Результат работы функции
    return false;
  }

  // Удалить таблицы БД
  public function deleteTableApi(string $password): bool
  {
    // Проверить секретный пароль
    if ($password == $this->config['appPassword']) {
      // Настройка таблиц
      return $this->dataBaseService->executeFromFile('comment/deleteTable.sql');
    }
    // Результат работы функции
    return false;
  }



  // Новый комментарий
  public function create(array $data, int $userId): int
  {
    $sqlData = array(
      'user_id' => intval($userId),
      'reply_to_user_id' => intval($data['replyToUserId'] ?? null),
      'material_type' => intval($data['materialType']),
      'material_id' => intval($data['materialId']),
      'material_owner' => intval($data['materialOwner']),
      'text' => strval($data['text']),
      'attachment' => $data['attachment'] ?? null
    );
    // Попытка сохранения
    if ($this->dataBaseService->executeFromFile('comment/send.php', $sqlData)) {
      $commentId = $this->pdo->lastInsertId();
      // Отправить в Long Polling
      $this->longPollingService->send(
        'comment/' . intval($data['materialType']) . '/' . intval($data['materialId']),
        array('commentId' => $commentId)
      );
      // Отправить уведомление
      $this->sendNotice(
        intval($data['materialType']),
        intval($data['materialId']),
        intval($data['materialOwner']),
        intval($userId)
      );
      // Вернуть ID
      return $commentId;
    }
    // Сновидение не сохранено
    return 0;
  }



  // Список комментариев
  public function getList(array $search): array
  {
    $count = 0;
    $result = array();
    $limit = $search['limit'] > 0 & $search['limit'] <= 100 ? $search['limit'] : $this->config['comments']['limit'];
    // Данные для поиска
    $sqlData = array(
      'material_type' => intval($search['material_type']),
      'material_id' => intval($search['material_id']),
    );
    // Запрос
    $count = $this->dataBaseService->getCountFromFile('comment/getListCount.sql', $sqlData);
    $skip = intval($search['skip']) ?? 0;
    // Сновидения найдены
    if ($count > 0) {
      $sqlData['limit_start'] = $skip;
      $sqlData['limit_length'] = intval($limit);
      // Список данных
      $result = $this->dataBaseService->getDatasFromFile('comment/getList.php', $sqlData);
    }
    // Сон не найден
    return array(
      'count' => $count,
      'limit' => $limit,
      'result' => $result
    );
  }

  // Информация об уведомлении
  public function get(int $commentId): array | null
  {
    if ($commentId > 0) {
      $notification = $this->dataBaseService->getDatasFromFile('comment/getById.sql', array($commentId));
      // Уведомление найдено
      if (count($notification) > 0) {
        if (isset($notification[0]['id']) && $notification[0]['id'] > 0) {
          return $notification[0];
        }
      }
    }
    // Уведомления не существует
    return null;
  }



  // Отправить уведомление
  private function sendNotice(int $materialType, int $materialId, int $materialOwner, int $userId): void
  {
    // Не отправлять самому себе
    if ($materialOwner !== $userId) {
      $text = '';
      $link = '';
      // Стена пользователя
      if ($materialType === 0) {
        $link = '/profile/' . $materialOwner;
        $text = '<a href="/profile/${user.id}">${user.name} ${user.lastName}</a> оставил${user.sexLetter} комментарий на вашей стене.';
      }
      // Комментарий к сновидению
      else {
        $link = '/diary/viewer/' . $materialId;
        $text = '<a href="/profile/${user.id}">${user.name} ${user.lastName}</a> прокомментировал${user.sexLetter} ваше сновидение.';
      }
      // Дополнить текст
      $text .= ' <a href="' . $link . '">Прочитать комментарий</a>';
      // Отправить уведомление
      $this->notificationService->create(
        $materialOwner,
        $text,
        $link,
        array('user' => $userId),
        'send_comment'
      );
    }
  }
}
