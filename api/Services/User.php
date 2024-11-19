<?

namespace Services;

use DateTime;
use PDO;
use Libs\Thumbs;
use Services\ReCaptchaService;



class UserService
{
  private PDO $pdo;
  private array $config;

  private DataBaseService $dataBaseService;
  private ReCaptchaService $reCaptchaService;
  private TokenService $tokenService;
  private MailService $mailService;
  private LongPollingService $longPollingService;

  private string $avatarRelativeDir = 'images/user_avatars';
  private string $avatarDir = 'images/user_avatars';
  private string $avatarUrl = '/images/user_avatars';
  private array $avatarExts = array('png', 'jpg', 'jpeg');
  private array $avatarKeys = array('full', 'crop', 'middle', 'small');
  private array $avatarKeysCrop = array('crop' => 'full', 'middle' => 'crop');
  private array $avatarKeysCropPos = array('startX', 'width', 'startY', 'height');

  public function __construct(PDO $pdo, array $config)
  {
    $this->pdo = $pdo;
    $this->config = $config;
    // Подключить сервисы
    $this->dataBaseService = new DataBaseService($this->pdo);
    $this->reCaptchaService = new ReCaptchaService('', $this->config);
    $this->tokenService = new TokenService($this->pdo, $this->config);
    $this->mailService = new MailService($this->config);
    $this->longPollingService = new LongPollingService($this->config);
    // Данные
    $this->avatarDir = $this->config['mediaPath'] . $this->avatarRelativeDir;
  }



