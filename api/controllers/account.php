<?

namespace Controllers;

use Services\UserService;
use Services\UserSettingsService;
use Services\TokenService;
use Services\LongPollingService;
use PDO;



class Account
{

  private array $config;
  private PDO $pdo;

  private UserService $userService;
  private TokenService $tokenService;
  private UserSettingsService $userSettingsService;
  private LongPollingService $longPollingService;



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
    $this->userService = new UserService($this->pdo, $this->config);
    $this->tokenService = new TokenService($this->pdo, $this->config);
    $this->userSettingsService = new UserSettingsService($this->pdo, $this->config);
    $this->longPollingService = new LongPollingService($this->config);
  }



  // Авторизация пользователя
  // * POST
  public function auth($data): array
  {
    return $this->userService->authUserApi($data);
  }

  // Регистрация пользователя
  // * POST
  public function register($data): array
  {
    return $this->userService->registerUserApi($data);
  }

  // Активация аккаунта
  // * POST
  public function activate($data): array
  {
    return $this->userService->accountActivateApi($data);
  }

  // Проверить настройку приватности
  // * POST
  public function checkPrivate(array $dataIn): array
  {
    $code = '0000';
    $id = $_GET['token_user_id'];
    $token = $_GET['token'];
    $dataOut = false;

    // Проверка входящих данных
    if (strlen($dataIn['rule']) > 0 & strlen($dataIn['user']) > 0) {
      // Проверка токена
      if ($this->tokenService->checkToken($id, $token) || (!strlen($id) && !strlen($token))) {
        $dataOut = $this->userSettingsService->checkPrivate($dataIn['rule'], $dataIn['user'], intval($id) ?? 0);
        // Доступ разрешен
        if ($dataOut) {
          $code = '0001';
        }
        // Доступ не разрешен
        else {
          $code = '8100';
        }
      }
      // Неверный токен
      else {
        $code = '9015';
      }
    }
    // Переданы пустые/неполные данные
    else {
      $code = '1000';
    }

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => '',
      'data' => $dataOut
    );
  }

  // Создание ключа активации аккаунта
  public function createActivationCode(array $data): array
  {
    return $this->userService->createActivationCodeApi($data);
  }



  // Поиск
  // * GET
  public function search($data): array
  {
    $data['search_ids'] = isset($data['search_ids']) && strlen($data['search_ids']) > 0 ? explode(',', $data['search_ids']) : array();
    $data['search_excludeIds'] = isset($data['search_excludeIds']) && strlen($data['search_excludeIds']) > 0 ? explode(',', $data['search_excludeIds']) : array();
    // Параметры
    $code = '0002';
    $currentUserId = $_GET['token_user_id'];
    $token = $_GET['token'];
    $search = array(
      'q' => $data['search_q'] ?? null,
      'sex' => $data['search_sex'] ?? null,
      'birth_year' => $data['search_birthYear'] ?? null,
      'birth_month' => $data['search_birthMonth'] ?? null,
      'birth_day' => $data['search_birthDay'] ?? null,
      'ids' => $data['search_ids'],
      'exclude_ids' => $data['search_excludeIds'],
      'page' => $data['search_page'] ?? 1,
      'limit' => $data['search_limit'] ?? null,
      'status' => $data['search_status'] ?? 1
    );
    $testUsers = $this->userService->getList($search, $token, $currentUserId);
    $people = array();
    // Сновидение найдено
    if ($testUsers['count'] > 0) {
      $code = '0001';
      // Список пользователей
      foreach ($testUsers['result'] as $testUser) {
        ['user' => $people[]] = $this->checkUserDataPrivate($testUser, $currentUserId);
      }
    }
    // Сновидение не найдено
    else {
      $code = '0002';
    }
    // Вернуть результат
    return array(
      'data' => array(
        'count' => $testUsers['count'],
        'limit' => $testUsers['limit'],
        'people' => $people
      ),
      'code' => $code
    );
  }

  // Получить данные о пользователе
  // * GET
  public function getUser($data): array
  {
    $code = '0000';
    $user = array();
    $currentUserId = $_GET['token_user_id'];

    // Проверка ID
    if (strlen($data['id']) > 0) {
      $code = '9013';
      // Запрос данных о пользователе
      $user = $this->userService->getUser($data['id']);
      // Проверить авторизацию
      if ($user) {
        ['code' => $code, 'user' => $user] = $this->checkUserDataPrivate($user, $currentUserId);
      }
    }
    // Получены пустые данные
    else {
      $code = '9030';
    }

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => '',
      'data' => $user
    );
  }

  // Синхронизация данных о пользователе
  // * GET
  // * LONG_POLLING
  public function syncUser($data): array
  {
    $data['id'] = $data['id'] ?? 0;
    $data['lastEditDate'] = isset($data['lastEditDate']) && strlen($data['lastEditDate']) > 0 ? $data['lastEditDate'] : date('Y-m-d\TH:i:s\ZO', 0);
    // Параметры
    $code = '0000';
    $user = array();
    $userId = $data['id'];
    $currentUserId = $_GET['token_user_id'];

    // Проверка ID
    if (strlen($userId) > 0) {
      $code = '9013';
      $tetUser = $this->userService->syncUser($userId, $data['lastEditDate']);
      // Данные получены из базы без Long Polling
      if (!!$tetUser) {
        ['code' => $code, 'user' => $user] = $this->checkUserDataPrivate($tetUser, $currentUserId);
      }
      // Задача на получение данных через Long Polling
      else {
        $longUser = $this->longPollingService->get('account/syncUser/' . $userId);
        // Данные обнаружены
        if (!!$longUser && is_array($longUser) && strtotime($longUser['lastEditDate']) > strtotime($data['lastEditDate'])) {
          ['code' => $code, 'user' => $user] = $this->checkUserDataPrivate($longUser, $currentUserId);
        }
        // Пользователь не найден
        else {
          $code = '0002';
        }
      }
    }
    // Получены пустые данные
    else {
      $code = '9030';
    }

    // Скрипт не выполнен
    return array(
      'code' => $code,
      'message' => '',
      'data' => $user
    );
  }



  // Изменение пароля
  // * POST
  public function changePassword($data): array
  {
    $code = '0000';
    $message = '';
    $id = $_GET['token_user_id'];
    $token = $_GET['token'];

    // Проверка входящих данных
    if (strlen($data['current_password']) > 0 & strlen($data['new_password']) > 0) {
      // Проверка токена
      if ($this->tokenService->checkToken($id, $token)) {
        // Проверка доступа
        if ($id == $this->tokenService->getUserIdFromToken($token)) {
          $sqlData = array(
            'id' => $id,
            'password' => $data['current_password']
          );
          // Проверка совпадения пароля
          if ($this->userService->checkUserPassword($sqlData)) {
            $sqlData['password'] = $data['new_password'];
            // Сохранение пароля
            return $this->userService->changePasswordApi($sqlData);
          }
          // Пароль неверный
          else {
            $code = '0002';
          }
        }
        // Ошибка доступа
        else {
          $code = '9040';
        }
      }
      // Неверный токен
      else {
        $code = '9015';
      }
    }
    // Переданы пустые/неполные данные
    else {
      $code = '1000';
    }

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => $message,
      'data' => array()
    );
  }

  // Сохранить данные пользователя
  // * POST
  public function saveUserData($data): array
  {
    $code = '0000';
    $id = $_GET['token_user_id'];
    $token = $_GET['token'];

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        return $this->userService->saveUserDataApi($id, $data);
      }
      // Ошибка доступа
      else {
        $code = '9040';
      }
    }
    // Неверный токен
    else {
      $code = '9015';
    }

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => '',
      'data' => array()
    );
  }

  // Сохранить статус пользователя
  // * POST
  public function savePageStatus($data): array
  {
    $code = '0000';
    $id = $_GET['token_user_id'];
    $token = $_GET['token'];

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        return $this->userService->savePageStatusApi($id, $data);
      }
      // Ошибка доступа
      else {
        $code = '9040';
      }
    }
    // Неверный токен
    else {
      $code = '9015';
    }

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => '',
      'data' => array()
    );
  }

  // Сохранить настройки пользователя
  // * POST
  public function saveUserSettings($data): array
  {
    $code = '0000';
    $id = $_GET['token_user_id'];
    $token = $_GET['token'];

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        return $this->userService->saveUserSettingsApi($id, $data);
      }
      // Ошибка доступа
      else {
        $code = '9040';
      }
    }
    // Неверный токен
    else {
      $code = '9015';
    }

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => '',
      'data' => array()
    );
  }

  // Сохранить настройки приватности пользователя
  // * POST
  public function saveUserPrivate($data): array
  {
    $code = '0000';
    $id = $_GET['token_user_id'];
    $token = $_GET['token'];

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        return $this->userService->saveUserPrivateApi($id, $data['private']);
      }
      // Ошибка доступа
      else {
        $code = '9040';
      }
    }
    // Неверный токен
    else {
      $code = '9015';
    }

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => '',
      'data' => array()
    );
  }



  // Загрузить аватарку
  // * POST
  public function uploadAvatar($data): array
  {
    $code = '0000';
    $id = $_GET['token_user_id'];
    $token = $_GET['token'];

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        $data['file'] = $_FILES['file'];
        // Загрузка
        return $this->userService->uploadAvatarApi($id, $data);
      }
      // Ошибка доступа
      else {
        $code = '9040';
      }
    }
    // Неверный токен
    else {
      $code = '9015';
    }

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => '',
      'data' => array()
    );
  }

  // Обрезать аватарку
  // * POST
  public function cropAvatar($data): array
  {
    $code = '0000';
    $id = $_GET['token_user_id'];
    $token = $_GET['token'];

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        // Загрузка
        return $this->userService->cropAvatarApi($id, $data);
      }
      // Ошибка доступа
      else {
        $code = '9040';
      }
    }
    // Неверный токен
    else {
      $code = '9015';
    }

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => '',
      'data' => array()
    );
  }

  // Удалить аватарку
  // * POST
  public function deleteAvatar(): array
  {
    $code = '0000';
    $id = $_GET['token_user_id'];
    $token = $_GET['token'];

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        // Загрузка
        return $this->userService->deleteAvatarApi($id);
      }
      // Ошибка доступа
      else {
        $code = '9040';
      }
    }
    // Неверный токен
    else {
      $code = '9015';
    }

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => '',
      'data' => array()
    );
  }



  // Проверка доступа к странице пользователя
  private function checkUserDataPrivate(array $userData, $currentUserId): array
  {
    $code = '8100';
    $user = null;
    // Данные определены
    if (isset($userData['id'])) {
      unset($userData['activation_key']);
      unset($userData['activation_key_expire']);
      // Проверка данных
      if ($this->userSettingsService->checkPrivate("myPage", $userData['id'], intval($currentUserId))) {
        $code = '0001';
        $user = $userData;
        // Отметка о доступе
        $user['hasAccess'] = true;
      }
      // Краткие сведения
      else {
        $code = '8100';
        $user = array(
          'id' => $userData['id'],
          'sex' => $userData['sex'],
          'name' => $userData['name'],
          'lastName' => $userData['lastName'],
          'lastActionDate' => $userData['lastActionDate'],
          'lastEditDate' => $userData['lastEditDate'],
          'avatars' => $userData['avatars'],
          'private' => $userData['private'],
          'hasAccess' => false
        );
      }
    }
    // Ошибка
    return array(
      'code' => $code,
      'user' => $user
    );
  }
}


return new Account();
