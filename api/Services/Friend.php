<?

namespace Services;

use PDO;



class FriendService
{
  private PDO $pdo;
  private array $config;

  private DataBaseService $dataBaseService;
  private NotificationService $notificationService;

  public function __construct(PDO $pdo, array $config)
  {
    $this->pdo = $pdo;
    $this->config = $config;
    // Подключить сервисы
    $this->dataBaseService = new DataBaseService($this->pdo);
    $this->notificationService = new NotificationService($this->pdo, $this->config);
  }



  // Пересобрать таблицы БД
  public function createTableApi(string $password): bool
  {
    // Проверить секретный пароль
    if ($password == $this->config['appPassword']) {
      // Настройка таблиц
      return $this->dataBaseService->executeFromFile('friend/createTable.sql');
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
      return $this->dataBaseService->executeFromFile('friend/deleteTable.sql');
    }
    // Результат работы функции
    return false;
  }



  // Данные о текущей заявке
  public function getFriendStatus(int $outUser, int $inUser)
  {
    if ($outUser > 0 && $inUser > 0) {
      $sqlData = array(
        'in_user_id' => $inUser,
        'out_user_id' => $outUser
      );
      $friend = $this->dataBaseService->getDatasFromFile('friend/getFriendStatus.sql', $sqlData);
      // Запись найдена
      if (count($friend) > 0) {
        if (isset($friend[0]['id']) && $friend[0]['id'] > 0) {
          return $friend[0];
        }
      }
    }
    // Заявки не существует
    return null;
  }

  // Получить список сновидений
  public function getList(array $search): array
  {
    $count = 0;
    $result = array();
    $limit = $search['limit'] > 0 && $search['limit'] <= 100 ? $search['limit'] : $this->config['friends']['limit'];
    // Допустимые типы
    $types = array('friends', 'subscribers', 'subscribe');
    // Данные для поиска
    $sqlData = array(
      // Значения полей
      'type' => array_search($search['type'], $types) ? $search['type'] : $types[0],
      'user_id' => intval($search['user'])
    );
    // Запрос
    $count = $this->dataBaseService->getCountFromFile('friend/getFriendsCount.php', $sqlData);
    $page = isset($search['page']) && $search['page'] > 0 ? $search['page'] : 1;
    // Друзья найдены
    if ($count > 0) {
      $maxPage = ceil($count / $limit);
      $page = $page < 1 ? 1 : ($page > $maxPage ? $maxPage : $page);
      // Настройки ограничения данных
      $sqlData['limit_start'] = intval(($page * $limit) - $limit);
      $sqlData['limit_length'] = intval($limit);
      // Список данных
      $result = $this->dataBaseService->getDatasFromFile('friend/getFriendsList.php', $sqlData);
    }
    // Список друзей
    return array(
      'count' => $count,
      'limit' => $limit,
      'result' => $result
    );
  }



  // Добавить в друзья
  public function addToFriend(int $outUser, int $inUser): bool
  {
    if ($outUser > 0 && $inUser > 0) {
      $friend = $this->getFriendStatus($outUser, $inUser);
      // Заявка не существует
      if (!$friend) {
        $sqlData = array($outUser, $inUser);
        $result = $this->dataBaseService->executeFromFile('friend/addToFriends.sql', $sqlData);
        // Отправить уведомление
        if (!!$result) {
          $link = '/profile/' . $outUser;
          $this->notificationService->create(
            $inUser,
            '<a href="' . $link . '">${user.name} ${user.lastName}</a> отправил${user.sexLetter} вам заявку в друзья, добавить в друзья?',
            $link,
            array('user' => $outUser),
            'add_to_friend'
          );
        }
        // Вернуть результат
        return $result;
      }
    }
    // Заявка не отправлена
    return false;
  }

  // Отменить заявку в друзья
  public function rejectFriends(int $outUser, int $inUser): bool
  {
    if ($outUser > 0 && $inUser > 0) {
      $friend = $this->getFriendStatus($outUser, $inUser);
      // Заявка существует
      if (!!$friend) {
        // Заявка подходит под условия
        if ($friend['status'] == '0' || $friend['status'] == '2') {
          $sqlData = array(
            'in_user_id' => $inUser,
            'out_user_id' => $outUser
          );
          // Попытка отмены заявки
          return $this->dataBaseService->executeFromFile('friend/rejectFriendsByUsers.sql', $sqlData);
        }
      }
    }
    // Заявка не отправлена
    return false;
  }

  // Подтвердить заявку в друзья
  public function confirmFriends(int $outUser, int $inUser): bool
  {
    if ($outUser > 0 && $inUser > 0) {
      $friend = $this->getFriendStatus($outUser, $inUser);
      // Заявка существует
      if (!!$friend) {
        // Заявка подходит под условия
        if (($friend['status'] == '0' && $friend['out_user_id'] == $outUser) || ($friend['status'] == '2' && $friend['in_user_id'] == $outUser)) {
          $sqlData = array(
            'in_user_id' => $inUser,
            'out_user_id' => $outUser
          );
          // Попытка создания заявки
          return $this->dataBaseService->executeFromFile('friend/confirmFriendsByUsers.sql', $sqlData);
        }
      }
    }
    // Заявка не отправлена
    return false;
  }

  // Удалить из друзей
  public function cancelFromFriends(int $outUser, int $inUser): bool
  {
    if ($outUser > 0 && $inUser > 0) {
      $friend = $this->getFriendStatus($outUser, $inUser);
      // Заявка существует
      if (!!$friend && $friend['status'] == '1') {
        $sqlData = array(
          'in_user_id' => $inUser,
          'out_user_id' => $outUser
        );
        // Попытка создания заявки
        return $this->dataBaseService->executeFromFile('friend/cancelFromFriendsByUsers.sql', $sqlData);
      }
    }
    // Заявка не отправлена
    return false;
  }
}