  // Авторизация
  public function authUserApi(array $data): array
  {
    $code = '9010';
    $message = '';
    $id = '0';
    $token = '';
    $sqlData = array();
    $activateIsAvail = false;

    // Если получены данные
    if (strlen($data['login']) > 0 && strlen($data['password']) > 0) {
      $code = '9013';
      // Данные
      $sqlData = array(
        $data['login'],
        $this->hashPassword($data['password'])
      );
      // Запрос авторизации
      $auth = $this->dataBaseService->getDatasFromFile('account/auth.sql', $sqlData);
      // Проверить авторизацию
      if (count($auth) > 0) {
        $user = $auth[0];
        // Проверка пользователя
        if (strlen($user['id']) > 0) {
          // Авторизация
          if ($user['status'] == '1') {
            $id = $user['id'];
            $token = $this->tokenService->createToken($id);
            $code = strlen($token) > 0 ? '0001' : '9014';
          }
          // Требуется активация акааунта
          else if ($user['status'] == '0') {
            $aKeyDate = strtotime($user['activation_key_expire']);
            $cDate = strtotime((new DateTime())->format(DateTime::ISO8601));
            $id = $user['id'];
            $code = '9019';
            $activateIsAvail = strlen($user['activation_key']) > 0 && $aKeyDate > $cDate;
          }
        }
      }
      // Убрать метку пароля
      unset($sqlData[1]);
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
        'id' => $id,
        'token' => $token,
        'input' => $sqlData,
        'result' => $code == '0001',
        'activateIsAvail' => $activateIsAvail
      )
    );
  }

  // Регистрация нового пользователя
  public function registerUserApi(array $data): array
  {
    $code = '9010';
    $message = '';
    $id = '';
    $sqlData = array();
    $isTestRequest = ($data['checkCaptcha'] == false || $data['checkCaptcha'] == 'false') && !!$this->config['isTest'];
    // Если получены данные
    if (strlen($data['login']) > 0 && strlen($data['email']) > 0) {
      $this->reCaptchaService->setCaptchaCode($data['captcha']);
      // Проверить капчу
      if ($this->reCaptchaService->checkCaptcha() || $isTestRequest) {
        $login = $data['login'];
        $password = $this->hashPassword($data['password']);
        $sqlData = array(
          $login,
          $password,
          $data['name'],
          $data['lastName'],
          date('Y-m-d', strtotime($data['birthDate'])),
          $data['sex'],
          $data['email'],
          json_encode(array()),
          json_encode(array()),
          json_encode(array()),
          json_encode(array())
        );
        $checkLogin = $this->dataBaseService->getDatasFromFile('account/checkLoginEmail.sql', array($data['login'], $data['email']));
        // Проверить логин
        if (count($checkLogin) == 0) {
          // Тестовый запрос
          if ($isTestRequest) {
            $code = '0001';
          }
          // Регистрация пользователя
          else {
            if ($this->dataBaseService->executeFromFile('account/registerUser.sql', $sqlData)) {
              $sqlData = array($login, $password);
              $auth = $this->dataBaseService->getDatasFromFile('account/auth.sql', $sqlData);
              $code = '9018';
              // Проверить авторизацию
              if (count($auth) > 0) {
                if (strlen($auth[0]['id']) > 0) {
                  $user = array(
                    'id' => $auth[0]['id'],
                    'name' => $data['name'],
                    'email' => $data['email']
                  );
                  // Отправка письма
                  if ($this->sendActivationCode($user)) {
                    $code = '0001';
                  }
                }
              }
            }
            // Регистрация неудалась
            else {
              $code = '9021';
            }
          }
        }
        // Логин или почта повторяются
        else {
          foreach ($checkLogin as $row) {
            // Логин
            if ($row['login'] == $data['login']) {
              $code = '9011';
            }
            // Почта
            else {
              $code = '9012';
            }
            break;
          }
        }
      }
      // Ошибка капчи
      else {
        $code = '9010';
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
        'id' => $id,
        'isTest' => $isTestRequest,
        'result' => $code == '0001'
      )
    );
  }

  // Создать пользователя
  public function createUser(array $data): string
  {
    $login = $data['login'] ?? '';
    $email = $data['email'] ?? '';
    // Данные были переданы
    if (strlen($login) > 0 && strlen($email) > 0) {
      $password = $this->hashPassword($data['password']);
      $checkLogin = $this->dataBaseService->getDatasFromFile('account/checkLoginEmail.sql', array($login, $email));
      // Проверить логин
      if (count($checkLogin) === 0) {
        $sqlData = array(
          'page_status' => $data['pageStatus'] ?? '',
          'status' => $data['status'] ?? '1',
          'login' => $login,
          'password' => $password,
          'name' => $data['name'] ?? '',
          'last_name' => $data['lastName'] ?? '',
          'patronymic' => $data['patronymic'] ?? '',
          'birth_date' => date('Y-m-d', strtotime($data['birthDate'])),
          'sex' => $data['sex'] ?? 0,
          'email' => $email,
          'roles' => json_encode($data['roles'] ?? array()),
          'avatar_crop_data' => json_encode($data['avatarCropData'] ?? array()),
          'settings' => json_encode(array(
            'profileBackground' => array($data['settings']['profileBackground'] ?? 1),
            'profileHeaderType' => array($data['settings']['profileHeaderType'] ?? 'short'),
          )),
          'private' => json_encode($data['private'] ?? array())
        );
        // Попытка создания
        if ($this->dataBaseService->executeFromFile('account/createUser.sql', $sqlData)) {
          $sqlData = array($login, $password);
          $auth = $this->dataBaseService->getDatasFromFile('account/auth.sql', $sqlData);
          // Проверить авторизацию
          if (count($auth) > 0) {
            if (strlen($auth[0]['id']) > 0) {
              return $auth[0]['id'];
            }
          }
        }
      }
    }
    // Пользователь не создан
    return '0';
  }

  // Создание ключа активации
  public function createActivationCodeApi(array $data): array
  {
    $code = '9018';
    $message = '';

    // Если получены данные
    if (strlen($data['login']) > 0 && strlen($data['password']) > 0) {
      $this->reCaptchaService->setCaptchaCode($data['captcha']);
      // Проверить капчу
      if ($this->reCaptchaService->checkCaptcha()) {
        $code = '9013';
        // Данные
        $sqlData = array(
          $data['login'],
          $this->hashPassword($data['password'])
        );
        // Запрос авторизации
        $auth = $this->dataBaseService->getDatasFromFile('account/auth.sql', $sqlData);
        // Проверить авторизацию
        if (count($auth) > 0) {
          $user = $this->getUser($auth[0]['id']);
          // Проверка пользователя
          if (strlen($user['id']) > 0) {
            // Создать код только для неактивированного аккаунта
            if ($user['status'] == '0') {
              if ($this->sendActivationCode($user)) {
                $code = '0001';
              }
            }
            // Аккаунт уже активирован
            else {
              $code = '9022';
            }
          }
        }
        // Убрать метку пароля
        unset($sqlData[1]);
      }
      // Ошибка капчи
      else {
        $code = '9010';
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

  // Активация аккаунта пользователя
  public function accountActivateApi(array $data): array
  {
    $code = '9023';
    $message = '';

    // Если получены данные
    if (strlen($data['user']) > 0 && strlen($data['code']) > 0) {
      $user = $this->getUser($data['user']);
      // Проверка пользователя
      if (strlen($user['id']) > 0) {
        // Проверка статуса пользователя
        if ($user['status'] == '0') {
          // Проверка кода активации
          if ($user['activation_key'] === $data['code']) {
            $aKeyDate = strtotime($user['activation_key_expire']);
            $cDate = strtotime((new DateTime())->format(DateTime::ISO8601));
            // Проверка даты кода активации
            if ($aKeyDate > $cDate) {
              $sqlData = array($data['user']);
              // Активация аккаунта
              if ($this->dataBaseService->executeFromFile('account/activate.sql', $sqlData)) {
                $code = '0001';
              }
            }
            // Код активации истек
            else {
              $code = '9025';
            }
          }
          // Неверный код активации
          else {
            $code = '9024';
          }
        }
        // Пользователь уже активирован
        else {
          $code = '9026';
        }
      }
      // Пользователь не найден
      else {
        $code = '9013';
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
        'result' => $code == '0001'
      )
    );
  }



  // Проверка пароля
  public function checkUserPassword(array $data): bool
  {
    // Если получены данные
    if (strlen($data['id']) > 0 & strlen($data['password']) > 0) {
      // Данные
      $sqlData = array(
        'id' => $data['id'],
        'password' => $this->hashPassword($data['password'])
      );
      // Проверить авторизацию
      if ($this->dataBaseService->getCountFromFile('account/checkPassword.sql', $sqlData) > 0) {
        return true;
      }
    }

    // Не удалось проверить или пароль неверный
    return false;
  }

  // Преобразовать пароль
  private function hashPassword(string $password): string
  {
    return hash('sha512', $this->config['hashSecret'] . $password);
  }

  // Создания кода активации
  public function createActivationKey(int $id): string
  {
    if ($id > 0) {
      $user = $this->getUser($id);
      // Пользователь найден
      if ($user['id'] > 0) {
        ['id' => $id, 'status' => $status, 'activation_key' => $aKey, 'activation_key_expire' => $aKeyDate] = $user;
        $aKeyDate = strtotime($aKeyDate);
        $cDate = strtotime((new DateTime())->format(DateTime::ISO8601));
        // Ключ активации можно создать только для нового пользователя
        if ($status == '0') {
          if ($aKeyDate <= $cDate || strlen($aKey) === 0) {
            $aKey = hash('sha512', $this->config['hashSecret'] . $id . $cDate);
            $aKeyDate = $cDate + $this->config['user']['activationExpire'];
            $sqlData = array($aKey, date('Y-m-d H:i:s', $aKeyDate), $id);
            // Сохранение данных
            if ($this->dataBaseService->executeFromFile('account/saveUserActivationKey.sql', $sqlData)) {
              return $aKey;
            }
          }
          // Ключ активации еще действующий
          else if ($aKeyDate > $cDate && strlen($aKey) > 0) {
            return $aKey;
          }
        }
      }
    }
    // Ключ не создан
    return '';
  }



  // Сохранить данные
  public function saveUserDataApi(string $id, array $data): array
  {
    $code = '0000';

    // Проверка ID
    if (strlen($id) > 0) {
      $checkLogin = $this->dataBaseService->getDatasFromFile('account/checkEmail.sql', array($id, $data['email']));
      // Проверить почту
      if (count($checkLogin) == 0) {
        // Данные
        $sqlData = array(
          $data['name'],
          $data['lastName'],
          $data['patronymic'],
          date('Y-m-d', strtotime($data['birthDate'])),
          $data['sex'],
          $data['email'],
          $id
        );
        // Сохранение данных
        if ($this->dataBaseService->executeFromFile('account/saveUserData.sql', $sqlData)) {
          $code = '0001';
          // Отправить изменения в Long Polling подписчики
          $this->sendUserToLongPolling($id);
        }
        // Регистрация неудалась
        else {
          $code = '9021';
        }
      }
      // Почта повторяется
      else {
        $code = '9012';
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
      'data' => array()
    );
  }

  // Сохранить статус
  public function savePageStatusApi(string $id, array $data): array
  {
    $code = '0000';

    // Проверка ID
    if (strlen($id) > 0) {
      // Данные
      $sqlData = array(
        $data['pageStatus'],
        $id
      );
      // Сохранение данных
      if ($this->dataBaseService->executeFromFile('account/saveUserPageStatus.sql', $sqlData)) {
        $code = '0001';
        // Отправить изменения в Long Polling подписчики
        $this->sendUserToLongPolling($id);
      }
      // Регистрация неудалась
      else {
        $code = '9021';
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
      'data' => array()
    );
  }

  // Сохранить настройки
  public function saveUserSettingsApi(string $id, array $data): array
  {
    $code = '0000';

    // Проверка ID
    if (strlen($id) > 0) {
      $sqlData = array(
        'profileBackground' => $data['profileBackground'],
        'profileHeaderType' => $data['profileHeaderType'],
        'notifications' => $data['notifications']
      );
      // Сохранение данных
      if ($this->dataBaseService->executeFromFile('account/saveUserSettings.sql', array(json_encode($sqlData), $id))) {
        $code = '0001';
        // Отправить изменения в Long Polling подписчики
        $this->sendUserToLongPolling($id);
      }
      // Регистрация неудалась
      else {
        $code = '9021';
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
      'data' => array()
    );
  }

  // Сохранить настройки приватности
  public function saveUserPrivateApi(string $id, string $data): array
  {
    $code = '0000';

    // Проверка ID
    if (strlen($id) > 0) {
      $sqlData = $data;
      // Сохранение данных
      if ($this->dataBaseService->executeFromFile('account/saveUserPrivate.sql', array($sqlData, $id))) {
        $code = '0001';
        // Отправить изменения в Long Polling подписчики
        $this->sendUserToLongPolling($id);
      }
      // Регистрация неудалась
      else {
        $code = '9021';
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
      'data' => array()
    );
  }

  // Загрузить аватарку
  public function uploadAvatarApi(string $id, array $data): array
  {
    $code = '0000';

    // Проверка ID
    if (strlen($id) > 0 && is_array($data['file'])) {
      // Успешное удаление аватарок
      if ($this->deleteUserAvatars($id)) {
        // Проверка размера файла
        if ($data['file']['size'] <= $this->config['user']['avaMaxSize']) {
          $nameParse = explode('.', $data['file']['name']);
          $fileExt = end($nameParse);
          $file = $this->avatarDir . '/' . $this->avatarKeys[0] . '/' . $id . '.' . $fileExt;
          // Файл успешно загружен
          if (move_uploaded_file($data['file']['tmp_name'], $file)) {
            // Созданы дополнительные аватарки
            if ($this->createDefaultAvatars($id)) {
              $code = '0001';
              // Отправить изменения в Long Polling подписчики
              $this->sendUserToLongPolling($id);
            }
            // Дополнительные аватарки не созданы
            else {
              $code = '8013';
            }
          }
          // Ошибка загрузки файла
          else {
            $code = '8011';
          }
        }
        // Слишком большой файл
        else {
          $code = '8012';
        }
      }
      // Неудалось удалить аватарки
      else {
        $code = '8010';
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
      'data' => $data
    );
  }

  // Загрузить аватарку
  public function cropAvatarApi(string $id, array $data): array
  {
    $code = '0000';

    // Проверка ID и данных
    if (strlen($id) > 0 && isset($data['startX']) && isset($data['startY']) && isset($data['width']) && isset($data['height'])) {
      // Проверка координат
      if ($data['startX'] >= 0 && $data['startY'] >= 0 && $data['width'] >= 0 && $data['height'] >= 0) {
        // Проверка типа
        if ($originalKey = $this->avatarKeysCrop[$data['type']]) {
          // Определить расширение файла
          $fileExt = '';
          $originalFile = '';
          foreach ($this->avatarExts as $ext) {
            $file = $this->avatarDir . '/' . $originalKey . '/' . $id . '.' . $ext;
            if (file_exists($file)) {
              $fileExt = $ext;
              $originalFile = $file;
              break;
            }
          }
          // Проверка файла
          if (file_exists($originalFile)) {
            $code = '8015';
            $file = $this->avatarDir . '/' . $data['type'] . '/' . $id . '.' . $fileExt;
            // Копирование
            if (copy($originalFile, $file)) {
              $config = $this->config['user']['avaSettings'][$data['type']];
              $image = new Thumbs($file);
              $image->crop($data['startX'], $data['startY'], $data['width'], $data['height']);
              // Для квадратных картинок
              if ($config['square']) {
                $image->thumb($config['maxX'], $config['maxY']);
              }
              // Для неквадратных картинок
              else {
                $image->reduce($config['maxX'], $config['maxY']);
              }
              // Сохранить
              if ($image->save()) {
                // Сохранить координаты пользовательской обрезки аватарки
                $user = $this->getUser($id);
                $avatarCropData = $user['avatarCropData'];
                $avatarCropData[$data['type']] = array(
                  'startX' => (int)$data['startX'],
                  'startY' => (int)$data['startY'],
                  'width' => (int)$data['width'],
                  'height' => (int)$data['height'],
                );
                // Пересчитать позицию миниатюры
                if ($data['type'] === $this->avatarKeys[1]) {
                  $config = $this->config['user']['avaSettings'][$this->avatarKeys[2]];
                  $miniFile = $this->avatarDir . '/' . $this->avatarKeys[2] . '/' . $id . '.' . $fileExt;
                  copy($file, $miniFile);
                  list($width, $height) = getimagesize($file);
                  $size = min($width, $height);
                  $image = new Thumbs($miniFile);
                  $image->crop(($width - $size) / 2, ($height - $size) / 2, $size, $size);
                  $image->resize($config['maxX'], $config['maxY']);
                  $image->save();
                  // Данные для сохранения
                  $avatarCropData[$this->avatarKeys[2]] = array(
                    'startX' => ($width - $size) / 2,
                    'startY' => ($height - $size) / 2,
                    'width' => $size,
                    'height' => $size,
                  );
                }
                // Сделать миниатюру
                $config = $this->config['user']['avaSettings'][$this->avatarKeys[3]];
                $miniFile = $this->avatarDir . '/' . $this->avatarKeys[3] . '/' . $id . '.' . $fileExt;
                copy($file, $miniFile);
                $image = new Thumbs($miniFile);
                $image->resize($config['maxX'], $config['maxY']);
                $image->save();
                // Сохранить массив в БД
                if ($this->dataBaseService->executeFromFile('account/saveAvatarCrop.sql', array(json_encode($avatarCropData), $id))) {
                  $code = '0001';
                  // Отправить изменения в Long Polling подписчики
                  $this->sendUserToLongPolling($id);
                }
              }
            }
          }
          // Файл не существует
          else {
            $code = '8014';
          }
        }
        // Получены пустые данные
        else {
          $code = '9030';
        }
      }
      // Получены пустые данные
      else {
        $code = '9030';
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
      'data' => $data
    );
  }

  // Удалить аватарки
  public function deleteAvatarApi(string $id): array
  {
    $code = '8010';

    // Проверка ID и данных
    if (strlen($id) > 0) {
      if ($this->deleteUserAvatars($id)) {
        $code = '0001';
        // Отправить изменения в Long Polling подписчики
        $this->sendUserToLongPolling($id);
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
      'data' => array()
    );
  }

  // Изменить пароль
  public function changePasswordApi(array $data): array
  {
    $code = '0000';

    // Проверка ID
    if (strlen($data['id']) > 0 & strlen($data['password']) > 0) {
      $data['password'] = $this->hashPassword($data['password']);
      // Сохранение данных
      if ($this->dataBaseService->executeFromFile('account/changePassword.sql', $data)) {
        $code = '0001';
      }
      // Пароль не обновился
      else {
        $code = '9021';
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
      'data' => array()
    );
  }



  // Данные о пользователе
  public function getUser($id)
  {
    // Запрос данных о пользователе
    $users = $this->dataBaseService->getDatasFromFile('account/getUser.sql', array($id));
    // Проверить авторизацию
    if (count($users) > 0) {
      if (strlen($users[0]['id']) > 0) {
        // Данные пользователя
        return $this->getUserData($users[0]);
      }
    }
    // Пользователь не найден
    return null;
  }

  // Данные о пользователе для синхронизации
  public function syncUser($id, $lastEditDate)
  {
    $sqlData = array($id, $lastEditDate);
    $users = $this->dataBaseService->getDatasFromFile('account/syncUser.sql', $sqlData);
    // Проверить авторизацию
    if (count($users) > 0) {
      if (strlen($users[0]['id']) > 0) {
        // Данные пользователя
        return $this->getUserData($users[0]);
      }
    }
    // Пользователь не найден
    return null;
  }

  // Получить список пользователей
  public function getList(array $search, string $token, string $userId): array
  {
    $count = 0;
    $result = array();
    $limit = $search['limit'] > 0 & $search['limit'] <= 500 ? $search['limit'] : $this->config['dreams']['limit'];
    $checkToken = $this->tokenService->checkToken($userId, $token);
    $statuses = array(-1, 0, 1);
    $sortFields = array('id');
    $sortTypes = array('asc', 'desc');
    // Отфильтровать поиск по ФИО
    if (strlen($search['q']) > 0) {
      $q = array();
      // Цикл по словам
      foreach (explode(' ', $search['q']) as $w) {
        if (strlen($w) > 0) {
          $q[] = '+' . $w;
        }
      }
      // Объединение поисковых слов
      $search['q'] = implode(' ', $q);
    }
    // Данные для поиска
    $sqlData = array(
      'q' => $search['q'],
      'ids' => $search['ids'],
      'exclude_ids' => $search['exclude_ids'],
      'sex' => $search['sex'],
      'birth_year' => $search['birth_year'],
      'birth_month' => $search['birth_month'],
      'birth_day' => $search['birth_day'],
      'status' => array_search($search['status'] ?? 1, $statuses) ? $search['status'] : $statuses[0],
      'sort_field' => array_search($search['sort_field'] ?? 'id', $sortFields) ? $search['sort_field'] : $sortFields[0],
      'sort_type' => array_search($search['sort_type'] ?? 'asc', $sortTypes) ? $search['sort_type'] : $sortTypes[0],
      // Параметры
      'check_token' => $checkToken,
      'current_user' => intval($userId),
    );
    // Запрос
    $count = $this->dataBaseService->getCountFromFile('account/searchUsersCount.php', $sqlData);
    $page = isset($search['page']) && $search['page'] > 0 ? $search['page'] : 1;
    // Сновидения найдены
    if ($count > 0) {
      $maxPage = ceil($count / $limit);
      $page = $page < 1 ? 1 : ($page > $maxPage ? $maxPage : $page);
      // Настройки ограничения данных
      $sqlData['limit_start'] = intval(($page * $limit) - $limit);
      $sqlData['limit_length'] = intval($limit);
      $queryResult = $this->dataBaseService->getDatasFromFile('account/searchUsers.php', $sqlData);
      // Список данных
      foreach ($queryResult as $user) {
        $result[] = $this->getUserData($user);
      }
    }
    // Сон не найден
    return array(
      'count' => $count,
      'limit' => $limit,
      'result' => $result
    );
  }



  // Преобразовать данные
  private function getUserData(array $user): array
  {
    $defaultDate = date('Y-m-d\TH:i:s\ZO', 0);

    // Определение аватарок
    $avatars = array();
    foreach ($this->avatarKeys as $key) {
      $avatars[$key] = '';
    }

    // Проверить аватарки
    foreach ($this->avatarExts as $ext) {
      $file = $this->avatarDir . '/' . $this->avatarKeys[0] . '/' . $user['id'] . '.' . $ext;
      if (file_exists($file)) {
        foreach ($this->avatarKeys as $key) {
          $tempFile = $this->avatarDir . '/' . $key . '/' . $user['id'] . '.' . $ext;
          $avatars[$key] = $this->config['mediaDomain'] . $this->avatarUrl . '/' . $key . '/' . $user['id'] . '.' . $ext . '?time=' . filemtime($tempFile);
        }
        break;
      }
    }

    // Данные об обрезке аватарки
    $avatarCropData = @json_decode($user['avatar_crop_data'], true) ?? array();
    foreach ($this->avatarKeysCrop as $value) {
      $avatarCropData[$value] = $avatarCropData[$value] ?? array();
      $avatarCropData[$value] = $this->checkUserAvatarCropDatas($avatarCropData[$value]);
    }

    // Данные о настройках
    $settings = @json_decode($user['settings'], true) ?? array();
    $settings['profileBackground'] = $settings['profileBackground'] ?? 0;

    // Натсройки приватности
    $private = @json_decode($user['private'], true) ?? array();

    // Вернуть данные
    return array(
      'id' => $user['id'],
      'status' => $user['status'],
      'activation_key' => $user['activation_key'] ?? '',
      'activation_key_expire' => $user['activation_key_expire'] ?? $defaultDate,
      'name' => $user['name'],
      'pageStatus' => $user['page_status'],
      'lastName' => $user['last_name'],
      'patronymic' => $user['patronymic'],
      'birthDate' => $user['birth_date'],
      'registerDate' => $user['register_date'],
      'lastEditDate' => $user['last_edit_date'] ?? $defaultDate,
      'lastActionDate' => $user['last_action_date'] ?? $defaultDate,
      'sex' => $user['sex'],
      'email' => $user['email'],
      'roles' => json_decode($user['roles']),
      'avatarCropData' => $avatarCropData,
      'private' => $private,
      'settings' => $settings,
      'avatars' => $avatars
    );
  }

  // Преобразовать массив обрезки аватарки
  private function checkUserAvatarCropDatas($data): array
  {
    $data = is_array($data) ? $data : array();
    // Проверка вложенных данных
    foreach ($this->avatarKeysCropPos as $key) {
      $data[$key] = isset($data[$key]) ? $data[$key] : 0;
      $data[$key] = is_int($data[$key]) ? $data[$key] : 0;
      $data[$key] = $data[$key] < 0 ? 0 : $data[$key];
    }
    // Вернуть данные
    return $data;
  }

  // Удалить все аватарки
  private function deleteUserAvatars(string $id): bool
  {
    $delete = 0;
    // Удалить аватарки
    foreach ($this->avatarExts as $ext) {
      foreach ($this->avatarKeys as $key) {
        $file = $this->avatarDir . '/' . $key . '/' . $id . '.' . $ext;
        if (file_exists($file)) {
          $delete++;
          if (@unlink($file)) {
            $delete--;
          }
        }
      }
    }
    // Неудалось удалить
    return $delete == 0;
  }

  // Установить аватарки по умолчанию
  private function createDefaultAvatars(string $id)
  {
    // Поиск оригинальной аватарки
    $originalFile = '';
    $previusFile = '';
    $fileExt = '';
    foreach ($this->avatarExts as $ext) {
      $file = $this->avatarDir . '/' . $this->avatarKeys[0] . '/' . $id . '.' . $ext;
      if (file_exists($file)) {
        $fileExt = $ext;
        $originalFile = $file;
        $previusFile = $file;
        break;
      }
    }
    // Аватарка найдена
    if (strlen($originalFile) > 0) {
      $avas = count($this->avatarKeys);
      $avatars = array();
      // Цикл по типам аватарок
      foreach ($this->avatarKeys as $key) {
        $file = $this->avatarDir . '/' . $key . '/' . $id . '.' . $fileExt;
        // Копировать файл
        $copy = $key == $this->avatarKeys[0] ? true : copy($previusFile, $file);
        // Обработка
        if ($copy) {
          // Параметры
          $config = $this->config['user']['avaSettings'][$key];
          $image = new Thumbs($file);
          // Для квадратных картинок
          if ($config['square']) {
            list($width, $height) = getimagesize($previusFile);
            $size = min($width, $height);
            $image->crop(($width - $size) / 2, ($height - $size) / 2, $size, $size);
            $image->resize($config['maxX'], $config['maxY']);
          }
          // Для неквадратных картинок
          else {
            $image->reduce($config['maxX'], $config['maxY']);
          }
          // Сохранить изменения
          $avatars[$key] = $file;
          $image->save();
          $avas--;
        }
        // Установить предыдущий файл
        $previusFile = $file;
      }
      // Сохранить новые координаты
      if ($avas === 0) {
        $avatarsCrop = array();
        foreach ($this->avatarKeysCrop as $cropKey => $cropValue) {
          $config = $this->config['user']['avaSettings'][$cropKey];
          $avatarsCrop[$cropKey] = $this->checkUserAvatarCropDatas(array());
          list($width, $height) = getimagesize($avatars[$cropValue]);
          // Данные с приведением к квадрату
          if ($config['square']) {
            $avatarsCrop[$cropKey][$this->avatarKeysCropPos[0]] = ($width - min($width, $height)) / 2;
            $avatarsCrop[$cropKey][$this->avatarKeysCropPos[1]] = min($width, $height);
            $avatarsCrop[$cropKey][$this->avatarKeysCropPos[2]] = ($height - min($width, $height)) / 2;
            $avatarsCrop[$cropKey][$this->avatarKeysCropPos[3]] = min($width, $height);
          }
          // Данные без приведения к квадрату
          else {
            $avatarsCrop[$cropKey][$this->avatarKeysCropPos[0]] = 0;
            $avatarsCrop[$cropKey][$this->avatarKeysCropPos[1]] = $width;
            $avatarsCrop[$cropKey][$this->avatarKeysCropPos[2]] = 0;
            $avatarsCrop[$cropKey][$this->avatarKeysCropPos[3]] = $height;
          }
        }
        // Сохранить массив в БД
        if ($this->dataBaseService->executeFromFile('account/saveAvatarCrop.sql', array(json_encode($avatarsCrop), $id))) {
          return true;
        }
      }
    }
    // Неудалось создать набор аватарок
    return false;
  }





  // Отправить письмо с кодом активации
  private function sendActivationCode(array $user): bool
  {
    $aKey = $this->createActivationKey($user['id']);
    $mailParams = array(
      'name' => $user['name'],
      'email' => $user['email'],
      'confirmationLink' => $this->config['appDomain'] . '/account-confirmation/' . $user['id'] . '/' . $aKey,
    );
    // Попытка отправить письмо
    return $this->mailService->send('account/email-confirmation', $user['email'], 'Подтверждение регистрации', $mailParams);
  }

  // Отправить данные подписчикам LongPolling
  public function sendUserToLongPolling(int $userId): void
  {
    $user = $this->getUser($userId);
    $this->longPollingService->send('account/syncUser/' . $userId, $user);
  }
}
