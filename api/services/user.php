<?

namespace OnlineDreamsDiary\Services;

include_once "./libs/thumbs.php";

use PDO;
use OnlineDreamsDiary\Libs\Thumbs;



class UserService
{
  private PDO $pdo;
  private array $config;
  private TokenService $tokenService;

  private DataBaseService $dataBaseService;

  private string $avatarDir = "../media/images/user_avatars";
  private string $avatarUrl = "/images/user_avatars";
  private array $avatarExts = array("png", "jpg", "jpeg");
  private array $avatarKeys = array("full", "crop", "middle", "small");
  private array $avatarKeysCrop = array("crop" => "full", "middle" => "crop");
  private array $avatarKeysCropPos = array("startX", "width", "startY", "height");

  function __construct(PDO $pdo, array $config)
  {
    $this->pdo = $pdo;
    $this->config = $config;
    // Подключить сервисы
    $this->dataBaseService = new DataBaseService($this->pdo);
    $this->reCaptchaService = new ReCaptchaService("", $this->config);
    $this->tokenService = new TokenService($this->pdo, $this->config);
  }



  // Пересобрать таблицы БД
  public function createTableApi(string $password): array
  {
    $result = array(
      "deleteTable" => false,
      "createTable" => false,
      "createAdmin" => false,
    );
    // Проверить секретный пароль
    if ($password == $this->config["appPassword"]) {
      // Настройка таблиц
      $result["deleteTable"] = $this->dataBaseService->executeFromFile("account/deleteTable.sql");
      $result["createTable"] = $this->dataBaseService->executeFromFile("account/createTable.sql");
      $result["createAdmin"] = $this->dataBaseService->executeFromFile("account/createAdmin.sql");
    }
    // Результат работы функции
    return $result;
  }



