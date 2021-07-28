<?

namespace OnlineDreamsDiary;

include_once "services/app.php";

use OnlineDreamsDiary\Services\App;



$controllerParam = $_GET['controller'];
$methodParam = $_GET['method'];

$app = new App();
$pdo = $app->dbConnect();
$config = $app->getSecretDatas();
$controller = $app->controllerConnect($controllerParam, $methodParam);

$result = array(
  "error" => false,
  "controller" => $controllerParam,
  "method" => $methodParam,
  "queryParams" => array(
    "post" => $_POST,
    "get" => $_GET,
  ),
  "result" => $controller
);



// Показать результат работы
if (!$controller) {
  $result["error"] = true;
  $result["result"]["code"] = "9001";
}


echo json_encode($result);
