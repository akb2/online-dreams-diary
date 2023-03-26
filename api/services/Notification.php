<?

namespace Services;

use PDO;



class NotificationService
{
  private PDO $pdo;
  private array $config;

  private DataBaseService $dataBaseService;
  private LongPollingService $longPollingService;
  private UserService $userService;
  private MailService $mailService;

  public function __construct(PDO $pdo, array $config)
  {
    $this->pdo = $pdo;
    $this->config = $config;
    // Подключить сервисы
    $this->dataBaseService = new DataBaseService($this->pdo);
    $this->longPollingService = new LongPollingService($this->config);
    $this->userService = new UserService($this->pdo, $this->config);
    $this->mailService = new MailService($this->config);
  }



  // Новое уведомление
  public function create(int $userId, string $text, string $link = '', array $data = array(), string $actionType = ''): bool
  {
    if ($userId > 0 && strlen($text) > 0) {
      $sqlData = array(
        'user_id' => $userId,
        'text' => $text,
        'link' => $link,
        'action_type' => $actionType,
        'data' => json_encode($data),
        'diff_time' => $this->config['notifications']['noRepeatTime']
      );
      $result = false;
      ['site' => $ruleSite, 'email' => $ruleEmail] = $this->checkNotificationSettings($userId, $actionType);
      // Отправка уведомления внутри сайта
      if ($ruleSite) {
        $notificationId = 0;
        $check = $this->dataBaseService->getDatasFromFile('notification/getByData.php', $sqlData);
        // Уведомление уже есть
        if (isset($check[0]['id']) && $check[0]['id'] > 0) {
          $notificationId = $check[0]['id'];
          $sqlData['id'] = $notificationId;
          $result = $this->dataBaseService->executeFromFile('notification/update.sql', $sqlData);
        }
        // Создать запись
        else {
          $result = $this->dataBaseService->executeFromFile('notification/create.sql', $sqlData);
          $notificationId = $this->pdo->lastInsertId();
        }
        // Отправить в Long Polling
        if ($notificationId > 0) {
          $this->sendNotificationToLongPolling($notificationId);
        }
      }
      // Отправка письма на почту
      if ($ruleEmail) {
        $user = $this->userService->getUser($userId);
        $mailParams = array(
          'name' => $user['name']
        );
        // Данные о пользователе
        if (!!$data['user']) {
          $actionUser = $this->userService->getUser($data['user']);
        }
        // Данные для комментариев
        if ($actionType === 'send_comment') {
          $mailParams['authorName'] = $actionUser['name'];
          $mailParams['authorLastName'] = $actionUser['lastName'];
          $mailParams['authorImage'] = $actionUser['avatars']['small'] ?? $this->config['appDomain'] . '/assets/images/avatars/user-small.jpg';
          $mailParams['authorlink'] = $this->config['appDomain'] . '/profile/' . $actionUser['id'];
          $mailParams['commentlink'] = $this->config['appDomain'] . $link;
          $mailParams['commentDate'] = date('j.n.Y - G:i');
        }
        // Данные для заявок в друзья
        if ($actionType === 'add_to_friend') {
          $mailParams['authorName'] = $actionUser['name'];
          $mailParams['authorLastName'] = $actionUser['lastName'];
          $mailParams['authorImage'] = $actionUser['avatars']['small'] ?? $this->config['appDomain'] . '/assets/images/avatars/user-middle.jpg';
          $mailParams['authorlink'] = $this->config['appDomain'] . '/profile/' . $actionUser['id'];
        }
        // Заголовки
        $titles = array(
          'security' => 'Уведомление системы безопасности',
          'add_to_friend' => 'Заявка в друзья',
          'send_comment' => 'Новый комментарий'
        );
        // Отправить
        $this->mailService->send('notifications/' . $actionType, $user['email'], $titles[$actionType], $mailParams);
      }
    }
    // Уведоммление не создано
    return $result;
  }

