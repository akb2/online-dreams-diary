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
}
