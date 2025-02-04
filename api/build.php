<?
spl_autoload_register(function ($name) {
  $name = preg_replace('/^(.*?)(Service)$/i', '$1', $name);
  $file = $_SERVER['DOCUMENT_ROOT'] . '/' . $name . '.php';
  $file = preg_replace('/([\/\\\]+)/i', '/', $file);
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



$controllerParam = $_SERVER['CONTROLLER'];
$methodParam = $_SERVER['METHOD'];

$app = new App();
$config = $app->getSecretDatas();
$pdo = $app->dbConnect();
$controller = $app->controllerConnect($controllerParam, $methodParam);

$result = array(
  "error" => false,
  "controller" => $controllerParam,
  "method" => $methodParam,
  "queryParams" => array(
    "post" => $_POST,
    "request" => $_REQUEST,
    "get" => $_GET
  ),
  "result" => $controller,
  "echo" => ob_get_contents()
);



// Показать результат работы
if (!$controller) {
  $result["error"] = true;
  $result["result"]["code"] = "9001";
}



ob_end_clean();
echo json_encode($result);