  // Авторизация
  public function authUserApi(array $data): array
  {
    $code = "9010";
    $message = "";
    $id = "";
    $token = "";
    $sqlData = array();

    // Если получены данные
    if (strlen($data["login"]) > 0 && strlen($data["password"]) > 0) {
      $code = "9013";
      // Данные
      $sqlData = array(
        $data["login"],
        hash("sha512", $this->config["hashSecret"] . $data["password"])
      );
      // Запрос авторизации
      $auth = $this->dataBaseService->getDatasFromFile("account/auth.sql", $sqlData);
      // Проверить авторизацию
      if (count($auth) > 0) {
        if (strlen($auth[0]["id"]) > 0) {
          $id = $auth[0]["id"];
          $token = $this->tokenService->createToken($id);
          $code = strlen($token) > 0 ? "0001" : "9014";
        }
      }
      // Убрать метку пароля
      unset($sqlData[1]);
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

  // Регистрация нового пользователя
  public function registerUserApi(array $data): array
  {
    $code = "9010";
    $message = "";
    $id = "";
    $sqlData = array();

    // Если получены данные
    if (strlen($data["login"]) > 0 && strlen($data["email"]) > 0) {
      $this->reCaptchaService->setCaptchaCode($data["captcha"]);
      // Данные
      $sqlData = array(
        $data["login"],
        hash("sha512", $this->config["hashSecret"] . $data["password"]),
        $data["name"],
        $data["lastName"],
        date("Y-m-d", strtotime($data["birthDate"])),
        $data["sex"],
        $data["email"],
        json_encode(array()),
        json_encode(array())
      );

      // Проверить капчу
      if ($this->reCaptchaService->checkCaptcha()) {
        $checkLogin = $this->dataBaseService->getDatasFromFile("account/checkLoginEmail.sql", array($data["login"], $data["email"]));
        // Проверить логин
        if (count($checkLogin) == 0) {
          // Регистрация пользователя
          if ($this->dataBaseService->executeFromFile("account/registerUser.sql", $sqlData)) {
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



  // Сведения о пользователе
  public function getUserApi(string $id): array
  {
    $code = "0000";
    $user = array();
    $users = array();

    // Проверка ID
    if (strlen($id) > 0) {
      $code = "9013";
      // Запрос данных о пользователе
      $user = $this->getUser($id);
      // Проверить авторизацию
      if ($user) {
        $code = "0001";
      }
    }
    // Получены пустые данные
    else {
      $code = "9030";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => "",
      "data" => $user
    );
  }

  // Сохранить данные
  public function saveUserDataApi(string $id, array $data): array
  {
    $code = "0000";

    // Проверка ID
    if (strlen($id) > 0) {
      $checkLogin = $this->dataBaseService->getDatasFromFile("account/checkEmail.sql", array($id, $data["email"]));
      // Проверить почту
      if (count($checkLogin) == 0) {
        // Данные
        $sqlData = array(
          $data["name"],
          $data["lastName"],
          $data["patronymic"],
          date("Y-m-d", strtotime($data["birthDate"])),
          $data["sex"],
          $data["email"],
          $id
        );
        // Сохранение данных
        if ($this->dataBaseService->executeFromFile("account/saveUserData.sql", $sqlData)) {
          $code = "0001";
        }
        // Регистрация неудалась
        else {
          $code = "9021";
        }
      }
      // Почта повторяется
      else {
        $code = "9012";
      }
    }
    // Получены пустые данные
    else {
      $code = "9030";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => "",
      "data" => array()
    );
  }

  // Загрузить аватарку
  public function uploadAvatarApi(string $id, array $data): array
  {
    $code = "0000";

    // Проверка ID
    if (strlen($id) > 0 && is_array($data["file"])) {
      // Успешное удаление аватарок
      if ($this->deleteUserAvatars($id)) {
        // Проверка размера файла
        if ($data["file"]["size"] <= $this->config["user"]["avaMaxSize"]) {
          $nameParse = explode(".", $data["file"]["name"]);
          $fileExt = end($nameParse);
          $file = $this->avatarDir . "/" . $this->avatarKeys[0] . "/" . $id . "." . $fileExt;
          // Файл успешно загружен
          if (move_uploaded_file($data["file"]["tmp_name"], $file)) {
            // Созданы дополнительные аватарки
            if ($this->createDefaultAvatars($id)) {
              $code = "0001";
            }
            // Дополнительные аватарки не созданы
            else {
              $code = "8013";
            }
          }
          // Ошибка загрузки файла
          else {
            $code = "8011";
          }
        }
        // Слишком большой файл
        else {
          $code = "8012";
        }
      }
      // Неудалось удалить аватарки
      else {
        $code = "8010";
      }
    }
    // Получены пустые данные
    else {
      $code = "9030";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => "",
      "data" => $data
    );
  }

  // Загрузить аватарку
  public function cropAvatarApi(string $id, array $data): array
  {
    $code = "0000";

    // Проверка ID и данных
    if (strlen($id) > 0 && isset($data["startX"]) && isset($data["startY"]) && isset($data["width"]) && isset($data["height"])) {
      // Проверка координат
      if ($data["startX"] >= 0 && $data["startY"] >= 0 && $data["width"] >= 0 && $data["height"] >= 0) {
        // Проверка типа
        if ($originalKey = $this->avatarKeysCrop[$data["type"]]) {
          // Определить расширение файла
          $fileExt = "";
          $originalFile = "";
          foreach ($this->avatarExts as $ext) {
            $file = $this->avatarDir . "/" . $originalKey . "/" . $id . "." . $ext;
            if (file_exists($file)) {
              $fileExt = $ext;
              $originalFile = $file;
              break;
            }
          }
          // Проверка файла
          if (file_exists($originalFile)) {
            $code = "8015";
            $file = $this->avatarDir . "/" . $data["type"] . "/" . $id . "." . $fileExt;
            // Копирование
            if (copy($originalFile, $file)) {
              $config = $this->config["user"]["avaSettings"][$data["type"]];
              $image = new Thumbs($file);
              $image->crop($data["startX"], $data["startY"], $data["width"], $data["height"]);
              // Для квадратных картинок
              if ($config["square"]) {
                $image->thumb($config["maxX"], $config["maxY"]);
              }
              // Для неквадратных картинок
              else {
                $image->reduce($config["maxX"], $config["maxY"]);
              }
              // Сохранить
              if ($image->save()) {
                // Сохранить координаты пользовательской обрезки аватарки
                $user = $this->getUser($id);
                $avatarCropData = $user["avatarCropData"];
                $avatarCropData[$data["type"]] = array(
                  "startX" => (int)$data["startX"],
                  "startY" => (int)$data["startY"],
                  "width" => (int)$data["width"],
                  "height" => (int)$data["height"],
                );
                // Пересчитать позицию миниатюры
                if ($data["type"] === $this->avatarKeys[1]) {
                  $config = $this->config["user"]["avaSettings"][$this->avatarKeys[2]];
                  $miniFile = $this->avatarDir . "/" . $this->avatarKeys[2] . "/" . $id . "." . $fileExt;
                  copy($file, $miniFile);
                  list($width, $height) = getimagesize($file);
                  $size = min($width, $height);
                  $image = new Thumbs($miniFile);
                  $image->crop(($width - $size) / 2, ($height - $size) / 2, $size, $size);
                  $image->resize($config["maxX"], $config["maxY"]);
                  $image->save();
                  // Данные для сохранения
                  $avatarCropData[$this->avatarKeys[2]] = array(
                    "startX" => ($width - $size) / 2,
                    "startY" => ($height - $size) / 2,
                    "width" => $size,
                    "height" => $size,
                  );
                }
                // Сделать миниатюру
                $config = $this->config["user"]["avaSettings"][$this->avatarKeys[3]];
                $miniFile = $this->avatarDir . "/" . $this->avatarKeys[3] . "/" . $id . "." . $fileExt;
                copy($file, $miniFile);
                $image = new Thumbs($miniFile);
                $image->resize($config["maxX"], $config["maxY"]);
                $image->save();
                // Сохранить массив в БД
                if ($this->dataBaseService->executeFromFile("account/saveAvatarCrop.sql", array(json_encode($avatarCropData), $id))) {
                  $code = "0001";
                }
              }
            }
          }
          // Файл не существует
          else {
            $code = "8014";
          }
        }
        // Получены пустые данные
        else {
          $code = "9030";
        }
      }
      // Получены пустые данные
      else {
        $code = "9030";
      }
    }
    // Получены пустые данные
    else {
      $code = "9030";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => "",
      "data" => $data
    );
  }

  // Удалить аватарки
  public function deleteAvatarApi(string $id): array
  {
    $code = "8010";

    // Проверка ID и данных
    if (strlen($id) > 0) {
      if ($this->deleteUserAvatars($id)) {
        $code = "0001";
      }
    }
    // Получены пустые данные
    else {
      $code = "9030";
    }

    // Вернуть массив
    return array(
      "code" => $code,
      "message" => "",
      "data" => array()
    );
  }



  // Данные о пользователе
  public function getUser($id)
  {
    // Запрос данных о пользователе
    $users = $this->dataBaseService->getDatasFromFile("account/getUser.sql", array($id));
    // Проверить авторизацию
    if (count($users) > 0) {
      if (strlen($users[0]["id"]) > 0) {
        // Данные пользователя
        return $this->getUserData($users[0]);
      }
    }
    // Пользователь не найден
    return null;
  }



  // Преобразовать данные
  private function getUserData(array $user): array
  {
    $avatars = array();
    foreach ($this->avatarKeys as $key) {
      $avatars[$key] = "";
    }

    // Проверить аватарки
    foreach ($this->avatarExts as $ext) {
      $file = $this->avatarDir . "/" . $this->avatarKeys[0] . "/" . $user["id"] . "." . $ext;
      if (file_exists($file)) {
        foreach ($this->avatarKeys as $key) {
          $tempFile = $this->avatarDir . "/" . $key . "/" . $user["id"] . "." . $ext;
          $avatars[$key] = $this->config["mediaDomain"] . $this->avatarUrl . "/" . $key . "/" . $user["id"] . "." . $ext . "?time=" . filemtime($tempFile);
        }
        break;
      }
    }

    // Данные об обрезке аватарки
    $user["avatar_crop_data"] = @json_decode($user["avatar_crop_data"]) ? json_decode($user["avatar_crop_data"], true) : array();
    foreach ($this->avatarKeysCrop as $value) {
      $user["avatar_crop_data"][$value] = isset($user["avatar_crop_data"][$value]) ? $user["avatar_crop_data"][$value] : array();
      $user["avatar_crop_data"][$value] = $this->checkUserAvatarCropDatas($user["avatar_crop_data"][$value]);
    }

    // Вернуть данные
    return array(
      "id" => $user["id"],
      "name" => $user["name"],
      "lastName" => $user["last_name"],
      "patronymic" => $user["patronymic"],
      "birthDate" => $user["birth_date"],
      "registerDate" => $user["register_date"],
      "sex" => $user["sex"],
      "email" => $user["email"],
      "roles" => json_decode($user["roles"]),
      "avatarCropData" => $user["avatar_crop_data"],
      "avatars" => $avatars
    );
  }

  // Преобразовать массив обрезки аватарки
  private function checkUserAvatarCropDatas($data): array
  {
    $data = is_array($data) ? $data : array();
    // Проверка вложенных данных
    foreach ($this->avatarKeysCropPos as $key) {
      $data[$key] = isset($data[$key]) ? $data[$key] : 0;
      $data[$key] = is_int($data[$key]) ? $data[$key] : 0;
      $data[$key] = $data[$key] < 0 ? 0 : $data[$key];
    }
    // Вернуть данные
    return $data;
  }

  // Удалить все аватарки
  private function deleteUserAvatars(string $id): bool
  {
    $delete = 0;
    // Удалить аватарки
    foreach ($this->avatarExts as $ext) {
      foreach ($this->avatarKeys as $key) {
        $file = $this->avatarDir . "/" . $key . "/" . $id . "." . $ext;
        if (file_exists($file)) {
          $delete++;
          if (@unlink($file)) {
            $delete--;
          }
        }
      }
    }
    // Неудалось удалить
    return $delete == 0;
  }

  // Установить аватарки по умолчанию
  private function createDefaultAvatars(string $id)
  {
    // Поиск оригинальной аватарки
    $originalFile = "";
    $previusFile = "";
    $fileExt = "";
    foreach ($this->avatarExts as $ext) {
      $file = $this->avatarDir . "/" . $this->avatarKeys[0] . "/" . $id . "." . $ext;
      if (file_exists($file)) {
        $fileExt = $ext;
        $originalFile = $file;
        $previusFile = $file;
        break;
      }
    }
    // Аватарка найдена
    if (strlen($originalFile) > 0) {
      $avas = count($this->avatarKeys);
      $avatars = array();
      // Цикл по типам аватарок
      foreach ($this->avatarKeys as $key) {
        $file = $this->avatarDir . "/" . $key . "/" . $id . "." . $fileExt;
        // Копировать файл
        $copy = $key == $this->avatarKeys[0] ? true : copy($previusFile, $file);
        // Обработка
        if ($copy) {
          // Параметры
          $config = $this->config["user"]["avaSettings"][$key];
          $image = new Thumbs($file);
          // Для квадратных картинок
          if ($config["square"]) {
            list($width, $height) = getimagesize($previusFile);
            $size = min($width, $height);
            $image->crop(($width - $size) / 2, ($height - $size) / 2, $size, $size);
            $image->resize($config["maxX"], $config["maxY"]);
          }
          // Для неквадратных картинок
          else {
            $image->reduce($config["maxX"], $config["maxY"]);
          }
          // Сохранить изменения
          $avatars[$key] = $file;
          $image->save();
          $avas--;
        }
        // Установить предыдущий файл
        $previusFile = $file;
      }
      // Сохранить новые координаты
      if ($avas === 0) {
        $avatarsCrop = array();
        foreach ($this->avatarKeysCrop as $cropKey => $cropValue) {
          $config = $this->config["user"]["avaSettings"][$cropKey];
          $avatarsCrop[$cropKey] = $this->checkUserAvatarCropDatas(array());
          list($width, $height) = getimagesize($avatars[$cropValue]);
          // Данные с приведением к квадрату
          if ($config["square"]) {
            $avatarsCrop[$cropKey][$this->avatarKeysCropPos[0]] = ($width - min($width, $height)) / 2;
            $avatarsCrop[$cropKey][$this->avatarKeysCropPos[1]] = min($width, $height);
            $avatarsCrop[$cropKey][$this->avatarKeysCropPos[2]] = ($height - min($width, $height)) / 2;
            $avatarsCrop[$cropKey][$this->avatarKeysCropPos[3]] = min($width, $height);
          }
          // Данные без приведения к квадрату
          else {
            $avatarsCrop[$cropKey][$this->avatarKeysCropPos[0]] = 0;
            $avatarsCrop[$cropKey][$this->avatarKeysCropPos[1]] = $width;
            $avatarsCrop[$cropKey][$this->avatarKeysCropPos[2]] = 0;
            $avatarsCrop[$cropKey][$this->avatarKeysCropPos[3]] = $height;
          }
        }
        // Сохранить массив в БД
        if ($this->dataBaseService->executeFromFile("account/saveAvatarCrop.sql", array(json_encode($avatarsCrop), $id))) {
          return true;
        }
      }
    }
    // Неудалось создать набор аватарок
    return false;
  }
}
