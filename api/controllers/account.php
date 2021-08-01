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
      "deleteTokensTable" => false,
      "createTable" => false,
      "createTokensTable" => false,
      "createAdmin" => false,
    );
    // Проверить секретный пароль
    if ($data["password"] == $this->config["appPassword"]) {
      $dataBase = new DataBaseService($this->pdo);
      // Настройка таблиц
      $result["deleteTable"] = $dataBase->executeFromFile("account/deleteTable.sql");
      $result["deleteTokensTable"] = $dataBase->executeFromFile("account/deleteTokensTable.sql");
      $result["createTable"] = $dataBase->executeFromFile("account/createTable.sql");
      $result["createTokensTable"] = $dataBase->executeFromFile("account/createTokensTable.sql");
      $result["createAdmin"] = $dataBase->executeFromFile("account/createAdmin.sql");
    }
    // Результат работы функции
    return $result;
  }

  // Авторизация пользователя
  public function auth($data)
  {
    $code = "9010";
    $message = "";
    $id = "";
    $token = "";
    $sqlData = array();
    // Если получены данные
    if (strlen($data["login"]) > 0 && strlen($data["password"]) > 0) {
      $dataBase = new DataBaseService($this->pdo);
      $code = "9013";
      // Данные
      $sqlData = array(
        $data["login"],
        hash("sha512", $this->config["hashSecret"] . $data["password"])
      );
      // Запрос авторизации
      $auth = $dataBase->getDatasFromFile("account/auth.sql", $sqlData);
      // Проверить авторизацию
      if (count($auth) > 0) {
        if (strlen($auth[0]["id"]) > 0) {
          $id = $auth[0]["id"];
          $token = hash("sha512", $this->config["hashSecret"] . $id . "_" . gmdate("U"));
          // Сохранить токен
          if ($dataBase->executeFromFile("account/createToken.sql", array($token, $id))) {
            $code = "0001";
          }
          // Ошибка сохранения токена
          else {
            $code = "9014";
          }
        }
      }
      // Убрать метку пароля
      //unset($sqlData[1]);
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
        "token" => $token,
        "input" => $sqlData,
        "result" => $code == "0001"
      )
    );
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
      $reCaptcha = new ReCaptchaService($data["captcha"], $this->config);
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
            // TODO: Добавить отправку письма на почту
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
      // Ошибка капчи
      else {
        $code = "9010";
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
