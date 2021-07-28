<?

namespace OnlineDreamsDiary\Controllers;

include_once "services/recaptcha.php";
include_once "services/database.php";
include_once "config/database.php";

use OnlineDreamsDiary\Services\ReCaptchaService;
use OnlineDreamsDiary\Services\DataBaseService;
use PDO;
use PDOException;



class Account
{

  private array $config;
  private PDO $pdo;

  // Получить настройки БД
  public function setDbContext(PDO $pdo): void
  {
    $this->pdo = $pdo;
  }

  // Получить настройки приложения
  public function setConfig(array $config): void
  {
    $this->config = $config;
  }



  // Создание таблиц
  // * GET
  public function createTable($data)
  {
    $result = array(
      "deleteTable" => false,
      "createTable" => false,
      "createAdmin" => hash("sha512", "test")
    );
    // Проверить секретный пароль
    if ($data["password"] == $this->config["appPassword"]) {
      $dataBase = new DataBaseService($this->pdo);
      // Настройка таблиц
      $result["deleteTable"] = $dataBase->executeFromFile("account/deleteTable.sql");
      $result["createTable"] = $dataBase->executeFromFile("account/createTable.sql");
      $result["createAdmin"] = $dataBase->executeFromFile("account/createAdmin.sql");
    }
    // Результат работы функции
    return $result;
  }

  // Регистрация пользователя
  // * POST
  public function register($data)
  {
    $code = "9010";
    $message = "";
    $id = "";
    $sqlData = array();
    // Если получены данные
    if (strlen($data["login"]) > 0 && strlen($data["email"]) > 0) {
      $dataBase = new DataBaseService($this->pdo);
      $reCaptcha = new ReCaptchaService($data["captcha"]);
      // Данные
      $sqlData = array(
        $data["login"],
        hash("sha512", $this->config["hashSecret"] . $data["password"]),
        $data["name"],
        $data["lastName"],
        date("Y-m-d", strtotime($data["birthDate"])),
        $data["sex"],
        $data["email"],
        json_encode(array())
      );

      // Проверить капчу
      if ($reCaptcha->checkCaptcha()) {
        $checkLogin = $dataBase->getDatasFromFile("account/checkLoginEmail.sql", array($data["login"], $data["email"]));
        // Проверить логин
        if (count($checkLogin) == 0) {
          // Регистрация пользователя
          if ($dataBase->executeFromFile("account/registerUser.sql", $sqlData)) {
            $code = "0001";
          }
          // Регистрация неудалась
          else {
            $code = "9021";
          }
        }
        // Логин или почта повторяются
        else {
          foreach ($checkLogin as $row) {
            // Логин
            if ($row["login"] == $data["login"]) {
              $code = "9011";
            }
            // Почта
            else {
              $code = "9012";
            }
            break;
          }
        }
      }
      // Ошибка подключения
      else {
        $code = "9020";
      }
    }
    // Получены пустые данные
    else {
      $code = "9030";
    }
    // Вернуть массив
    return array(
      "code" => $code,
      "message" => $message,
      "data" => array(
        "id" => $id,
        "input" => $sqlData,
        "result" => $code == "0001"
      )
    );
  }
}


return new Account();
