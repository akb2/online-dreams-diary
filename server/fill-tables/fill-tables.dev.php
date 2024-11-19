<?
$_SERVER['DOCUMENT_ROOT'] = __DIR__ . '/../../api/';

spl_autoload_register(function ($name) {
  $name = preg_replace('/^(.*?)(Service)$/i', '$1', $name);
  $file = __DIR__ . '/../../api/' . $name . '.php';
  $file = preg_replace('/([\/\\\]+)/i', '/', $file);
  echo $file;
  // Подключить файл
  if (file_exists($file)) {
    include_once $file;
  }
});

use Services\App;
use Services\UserService;



// Очистить случайный нежелательный кэш
if (ob_get_level() > 0) {
  ob_end_clean();
}

ob_start();



$appService = new App();
$config = $appService->getSecretDatas();
$pdo = $appService->dbConnect();
$userService = new UserService($pdo, $config);



$users = array();



include "fill-users.dev.php";
