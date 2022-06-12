<?

namespace OnlineDreamsDiary\Services;

use PDO;



class DataBaseService
{
  private PDO $pdo;

  function __construct(PDO $pdo)
  {
    $this->pdo = $pdo;
  }



  // Выполнить запрос SQL из файла
  public function executeFromFile(string $fileName, array $params = array()): bool
  {
    $sqlText = $this->getSqlFromFile($fileName);
    // Выполнять запрос
    if (strlen($sqlText) > 0) {
      return $this->pdo->prepare($sqlText)->execute($params);
    }
    // Запрос неудался
    return false;
  }

  // Получить данные из файла
  public function getDatasFromFile(string $fileName, array $params = array())
  {
    $sqlText = $this->getSqlFromFile($fileName);
    // Выполнять запрос
    if (strlen($sqlText) > 0) {
      $sql = $this->pdo->prepare($sqlText);
      $sql->execute($params);
      return $sql->fetchAll(PDO::FETCH_ASSOC);
    }
    // Запрос неудался
    return array();
  }

  // Получить данные из файла совместно со строкой
  public function getDatasFromFileString(string $fileName, string $endQuery, array $params = array())
  {
    $sqlText = $this->getSqlFromFile($fileName);
    // Выполнять запрос
    if (strlen($sqlText) > 0) {
      $sql = $this->pdo->prepare($sqlText . " " . $endQuery);
      $sql->execute($params);
      return $sql->fetchAll(PDO::FETCH_ASSOC);
    }
    // Запрос неудался
    return array();
  }

  // Подсчитать данные из файла совместно со строкой
  public function getCountFromFileString(string $fileName, string $endQuery, array $params = array())
  {
    $sqlText = $this->getSqlFromFile($fileName);
    // Выполнять запрос
    if (strlen($sqlText) > 0) {
      $sql = $this->pdo->prepare($sqlText . " " . $endQuery);
      $sql->execute($params);
      return $sql->fetchColumn();
    }
    // Запрос неудался
    return array();
  }

  // Получить содержимое запроса
  private function getSqlFromFile(string $fileName): string
  {
    $file = "config/mysql_tables/" . $fileName;
    // Выполнять запрос
    if (file_exists($file)) {
      $sqlText = file_get_contents($file);
      if (strlen($sqlText) > 0) {
        return $sqlText;
      }
    }
    // Запрос неудался
    return "";
  }

  // Получить текст запроса для теста
  public function interpolateQuery(string $fileName, string $endQuery, array $params = array())
  {
    $query = $this->getSqlFromFile($fileName);
    // Цикл по данным
    foreach ($params as $key => $value) {
      $key = is_string($key) ? "/:" . $key . "/" : "/[\?]+/";
      // Параметры: строка
      if (is_string($value))
        $value = "'" . $value . "'";
      // Параметры: массив
      if (is_array($value))
        $value = "'" . implode("','", $value) . "'";
      // Параметры: NULL
      if (is_null($value))
        $value = "NULL";
      // Заменить данные
      $query = preg_replace($key, $value, $query, 1);
    }
    // Текст запроса
    return $query . " " . $endQuery;
  }
}
