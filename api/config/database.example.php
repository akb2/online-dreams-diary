<?

namespace OnlineDreamsDiary\Config;

use PDO;
use PDOException;



class DataBase
{

  private string $host = "**Сервер**";
  private string $db_name = "**Таблица**";
  private string $username = "**Пользователь**";
  private string $password = "**Пароль**";
  public PDO $pdo;



  // получаем соединение с БД
  public function getConnection(): PDO
  {
    try {
      $this->pdo = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
      $this->pdo->exec("set names utf8");
    } catch (PDOException $exception) {
      echo "Connection error: " . $exception->getMessage();
    }

    return $this->pdo;
  }
}
