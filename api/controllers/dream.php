<?

namespace OnlineDreamsDiary\Controllers;

include_once "services/database.php";
include_once "config/database.php";

use PDO;



class Dream
{

  private PDO $pdo;



  // Получить настройки БД
  public function setDbContext(PDO $pdo): void
  {
    $this->pdo = $pdo;
  }
}


return new Dream();
