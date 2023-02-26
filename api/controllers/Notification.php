<?

namespace Controllers;

use PDO;
use Services\NotificationService;
use Services\TokenService;
use Decorators\CheckToken;
use Decorators\Request;

class Notification
{

  private $config;
  private PDO $pdo;

  private TokenService $tokenService;
  private NotificationService $notificationService;



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
    $this->notificationService = new NotificationService($this->pdo, $this->config);
  }



  // Список уведомлений
  #[Request('get'), CheckToken]
  public function getList(array $data): array
  {
    $currentUserId = $_GET['token_user_id'];
    $code = '0000';
    $responseData = array();
    $statuses = array(-1, 0, 1);
    $searchStatus = isset($data['search_status']) && strlen($data['search_status']) > 0 && array_search($data['search_status'], $statuses) !== false ?
      $data['search_status'] :
      $statuses[0];
    $search = array(
      'skip' => isset($data['search_skip']) && intval($data['search_skip']) > 0 ? intval($data['search_skip']) : 0,
      'limit' => isset($data['search_limit']) && intval($data['search_limit']) ? intval($data['search_limit']) : '',
      'status' => $searchStatus
    );
    $testNotifications = $this->notificationService->getList($search, $currentUserId);
    $notifications = array();
    // Заявки найдены
    if ($testNotifications['count'] > 0) {
      $code = '0001';
      // Обработка списка
      foreach ($testNotifications['result'] as $notification) {
        $notifications[] = $notification;
      }
    }
    // Заявки не найдены
    else {
      $code = '0002';
    }
    // Данные
    $responseData = array(
      'count' => $testNotifications['count'],
      'limit' => $testNotifications['limit'],
      'notifications' => $notifications
    );
    // Вернуть результат
    return array(
      'data' => $responseData,
      'code' => $code
    );
  }

  // Отметить уведомления как прочитанные
  #[Request('post'), CheckToken]
  public function readByIds(array $data): array
  {
    $currentUserId = $_GET['token_user_id'];
    $result = false;
    $code = '0000';
    $ids = explode(",", $data['ids']);
    $count = is_array($ids) ? count($ids) : 0;
    $successCount = 0;
    // ID's уведомлений переданы
    if ($count > 0) {
      foreach ($ids as $id) {
        if ($this->notificationService->read($id, $currentUserId)) {
          $successCount += 1;
        }
      }
      // Все уведомления отмечены
      if ($successCount === $count) {
        $code = '0001';
        $result = true;
      }
      // Не все уведомления прочитаны
      else {
        $code = '0004';
      }
    }
    // ID's не переданы
    else {
      $code = '1000';
    }
    // Вернуть результат
    return array(
      'data' => $result,
      'in' => $count,
      'code' => $code
    );
  }
}



return new Notification();
