<?

namespace Services;

use PDO;



class NotificationService
{
  private PDO $pdo;
  private array $config;

  private DataBaseService $dataBaseService;

  public function __construct(PDO $pdo, array $config)
  {
    $this->pdo = $pdo;
    $this->config = $config;
    // Подключить сервисы
    $this->dataBaseService = new DataBaseService($this->pdo);
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
      $check = $this->dataBaseService->getDatasFromFile('notification/getByData.php', $sqlData);
      // Уведомление уже есть
      if (isset($check[0]['id']) && $check[0]['id'] > 0) {
        $sqlData['id'] = $check[0]['id'];
        // Запрос
        return $this->dataBaseService->executeFromFile('notification/update.sql', $sqlData);
      }
      // Создать запись
      else {
        return $this->dataBaseService->executeFromFile('notification/create.sql', $sqlData);
      }
    }
    // Уведоммление не создано
    return false;
  }



  // Информация об уведомлении
  public function get(int $notificationId): array
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
}
