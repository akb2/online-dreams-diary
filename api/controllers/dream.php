<?

namespace Controllers;

use Decorators\CheckToken;
use Decorators\Request;
use Services\DreamService;
use Services\TokenService;
use Services\UserSettingsService;
use PDO;



class Dream
{

  private array $config;
  private PDO $pdo;

  private DreamService $dreamService;
  private TokenService $tokenService;
  private UserSettingsService $userSettingsService;



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
    $this->dreamService = new DreamService($this->pdo, $this->config);
    $this->tokenService = new TokenService($this->pdo, $this->config);
    $this->userSettingsService = new UserSettingsService($this->pdo, $this->config);
  }



  // Сохранение сновидения
  #[Request('post'), CheckToken]
  public function save($data): array
  {
    $id = 0;
    $code = '7001';
    $userId = $_SERVER['TOKEN_USER_ID'];
    $dream = $this->dreamService->getById($data['id'], $userId);
    // Переписать старое
    if (isset($dream['id']) && $dream['id'] > 0) {
      $id = $this->dreamService->updateDream($data);
    }
    // Новое сновидение
    else {
      $id = $this->dreamService->createDream($data);
    }
    // Обновить код
    $code = $id > 0 ? '0001' : $code;
    // Сновидение не сохранено
    return array(
      'code' => $code,
      'data' => $id
    );
  }

  // Получить список
  #[Request('get')]
  public function getList($data): array
  {
    $data['search_ids'] = isset($data['search_ids']) && strlen($data['search_ids']) > 0 ? explode(',', $data['search_ids']) : array();
    $data['search_excludeIds'] = isset($data['search_excludeIds']) && strlen($data['search_excludeIds']) > 0 ? explode(',', $data['search_excludeIds']) : array();
    // Параметры
    $code = '0002';
    $userId = $_SERVER['TOKEN_USER_ID'];
    $token = $_COOKIE['api-token'] ?? '';
    $search = array(
      'ids' => $data['search_ids'] ?? null,
      'exclude_ids' => $data['search_excludeIds'] ?? null,
      'q' => $data['search_q'] ?? null,
      'page' => $data['search_page'] ?? 1,
      'user' => $data['search_user'] ?? null,
      'limit' => $data['search_limit'] ?? null,
      'status' => $data['search_status'] ?? -1
    );
    $testDreams = $this->dreamService->getList($search, $token, $userId);
    $dreams = array();
    $hasAccess = false;
    // Сновидение найдено
    if ($testDreams['count'] > 0) {
      ['code' => $code, 'dreams' => $dreams] = $this->checkUserDataPrivate($testDreams['result'], intval($search['user']), $userId);
    }
    // Сновидение не найдено
    else {
      $code = '0002';
    }
    // Обработка данных
    $testDreams['count'] = $code !== '8100' && isset($testDreams['count']) ? $testDreams['count'] : 0;
    $hasAccess = $code !== '8100';
    // Вернуть результат
    return array(
      'data' => array(
        'count' => $testDreams['count'],
        'limit' => $testDreams['limit'],
        'dreams' => $dreams,
        'hasAccess' => $hasAccess
      ),
      'code' => $code
    );
  }

  // Получить сновидение
  #[Request('get'), CheckToken(true)]
  public function getById($data): array
  {
    $code = '0002';
    $userId = $_SERVER['TOKEN_USER_ID'] ?? '';
    $edit = $_GET['edit'] === 'true';
    $testDream = $this->dreamService->getById($data['id']);
    $dream = array();
    // Сновидение найдено
    if (isset($testDream['id']) && $testDream['id'] > 0) {
      // Доступность для просмотра или редактирования
      if ($this->dreamService->checkAvail($testDream['id'], $userId, $edit)) {
        $code = '0001';
        $dream = array(
          'id' => intval($testDream['id']),
          'userId' => intval($testDream['user_id']),
          'createDate' => $testDream['create_date'],
          'date' => $testDream['date'],
          'title' => $testDream['title'],
          'description' => $testDream['description'],
          'keywords' => $testDream['keywords'],
          'text' => $testDream['text'],
          'places' => $testDream['places'],
          'members' => $testDream['members'],
          'map' => $testDream['map'],
          'mode' => intval($testDream['mode']),
          'type' => intval($testDream['type']),
          'mood' => intval($testDream['mood']),
          'status' => intval($testDream['status']),
          'headerType' => $testDream['header_type'],
          'headerBackgroundId' => intval($testDream['header_background'])
        );
      }
      // Нельяз смотреть
      else {
        $code = '7002';
      }
    }
    // Сновидение не найдено
    else {
      $code = '0002';
    }
    // Вернуть результат
    return array(
      'data' => $dream,
      'code' => $code
    );
  }

  // Удалить сновидение
  #[Request('post'), CheckToken]
  public function delete($data): array
  {
    $code = '7004';
    $isDelete = false;
    $userId = $_SERVER['TOKEN_USER_ID'];
    // Проверка идентификатора
    if (isset($data['id']) && $data['id'] > 0) {
      $isDelete = $this->dreamService->delete($data['id'], $userId);
      $code = $isDelete ? '0001' : '7005';
    }
    // Сон не найден
    else {
      $code = '0002';
    }
    // Вернуть результат
    return array(
      'data' => array(
        'isDelete' => $isDelete
      ),
      'code' => $code
    );
  }



  // Проверка доступа к дневнику пользователя
  private function checkUserDataPrivate(array $dreamsData, int $userId, $currentUserId): array
  {
    $code = '8100';
    $dreams = null;
    // Данные определены
    if (is_array($dreamsData)) {
      // Проверка данных
      if ($userId <= 0 || $this->userSettingsService->checkPrivate('myDreamList', $userId, intval($currentUserId))) {
        $code = '0001';
        $dreams = array();
        // Обработать список сновидений
        foreach ($dreamsData as $dream) {
          $dreams[] = array(
            'id' => intval($dream['id']),
            'userId' => intval($dream['user_id']),
            'createDate' => $dream['create_date'],
            'date' => $dream['date'],
            'title' => $dream['title'],
            'description' => $dream['description'],
            'keywords' => $dream['keywords'],
            'text' => isset($dream['text']) ? $dream['text'] : '',
            'places' => isset($dream['places']) ? $dream['places'] : '',
            'members' => isset($dream['members']) ? $dream['members'] : '',
            'map' => isset($dream['map']) ? $dream['map'] : '',
            'mode' => intval($dream['mode']),
            'type' => intval($dream['type']),
            'mood' => intval($dream['mood']),
            'status' => intval($dream['status']),
            'headerType' => $dream['header_type'],
            'headerBackgroundId' => intval($dream['header_background'])
          );
        }
      }
    }
    // Ошибка
    return array(
      'code' => $code,
      'dreams' => $dreams
    );
  }
}


return new Dream();
