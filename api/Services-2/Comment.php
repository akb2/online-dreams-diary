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
    $replyToUserId = intval($data['replyToUserId'] ?? null);
    $materialOwner = intval($data['materialOwner']);
    $sqlData = array(
      'user_id' => intval($userId),
      'reply_to_user_id' => $replyToUserId,
      'material_type' => intval($data['materialType']),
      'material_id' => intval($data['materialId']),
      'material_owner' => $materialOwner,
      'text' => strval($data['text']),
      'attachment' => !!$data['attachment'] ? json_encode($data['attachment']) : null
    );
    // Попытка сохранения
    if ($this->dataBaseService->executeFromFile('comment/send.php', $sqlData)) {
      $commentId = $this->pdo->lastInsertId();
      // Отправить в Long Polling
      $this->longPollingService->send(
        'comment/' . intval($data['materialType']) . '/' . intval($data['materialId']),
        array('commentId' => $commentId)
      );
      // Отправить уведомление владельцу
      $this->sendNotice(
        intval($data['materialType']),
        intval($data['materialId']),
        $materialOwner,
        intval($userId),
        intval($commentId)
      );
      // Отправить уведомление адресату
      if ($replyToUserId > 0 && $replyToUserId != $materialOwner) {
        $this->sendNotice(
          intval($data['materialType']),
          intval($data['materialId']),
          $materialOwner,
          intval($userId),
          intval($commentId),
          $replyToUserId
        );
      }
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
    $prevCount = 0;
    $nextCount = 0;
    // Данные для поиска
    $sqlData = array(
      'start_with_id' => intval($search['start_with_id']),
      'material_type' => intval($search['material_type']),
      'material_id' => intval($search['material_id']),
      'load_list_type' => intval($search['load_list_type']),
      'last_id' => intval($search['last_id']),
      'last_date' => strval($search['last_date']),
    );
    // Запрос
    $count = $this->dataBaseService->getCountFromFile('comment/getListCount.sql', $sqlData);
    // Сновидения найдены
    if ($count > 0) {
      $sqlData['limit_length'] = intval($limit);
      $prevNextLoad = $sqlData['load_list_type'] == 1 || $sqlData['load_list_type'] == -1 && $sqlData['last_id'] > 0 && !!$sqlData['last_date'];
      $nextLoad = $prevNextLoad && $sqlData['load_list_type'] == 1;
      $getCommentsSqlFile = '';
      // Загрузка следующих или предыдущих комментариев
      if ($prevNextLoad) {
        $getCommentsSqlFile = $nextLoad ? 'comment/getNextList.sql' : 'comment/getPrevList.sql';
      }
      // Стартовый список
      else {
        $generalSearch = true;
        // Определение данных
        if ($sqlData['start_with_id'] > 0) {
          $startWith = $this->get($sqlData['start_with_id']);
          $generalSearch = !$startWith || intval($startWith['material_type']) != $sqlData['material_type'] || intval($startWith['material_id']) != $sqlData['material_id'];
        }
        // Список данных
        $getCommentsSqlFile = $generalSearch ? 'comment/getList.sql' : 'comment/getListStartFromId.sql';
      }
      // Запрос комментариев
      $result = $this->dataBaseService->getDatasFromFile($getCommentsSqlFile, $sqlData);
      // Подсчитать оставшиеся коммантарии
      if (!!$result && is_array($result) && count($result) > 0) {
        $prevIndex = $nextLoad ? 0 : count($result) - 1;
        $nextIndex =  $nextLoad ? count($result) - 1 : 0;
        // Подсчитать предыдщие комментарии
        $prevSqlData = array_merge($sqlData, array(
          'id' => $result[$prevIndex]['id'],
          'create_date' => $result[$prevIndex]['create_date']
        ));
        // Подсчитать следующие комментарии
        $nextSqlData = array_merge($sqlData, array(
          'id' => $result[$nextIndex]['id'],
          'create_date' => $result[$nextIndex]['create_date']
        ));
        $prevCount = $this->dataBaseService->getCountFromFile('comment/getPrevListCount.sql', $prevSqlData);
        $nextCount = $this->dataBaseService->getCountFromFile('comment/getNextListCount.sql', $nextSqlData);
      }
    }
    // Сон не найден
    return array(
      'count' => $count,
      'limit' => $limit,
      'result' => $result,
      'prevCount' => $prevCount,
      'nextCount' => $nextCount
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
  private function sendNotice(int $materialType, int $materialId, int $materialOwner, int $userId, int $commentId, int $replyToUserId = 0): void
  {
    // Не отправлять самому себе
    if ($materialOwner !== $userId || ($replyToUserId > 0 && $replyToUserId !== $userId)) {
      $destinationUser = $materialOwner;
      $text = '';
      $link = '';
      // Стена пользователя
      if ($materialType === 0) {
        $link = '/profile/' . $materialOwner . '?goToComment=' . $commentId;
        $text = '<a href="/profile/${user.id}">${user.name} ${user.lastName}</a> оставил${user.sexLetter} комментарий на вашей стене.';
      }
      // Комментарий к сновидению
      else {
        $link = '/diary/viewer/' . $materialId . '?goToComment=' . $commentId;
        $text = '<a href="/profile/${user.id}">${user.name} ${user.lastName}</a> прокомментировал${user.sexLetter} ваше сновидение.';
      }
      // Ответ на комментарий
      if ($replyToUserId > 0) {
        $text = '<a href="/profile/${user.id}">${user.name} ${user.lastName}</a> написал ответ на ваш комментарий.';
        $destinationUser = $replyToUserId;
      }
      // Дополнить текст
      $text .= ' <a href="' . $link . '">Прочитать комментарий</a>';
      // Отправить уведомление
      $this->notificationService->create(
        $destinationUser,
        $text,
        $link,
        array('user' => $userId, 'comment' => $commentId),
        'send_comment'
      );
    }
  }
}
