<?

namespace Controllers;

use PDO;
use Services\FriendService;
use Services\UserService;
use Services\TokenService;



class Friend
{
  private $config;
  private PDO $pdo;

  private UserService $userService;
  private TokenService $tokenService;
  private FriendService $friendService;



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
    $this->userService = new UserService($this->pdo, $this->config);
    $this->tokenService = new TokenService($this->pdo, $this->config);
    $this->friendService = new FriendService($this->pdo, $this->config);
  }



  // Конвертировать данные для API
  private function convertFriendData(array $friend, bool $userDatas = false): array
  {
    $result = array(
      'id' => intval($friend['id']),
      'inUserId' => intval($friend['in_user_id']),
      'outUserId' => intval($friend['out_user_id']),
      'inDate' => $friend['in_date'],
      'outDate' => $friend['out_date'],
      'status' => intval($friend['status'])
    );
    // Добавить данные о пользователях
    if ($userDatas) {
      $usersKey = array('inUser' => $result['inUserId'], 'outUser' => $result['outUserId']);
      // Цикл по данным
      foreach ($usersKey as $key => $userId) {
        $user = $this->userService->getUser($userId);
        // ПОльзователь найден
        if (isset($user['id'])) {
          $result[$key] = $user;
        }
      }
    }
    // Вернуть данные
    return $result;
  }



  // Статус дружбы между пользователями
  // * GET
  public function getFriendStatus($data): array
  {
    $code = '0000';
    $id = $_GET['token_user_id'];
    $token = $_GET['token'];
    $inUserId = $data['in_user_id'];
    $outUserId = $data['out_user_id'];
    $friend = array();

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        $mixedFriend = $this->friendService->getFriendStatus($outUserId, $inUserId);
        // Запись найдена
        if (is_array($mixedFriend)) {
          $code = '0001';
          $friend = $this->convertFriendData($mixedFriend['id']);
        }
        // Запись не найдена
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

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => '',
      'data' => $friend
    );
  }

  // Список друзей/подписок/подписчиков
  // * GET
  public function getList($data): array
  {
    $code = "0002";
    $search = array(
      "page" => isset($data["search_page"]) && intval($data["search_page"]) ? intval($data["search_page"]) : "",
      "user" => isset($data["search_user"]) && intval($data["search_user"]) ? intval($data["search_user"]) : "",
      "limit" => isset($data["search_limit"]) && intval($data["search_limit"]) ? intval($data["search_limit"]) : "",
      "type" => isset($data["search_type"]) && strlen($data["search_type"]) > 0 ? $data["search_type"] : ""
    );
    $testFriends = $this->friendService->getList($search);
    $friends = array();
    // Сновидение найдено
    if ($testFriends["count"] > 0) {
      // Доступность для просмотра или редактирования
      $code = "0001";
      // Обработка списка
      foreach ($testFriends["result"] as $friend) {
        $friends[] = $this->convertFriendData($friend['id'], true);
      }
    }
    // Сновидение не найдено
    else {
      $code = "0002";
    }
    // Вернуть результат
    return array(
      "data" => array(
        "count" => $testFriends["count"],
        "limit" => $testFriends["limit"],
        "dreams" => $friends
      ),
      "code" => $code
    );
  }



  // Отправить заявку в друзья
  // * POST
  public function addToFriends($data): array
  {
    $code = '0000';
    $id = $_GET['token_user_id'];
    $token = $_GET['token'];
    $userId = $data['user_id'];
    $result = false;

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        // Если заявка создана
        if ($this->friendService->addToFriend($id, $userId)) {
          $code = '0001';
          $result = true;
        }
        // Заявка не создана
        else {
          $code = '6001';
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

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => '',
      'data' => $result
    );
  }

  // Отменить заявку в друзья
  // * POST
  public function rejectFriends($data): array
  {
    $code = '0000';
    $id = $_GET['token_user_id'];
    $token = $_GET['token'];
    $userId = $data['user_id'];
    $result = 152;

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        // Если заявка отклонена
        if ($result = $this->friendService->rejectFriends($id, $userId)) {
          $code = '0001';
        }
        // Заявка не отклонена
        else {
          $code = '6002';
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

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => '',
      'data' => $result
    );
  }

  // Подтвердить заявку в друзья
  // * POST
  public function confirmFriends($data): array
  {
    $code = '0000';
    $id = $_GET['token_user_id'];
    $token = $_GET['token'];
    $userId = $data['user_id'];
    $result = false;

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        // Если заявка создана
        if ($this->friendService->confirmFriends($userId, $id)) {
          $code = '0001';
          $result = true;
        }
        // Заявка не подтверждена
        else {
          $code = '6003';
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

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => '',
      'data' => $result
    );
  }

  // Удалить пользователя из друзей
  // * POST
  public function cancelFromFriends($data): array
  {
    $code = '0000';
    $id = $_GET['token_user_id'];
    $token = $_GET['token'];
    $userId = $data['user_id'];
    $result = false;

    // Проверить токен
    if ($this->tokenService->checkToken($id, $token)) {
      // Проверка доступа
      if ($id == $this->tokenService->getUserIdFromToken($token)) {
        // Если заявка создана
        if ($this->friendService->cancelFromFriends($userId, $id)) {
          $code = '0001';
          $result = true;
        }
        // Пользователь не удален из друзей
        else {
          $code = '6004';
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

    // Вернуть массив
    return array(
      'code' => $code,
      'message' => '',
      'data' => $result
    );
  }
}


return new Friend();
