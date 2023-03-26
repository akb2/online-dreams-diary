<?

namespace Services;

use PDO;
use Models\File;



class DataBaseService
{
  private PDO $pdo;

  public function __construct(PDO $pdo)
  {
    $this->pdo = $pdo;
  }



  // Выполнить запрос SQL из файла
  public function executeFromFile(string $fileName, array $params = array()): bool
  {
    $sqlText = $this->getSqlFromFile($fileName, $params);
    // Выполнять запрос
    if (strlen($sqlText) > 0) {
      return $this->pdo->prepare($sqlText)->execute($this->checkInputParams($sqlText, $params));
    }
    // Запрос неудался
    return false;
  }

  // Получить данные из файла
  public function getDatasFromFile(string $fileName, array $params = array())
  {
    $sqlText = $this->getSqlFromFile($fileName, $params);
    // Выполнять запрос
    if (strlen($sqlText) > 0) {
      $sql = $this->pdo->prepare($sqlText);
      $sql->execute($this->checkInputParams($sqlText, $params));
      return $sql->fetchAll(PDO::FETCH_ASSOC);
    }
    // Запрос неудался
    return array();
  }

  // Подсчитать данные из файла совместно со строкой
  public function getCountFromFile(string $fileName, array $params = array()): int
  {
    $sqlText = $this->getSqlFromFile($fileName, $params);
    // Выполнять запрос
    if (strlen($sqlText) > 0) {
      $sql = $this->pdo->prepare($sqlText);
      $sql->execute($this->checkInputParams($sqlText, $params));
      $count = $sql->fetch(PDO::FETCH_NUM);
      return intval(!!$count ? reset($count) : 0);
    }
    // Запрос неудался
    return 0;
  }

  // Получить текст запроса для теста
  public function interpolateQuery(string $fileName, array $params = array())
  {
    $query = $this->getSqlFromFile($fileName, $params);
    // Цикл по данным
    foreach ($params as $key => $value) {
      $assoc = is_string($key);
      $key = $assoc ? '/:' . $key . '/' : '/[\?]+/';
      // Параметры: строка
      if (is_string($value))
        $value = '"' . $value . '"';
      // Параметры: массив
      if (is_array($value))
        $value = '"' . implode('","', $value) . '"';
      // Параметры: NULL
      if (is_null($value))
        $value = 'NULL';
      // Заменить данные
      $query = preg_replace($key, $value, $query, $assoc ? -1 : 1);
    }
    // Текст запроса
    return $query;
  }



  // Получить содержимое запроса
  private function getSqlFromFile(string $fileName, array $params = array()): string
  {
    $sqlText = '';
    $file = new File('Config/mysql_tables/' . $fileName);
    // Файл существует
    if ($file->exists()) {
      // Текст запроса из файла с выполнением кода PHP
      if ($file->extension() === 'php') {
        $sqlText = $file->eval($this->checkInputParams("", $params, false));
      }
      // Текст запроса из файла
      else {
        $sqlText = $file->content();
      }
    }
    // Запрос неудался
    return $sqlText;
  }

  // Скорректировать массив данных согласно тексту запроса
  private function checkInputParams(string $query, array $params, bool $checkParams = true): array
  {
    $newParams = array();
    // Удалить незадействованные параметры
    if (!$checkParams) {
      $newParams = $params;
    }
    // Не удалять неиспользуемые параметры
    else {
      preg_match_all('/(\?)/ui', $query, $findAsArray, PREG_PATTERN_ORDER);
      preg_match_all('/:([a-z0-9\-_]+)/ui', $query, $findAsObject, PREG_PATTERN_ORDER);
      // Настройки
      $findAsArrayCount = count($findAsArray[1]);
      // Корректировка для порядкого перечисления
      for ($k = 0; $k < $findAsArrayCount; $k++) {
        $newParams[$k] = isset($params[$k]) ? $params[$k] : "";
      }
      // Корректировка для параметров с ключами
      foreach ($findAsObject[1] as $k) {
        $newParams[$k] = isset($params[$k]) ? $params[$k] : "";
      }
      // Корректировать тип данных
      foreach ($newParams as $k => $v) {
        $types = array('boolean', 'integer', 'double', 'string');
        if (!in_array(gettype($v), $types)) {
          $newParams[$k] = $this->pdo->quote(strval($v));
        }
      }
    }
    // Вернуть корректный массив данных
    return $newParams;
  }
}
