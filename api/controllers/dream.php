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
    $userId = $_GET['token_user_id'];
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
    $code = '0002';
    $userId = $_GET['token_user_id'];
    $token = $_COOKIE['api-token'];
    $search = array(
      'page' => isset($data['search_page']) && strlen($data['search_page']) > 0 ? $data['search_page'] : '',
      'user' => isset($data['search_user']) && strlen($data['search_user']) > 0 ? $data['search_user'] : '',
      'limit' => isset($data['search_limit']) && strlen($data['search_limit']) > 0 ? $data['search_limit'] : '',
      'status' => isset($data['search_status']) && strlen($data['search_status']) > 0 ? $data['search_status'] : ''
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
  #[Request('get'), CheckToken]
  public function getById($data): array
  {
    $code = '0002';
    $userId = $_GET['token_user_id'];
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
    $userId = $_GET['token_user_id'];
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
