<?

namespace Services;

use PDO;



class UserSettingsService
{
  private PDO $pdo;
  private array $config;

  private UserService $userService;
  private FriendService $friendService;

  public function __construct(PDO $pdo, array $config)
  {
    $this->pdo = $pdo;
    $this->config = $config;
    // Подключить сервисы
    $this->userService = new UserService($this->pdo, $this->config);
    $this->friendService = new FriendService($this->pdo, $this->config);
  }



  // Настройки приватности по умолчанию
  private function getDefaultUserPrivate(): array
  {
    return array(
      'myPage' => $this->getDefaultUserPrivateItem(),
      'myDreamList' => $this->getDefaultUserPrivateItem()
    );
  }

  // Настройки правила приватности по умолчанию
  private function getDefaultUserPrivateItem(): array
  {
    return array(
      'type' => 3,
      'blackList' => array(),
      'whiteList' => array()
    );
  }



  // Проверить настройку приватности
  public function checkPrivate(string $rule, int $userId, int $currentUser)
  {
    $user = $this->userService->getUser($userId);
    $rules = is_array($user['private']) && count($user['private']) > 0 ? $user['private'] : $this->getDefaultUserPrivate();
    $ruleData = is_array($rules[$rule]) && count($rules[$rule]) > 0 ? $rules[$rule] : $this->getDefaultUserPrivateItem();
    $hasntBePublic = ['myCommentsWrite'];
    // Правило существует
    if (!!$ruleData) {
      // Привести к типам
      $ruleData['type'] = intval($ruleData['type']);
      $ruleData['type'] = array_search($rule, $hasntBePublic) ? 2 : $ruleData['type'];
      // Пользователь в белом списке
      if (array_search($currentUser, $ruleData['whiteList'])) {
        return true;
      }
      // Пользователя нет в черном списке
      elseif (!array_search($currentUser, $ruleData['blackList'])) {
        // Публичное правило
        // ? 3
        if ($ruleData['type'] == 3) {
          return true;
        }
        // Публичное правило в пределах участников сайта
        // ? 2
        elseif ($ruleData['type'] == 2 && $currentUser > 0) {
          return true;
        }
        // Пользователя являются друзьями
        // ? 1
        elseif ($ruleData['type'] == 1) {
          $friend = $this->friendService->getFriendStatus($currentUser, $userId);
          // Заявка существует
          if (!!$friend && count($friend) > 0) {
            // Доступно для друга
            if ($friend['status'] == '1') {
              return true;
            }
            // Доступно если пользователь подал заяку
            else if (($friend['status'] == '0' && $friend['out_user_id'] == $userId) || ($friend['status'] == '2' && $friend['in_user_id'] == $userId)) {
              return true;
            }
          }
        }
      }
    }
    // Нет доступа
    return $currentUser == $userId;
  }
}
