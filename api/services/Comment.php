<?

namespace Services;

use PDO;



class CommentService
{
  private PDO $pdo;
  private array $config;

  private DataBaseService $dataBaseService;
  private TokenService $tokenService;
  private FriendService $friendService;
  private LongPollingService $longPollingService;

  public function __construct(PDO $pdo, array $config)
  {
    $this->pdo = $pdo;
    $this->config = $config;
    // Подключить сервисы
    $this->dataBaseService = new DataBaseService($this->pdo);
    $this->tokenService = new TokenService($this->pdo, $this->config);
    $this->friendService = new FriendService($this->pdo, $this->config);
    $this->longPollingService = new LongPollingService($this->config);
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
}
