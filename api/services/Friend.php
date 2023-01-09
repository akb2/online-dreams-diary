<?

namespace Services;

use PDO;



class FriendService
{
  private PDO $pdo;
  private array $config;

  private DataBaseService $dataBaseService;
  private MailService $mailService;
  private UserService $userService;

  public function __construct(PDO $pdo, array $config)
  {
    $this->pdo = $pdo;
    $this->config = $config;
    // Подключить сервисы
    $this->dataBaseService = new DataBaseService($this->pdo);
    $this->mailService = new MailService($this->config);
    $this->userService = new UserService($this->pdo, $this->config);
  }



  // Данные о текущей заявке
  public function getFriendStatus(int $outUser, int $inUser)
  {
    if ($outUser > 0 && $inUser > 0) {
      $sqlData = array(
        'in_user_id' => $inUser,
        'out_user_id' => $outUser
      );
      $friend = $this->dataBaseService->getDatasFromFile("friend/getFriendStatus.sql", $sqlData);
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



  // Добавить в друзья
  public function addToFriend(int $outUser, int $inUser): bool
  {
    if ($outUser > 0 && $inUser > 0) {
      $friend = $this->getFriendStatus($outUser, $inUser);
      // Заявка не существует
      if (!$friend) {
        $sqlData = array($outUser, $inUser);
        // Попытка создания заявки
        return $this->dataBaseService->executeFromFile("friend/addToFriends.sql", $sqlData);
      }
    }
    // Заявка не отправлена
    return false;
  }
}
