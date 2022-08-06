<?

namespace Services;

use Config\DataBase;
use PDO;



class App
{

  private PDO $pdo;
  private array $config;
  private DataBase $dataBase;



  // Подключиться к БД
  public function dbConnect(): PDO
  {
    $this->dataBase = new DataBase();
    $this->pdo = $this->dataBase->getConnection();
    return $this->pdo;
  }

  // Получить настройки
  public function getSecretDatas(): array
  {
    $src = "Config/secretDatas.json";
    // Проверить настройки
    if (file_exists($src)) {
      $fileData = file_get_contents($src);
      $jsonData = json_decode($fileData, true);
      if (count($jsonData) > 0) {
        $this->config = $jsonData;
        return $jsonData;
      }
    }
    // Вернуть пустой массив
    $this->config = array();
    return array();
  }

  // Подключение к контроллеру
  public function controllerConnect(string $controllerName, string $methodName)
  {
    $file = "Controllers/" . ucfirst($controllerName) . ".php";
    // Подключение контроллера
    if (file_exists($file)) {
      $controller = include $file;
      // Передать настройки
      if (method_exists($controller, "setConfig")) {
        $controller->setConfig($this->config);
      }
      // Передать контекст БД
      if (method_exists($controller, "setDbContext")) {
        $controller->setDbContext($this->pdo);
      }
      // Запуск сервисов
      if (method_exists($controller, "setServices")) {
        $controller->setServices();
      }

      // Выполнить нужный метод
      if (method_exists($controller, $methodName)) {
        return $controller->$methodName($_REQUEST);
      }
    }
    // Контроллер не найден
    return null;
  }
}
