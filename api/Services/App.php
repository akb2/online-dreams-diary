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
    $this->pdo = $this->dataBase->getConnection($this->config);
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
    $controllerClass = "Controllers\\" . ucfirst($controllerName);
    $file =  "Controllers/" . ucfirst($controllerName) . ".php";
    // Подключение контроллера
    if (file_exists($file)) {
      $controller = include $file;
      $method = strtolower($_SERVER['REQUEST_METHOD']);
      $params = array('default' => $_REQUEST, 'get' => $_GET, 'post' => $_POST);
      // Выполнение
      if (method_exists($controller, $methodName)) {
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
        $data = $params[$method] ?? $params['default'];
        $decorators = $this->runDecorators($controllerClass, $methodName, $data);
        // Вызов метода
        if ($decorators === true) {
          return $controller->$methodName($data);
        }
        // Вернуть данные из декораторов
        return $decorators;
      }
    }
    // Контроллер не найден
    return null;
  }



  // Отработать декораторы
  private function runDecorators($controllerClass, string $methodName, $data): array|true
  {
    $reflectionFunction = new \ReflectionMethod($controllerClass, $methodName);
    $attributes = $reflectionFunction->getAttributes();
    // Выполнение декораторов
    if (count($attributes) > 0) {
      $result = true;
      // Цикл по декораторам
      foreach ($attributes as $attribute) {
        $class = $attribute->newInstance();
        // Передать настройки
        if (method_exists($class, "setConfig")) {
          $class->setConfig($this->config);
        }
        // Передать контекст БД
        if (method_exists($class, "setDbContext")) {
          $class->setDbContext($this->pdo);
        }
        // Запуск сервисов
        if (method_exists($class, "setServices")) {
          $class->setServices();
        }
        // Выполнение кода
        $testData = $class->execute($data);
        $result = $testData === true ? $result : $testData;
      }
      // Вернуть данные
      return $result;
    }
    // Без декораторов
    else {
      return true;
    }
  }
}
