<?

namespace Services;

use PDO;
use Services\UserAgentService;



class TokenService
{
  private PDO $pdo;
  private array $config;

  private DataBaseService $dataBaseService;
  private UserAgentService $userAgentService;

  private int $tokenLifeTime = 36000;

  public function __construct(PDO $pdo, array $config)
  {
    $this->pdo = $pdo;
    $this->config = $config;
    // Подключить сервисы
    $this->dataBaseService = new DataBaseService($this->pdo);
    $this->userAgentService = new UserAgentService();
    // Определить переменные
    $this->tokenLifeTime = $this->config['auth']['tokenLifeTime'] ? $this->config['auth']['tokenLifeTime'] : $this->tokenLifeTime;
  }



  // Пересобрать таблицы БД
  public function createTableApi(string $password): bool
  {
    // Проверить секретный пароль
    if ($password == $this->config['appPassword']) {
      // Настройка таблиц
      return $this->dataBaseService->executeFromFile('token/createTable.sql');
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
      return $this->dataBaseService->executeFromFile('token/deleteTable.sql');
    }
    // Результат работы функции
    return false;
  }



  // Удаление токена
  public function deleteTokenApi(string $token): array
  {
    $code = '0000';
    $message = '';
    $sqlData = array();

    // Если получены данные
    if (strlen($token) > 0) {
      $test = $this->getToken($token);
      // Токен существует
      if (isset($test['token']) && $test['token'] === $token) {
        // Удаление токена
        if ($this->dataBaseService->executeFromFile('token/deleteToken.sql', array($token))) {
          $this->deleteTokenFromCookie();
          $code = '0001';
        }
        // Неудалось удалить токен
        else {
          $code = '9017';
        }
      }
      // Токен не существует
      else {
        $code = '0001';
      }
    }
    // Получены пустые данные
    else {
      $code = '9030';
    }

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => $message,
      'data' => array(
        'input' => $sqlData,
        'result' => $code == '0001'
      )
    );
  }

  // Проверить токен
  public function checkTokenApi(array $data): array
  {
    $code = '0000';
    $message = '';
    $sqlData = array();
    $tokenData = array();
    $token = $_COOKIE['api-token'];

    // Если получены данные
    if (strlen($token) > 0) {
      $code = '9015';
      // Данные
      $sqlData = array($token);
      // Запрос проверки токена
      $auth = $this->dataBaseService->getDatasFromFile('token/checkToken.sql', $sqlData);
      // Проверить авторизацию
      if (count($auth) > 0) {
        if (strlen($auth[0]['id']) > 0) {
          // Проверка времени жизни токена
          if (gmdate('U') - $this->tokenLifeTime < strtotime($auth[0]['last_action_date'])) {
            // Обновить токен
            if (
              $this->dataBaseService->executeFromFile('token/updateLastAction.sql', array($auth[0]['id'])) &&
              $this->dataBaseService->executeFromFile('account/updateLastAction.sql', array($auth[0]['user_id'])) &&
              $this->saveTokenToCookie($token)
            ) {
              $tokenData = $auth[0];
              $code = '0001';
            }
            // Ошибка сохранения токена
            else {
              $code = '9014';
            }
          }
          // Токен просрочен
          else {
            $code = '9016';
          }
        }
      }

      // Удалить токен
      if ($code != '0001') {
        $this->dataBaseService->executeFromFile('token/deleteToken.sql', array($token));
      }
    }
    // Получены пустые данные
    else {
      $code = '9030';
    }

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => $message,
      'data' => array(
        'input' => $sqlData,
        'tokenData' => $tokenData,
        'result' => $code == '0001'
      )
    );
  }

  // Получить информацию о токене
  public function getTokenApi(array $data): array
  {
    $code = '0000';
    $message = '';
    $tokenData = array();
    $token = $_COOKIE['api-token'];

    // Если получены данные
    if (strlen($token) > 0) {
      $code = '9015';
      // Запрос проверки токена
      $testToken = $this->getToken($token);
      // Проверить токен
      if (count($testToken) > 0) {
        $tokenData = $testToken;
        $code = '0001';
      }
    }
    // Получены пустые данные
    else {
      $code = '9030';
    }

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => $message,
      'data' => array(
        'input' => array(),
        'tokenData' => $tokenData,
        'result' => $code == '0001'
      )
    );
  }

  // Получить информацию о токенах
  public function getTokensApi(array $data): array
  {
    $code = '0000';
    $message = '';
    $tokenDatas = array();
    $token = $_COOKIE['api-token'];

    // Если получены данные
    if (strlen($token) > 0 && strlen($data['token_user_id']) > 0) {
      $token = $this->getTokens($data['token_user_id'], $data['hideCurrent'] ? $token : '');
      // Проверить токен
      if (count($token) > 0) {
        $tokenDatas = $token;
        $code = '0001';
      }
      // Нет токенов
      else {
        $tokenDatas = array();
        $code = '0002';
      }
    }
    // Получены пустые данные
    else {
      $code = '9030';
    }

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => $message,
      'data' => array(
        'input' => array(),
        'tokenDatas' => $tokenDatas,
        'result' => $code == '0001'
      )
    );
  }

  // Удалить информацию о токене по ID
  public function deleteTokenByIdApi(int $id): array
  {
    $code = '0000';

    // Если получены данные
    if ($id > 0) {
      // Удаление токена
      if ($this->dataBaseService->executeFromFile('token/deleteTokenById.sql', array($id))) {
        $code = '0001';
      }
      // Неудалось удалить токен
      else {
        $code = '9017';
      }
    }
    // Получены пустые данные
    else {
      $code = '9030';
    }

    // Вернуть массив
    return array(
      'code' => $code
    );
  }

  // Удалить информацию о токенах
  public function deleteTokensByUserApi(int $id, bool $hideCurrent = false, string $excludeToken = ''): array
  {
    $code = '0000';

    // Если получены данные
    if ($id > 0 && (!$hideCurrent || ($hideCurrent && strlen($excludeToken) > 0))) {
      // Удаление токена
      if ($this->dataBaseService->executeFromFile('token/deleteTokensByUser.sql', array($id, ($hideCurrent ? $excludeToken : '')))) {
        $code = '0001';
      }
      // Неудалось удалить токен
      else {
        $code = '9017';
      }
    }
    // Получены пустые данные
    else {
      $code = '9030';
    }

    // Вернуть массив
    return array(
      'code' => $code
    );
  }



  // Проверить токен
  public function checkToken(string $userId, string $token): bool
  {
    if (strlen($userId) > 0 && strlen($token) > 0) {
      // Данные
      $sqlData = array($token);
      // Запрос проверки токена
      $auth = $this->dataBaseService->getDatasFromFile('token/checkToken.sql', $sqlData);
      // Проверить авторизацию
      if (count($auth) > 0) {
        if (strlen($auth[0]['id']) > 0) {
          // Проверка времени жизни токена
          if (gmdate('U') - $this->tokenLifeTime < strtotime($auth[0]['last_action_date'])) {
            // Проверка привязки пользователя
            if ($userId == $auth[0]['user_id']) {
              return true;
            }
          }
        }
      }
    }
    // Токен не валидный
    return false;
  }

  // ID по токену
  public function getUserIdFromToken(string $token): int
  {
    if (strlen($token) > 0) {
      // Данные
      $sqlData = array($token);
      // Запрос проверки токена
      $auth = $this->dataBaseService->getDatasFromFile('token/checkToken.sql', $sqlData);
      // Проверить авторизацию
      if (count($auth) > 0) {
        if (strlen($auth[0]['user_id']) > 0) {
          return $auth[0]['user_id'];
        }
      }
    }
    // Токен не валидный
    return 0;
  }

  // Создать токен
  public function createToken(string $id): string
  {
    $token = hash('sha512', $this->config['hashSecret'] . $id . '_' . gmdate('U'));
    $ip = $this->userAgentService->getIp();
    $browser = $this->userAgentService->getUserAgent();
    // Сохранить токен
    if ($this->dataBaseService->executeFromFile('token/createToken.sql', array($token, $id, $ip, $browser['platform'], $browser['browser'], $browser['version']))) {
      // Создать куку
      if ($this->saveTokenToCookie($token)) {
        return $token;
      }
    }
    // Ошибка сохранения токена
    return '';
  }

  // Сведения о токене
  public function getToken(string $token): array
  {
    if (strlen($token) > 0) {
      // Данные
      $sqlData = array($token);
      // Запрос проверки токена
      $auth = $this->dataBaseService->getDatasFromFile('token/getToken.sql', $sqlData);
      // Проверить авторизацию
      if (count($auth) > 0) {
        if (strlen($auth[0]['user_id']) > 0) {
          return $auth[0];
        }
      }
    }
    // Токен не валидный
    return array();
  }

  // Сведения о токенах
  public function getTokens(int $id, string $token): array
  {
    if (strlen($id) > 0) {
      // Данные
      $sqlData = array($id, $token);
      // Запрос проверки токена
      $tokens = $this->dataBaseService->getDatasFromFile('token/getTokens.sql', $sqlData);
      // Проверить авторизацию
      if (count($tokens) > 0) {
        return $tokens;
      }
    }
    // Токен не валидный
    return array();
  }



  // Записать токен в куки
  private function saveTokenToCookie(string $token): bool
  {
    if (strlen($token) > 0) {
      return setcookie('api-token', $token, [
        'expires' => time() + intval($this->config['auth']['tokenLifeTime']),
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'None',
      ]);
    }
    // Ошибка
    return false;
  }

  // Удалить токен из куки
  private function deleteTokenFromCookie(): bool
  {
    return setcookie('api-token', "", [
      'expires' => 0,
      'path' => '/',
      'secure' => true,
      'httponly' => true,
      'samesite' => 'None',
    ]);
  }
}