  // Пометить как прочитанное
  public function read(int $id, int $userId): bool
  {
    if ($id > 0 && $userId > 0) {
      $sqlData = array('id' => $id, 'user_id' => $userId);
      // Запрос
      return $this->dataBaseService->executeFromFile('notification/setAsViewed.sql', $sqlData);
    }
    // Ничего не сделано
    return false;
  }



  // Информация об уведомлении
  public function get(int $notificationId): array | null
  {
    if ($notificationId > 0) {
      $notification = $this->dataBaseService->getDatasFromFile('notification/getById.sql', array($notificationId));
      // Уведомление найдено
      if (count($notification) > 0) {
        if (isset($notification[0]['id']) && $notification[0]['id'] > 0) {
          return $this->convert($notification[0]);
        }
      }
    }
    // Уведомления не существует
    return null;
  }

  // Информация об уведомлении
  public function getList(array $search, int $currentUserId): array
  {
    $count = 0;
    $result = array();
    $skip = $search['skip'] > 0 ? $search['skip'] : 0;
    $limit = $search['limit'] > 0 && $search['limit'] <= 100 ? $search['limit'] : $this->config['notifications']['limit'];
    // Проверка данных
    if ($currentUserId > 0) {
      $statuses = array(-1, 0, 1);
      // Данные для поиска
      $sqlData = array(
        // Значения полей
        'ids' => $search['ids'],
        'exclude_ids' => $search['exclude_ids'],
        'status' => array_search($search['status'], $statuses) ? $search['type'] : $statuses[0],
        'last_id' => isset($search['last_id']) && intval($search['last_id']) > 0 ? $search['last_id'] : 0,
        'user_id' => $currentUserId
      );
      // Запрос
      $count = $this->dataBaseService->getCountFromFile('notification/getListCount.php', $sqlData);
      // Друзья найдены
      if ($count > 0) {
        $sqlData['limit_start'] = intval($skip);
        $sqlData['limit_length'] = intval($limit);
        $testDatas = $this->dataBaseService->getDatasFromFile('notification/getList.php', $sqlData);
        // Список данных
        foreach ($testDatas as $testData) {
          $result[] = $this->convert($testData);
        }
      }
    }
    // Список данных
    return array(
      'count' => $count,
      'limit' => $limit,
      'result' => $result
    );
  }



  // Конвертация уведомления для фронтенда
  private function convert(array $data): array
  {
    $defaultDate = date('Y-m-d\TH:i:s\ZO', 0);
    // Вернуть модель
    return array(
      'id' => intval($data['id']),
      'userId' => intval($data['user_id']),
      'status' => intval($data['status']),
      'createDate' => $data['create_date'] ?? $defaultDate,
      'text' => $data['text'],
      'link' => $data['link'],
      'actionType' => $data['action_type'],
      'data' => json_decode($data['data'], false)
    );
  }

  // Отправить данные подписчикам LongPolling
  public function sendNotificationToLongPolling(int $notificationId): void
  {
    $notification = $this->get($notificationId);
    $this->longPollingService->send('notification/new/' . $notification['userId'], array('notificationId' => $notificationId));
  }

  // Проверить возможность отправления уведомления
  public function checkNotificationSettings(int $userId, string $actionType = ''): array
  {
    $site = false;
    $email = false;
    $user = $this->userService->getUser($userId);
    $requred = array(
      'security' => array('site' => true, 'email' => true),
      'add_to_friend' => array('site' => true),
      'send_comment' => array('site' => true),
    );
    // Загрузка данных
    if (!!$user && !!$actionType) {
      $requiredSite = $requred[$actionType]['site'] ?? null;
      $requiredEmail = $requred[$actionType]['email'] ?? null;
      $userSite = $user['settings']['notifications'][$actionType]['site'] ?? true;
      $userEmail = $user['settings']['notifications'][$actionType]['email'] ?? true;
      $site = $requiredSite === true || $requiredSite === false ? $requiredSite : $userSite;
      $email = $requiredEmail === true || $requiredEmail === false ? $requiredEmail : $userEmail;
    }
    // Вернуть результат
    return array(
      'site' => $site,
      'email' => $email
    );
  }
}
