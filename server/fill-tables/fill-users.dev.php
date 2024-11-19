<?
$users = array_merge(
  include "datas/admin.dev.php",
  include "datas/users.dev.php",
);

foreach ($users as $user) {
  $user['id'] = $userService->createUser($user);
  // Пользователь создан
  if ($user['id'] > 0) {
    echo "\n\n" . 'Создан пользователь с ID: ' . $user['id'] . "\n\n";
  }
}
