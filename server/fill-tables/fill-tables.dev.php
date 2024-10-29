<?
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



// Очистить случайный нежелательный кэш
if (ob_get_level() > 0) {
  ob_end_clean();
}

ob_start();



$app = new App();
$config = $app->getSecretDatas();
$pdo = $app->dbConnect();
