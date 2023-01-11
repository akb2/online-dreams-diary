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
          $friend = array(
            'id' => $mixedFriend['id'],
            'inUserId' => $mixedFriend['in_user_id'],
            'outUserId' => $mixedFriend['out_user_id'],
            'inDate' => $mixedFriend['in_date'],
            'outDate' => $mixedFriend['out_date'],
            'status' => $mixedFriend['status']
          );
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
