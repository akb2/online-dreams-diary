<?

namespace Config;

use PDO;
use PDOException;



class DataBase
{

  private string $host;
  private string $db_name;
  private string $username;
  private string $password;
  public PDO $pdo;



  // получаем соединение с БД
  public function getConnection(array $config): PDO
  {
    $this->host = $config['mysql_host'];
    $this->db_name = $config['mysql_db_name'];
    $this->username = $config['mysql_username'];
    $this->password = $config['mysql_password'];
    // Подключение
    try {
      $this->pdo = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
      $this->pdo->exec("set names utf8");
    }
    // Ошибка подключения
    catch (PDOException $exception) {
      echo "Connection error: " . $exception->getMessage();
    }

    return $this->pdo;
  }
}
