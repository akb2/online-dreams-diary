<?

namespace Services;

use PDO;



class MediaService
{
  private PDO $pdo;
  private array $config;

  private DataBaseService $dataBaseService;

  private string $imagesPath;
  private string $otherPath;

  private int $imagesMaxSize;
  private int $otherMaxSize;

  private array $allExtensions;
  private string $mediaDomain;
  private string $mediaPath;

  public function __construct(PDO $pdo, array $config)
  {
    $this->pdo = $pdo;
    $this->config = $config;
    // Подключить сервисы
    $this->dataBaseService = new DataBaseService($this->pdo);
    // Пути к файлам
    $this->imagesPath = strval($this->config['media']['path']['images']);
    $this->otherPath = strval($this->config['media']['path']['other']);
    // Размеры файлов
    $this->imagesMaxSize = intval($this->config['media']['sizes']['images']);
    $this->otherMaxSize = intval($this->config['media']['sizes']['other']);
    // Прочее
    $this->allExtensions = $this->config['media']['extensions'];
    $this->mediaDomain = $this->config['mediaDomain'];
    $this->mediaPath = $this->config['mediaPath'];
  }



  // Создать медиа из загружаемого файла
  public function createFromUpload(array $file, string $keywords = '', $description = ''): int
  {
    $userId = intval($_SERVER['TOKEN_USER_ID']);
    // Только для авторизованных пользователей
    if ($userId > 0) {
      // Передан массив данных о файле
      if (!!$file) {
        // Проверка размера файла
        if ($file['size'] <= $this->imagesMaxSize) {
          $nameParse = explode('.', $file['name']);
          $fileExt = end($nameParse);
          $fileHash = $this->getFileHash($file['tmp_name']);
          // Удалось вычислить хэш файла
          if (!!$fileHash) {
            $fileSrc = $this->getMediaFileSrc($fileHash, $fileExt);
            $needCreate = !file_exists($fileSrc);
            $successReplace = false;
            // Файл уже существует
            if ($needCreate) {
              $successReplace = move_uploaded_file($file['tmp_name'], $fileSrc);
            }
            // Создать новую запись в базе данных
            if ($needCreate && $successReplace) {
              $sqlData = array(
                'user_id' => $userId,
                'hash' => $fileHash,
                'size' => $file['size'],
                'extension' => $fileExt,
                'original_name' => $file['name'],
                'keywords' => $keywords,
                'description' => $description
              );
              // Сохранение информации в базу данных
              if ($this->dataBaseService->executeFromFile('media/create.sql', $sqlData)) {
                return $this->pdo->lastInsertId();
              }
            }
            // Загрузить существующий файл
            else if (!$needCreate) {
              $tempData = $this->getByHash($fileHash, $fileExt);
              // Вернуть ID
              return $tempData['id'] ?? 0;
            }
          }
        }
      }
    }
    // Медиафайл не сохранен
    return 0;
  }



  // Получить медиа файл по ID
  public function getById(int $id): array|null
  {
    if ($id > 0) {
      $testMedia = $this->dataBaseService->getDatasFromFile('media/getById.sql', array($id));
      // Запись найдена
      if (is_array($testMedia) && count($testMedia) > 0) {
        $testMedia = $testMedia[0];
        // Обработка файла
        return $this->convertMediaData($testMedia);
      }
    }
    // Запись не найдена
    return null;
  }

  // Получить медиа файл по хэшу
  public function getByHash(string $hash, string $ext): array|null
  {
    if (strlen($hash) > 0) {
      $testMedia = $this->dataBaseService->getDatasFromFile('media/getByHash.sql', array($hash, $ext));
      // Запись найдена
      if (is_array($testMedia) && count($testMedia) > 0) {
        $testMedia = $testMedia[0];
        // Обработка файла
        return $this->convertMediaData($testMedia);
      }
    }
    // Запись не найдена
    return null;
  }



  // Получения хэша файла
  public function getFileHash(string $fileSrc): string
  {
    if (file_exists($fileSrc)) {
      if (is_file($fileSrc)) {
        return hash_file('sha512', $fileSrc);
      }
    }
  }

  // Генерация хэша доступа
  public function getAccessHash(array $media): string
  {
    $del = '___';
    $fileString = $media['id'] . $del . $media['hash'] . $del . $media['size'] . $del . $media['create_date'];
    $userString = $_SERVER['REMOTE_ADDR'] . $del . $_SERVER['HTTP_USER_AGENT'] . $del . $_SERVER['HTTP_ACCEPT_LANGUAGE'] . $del . $_SERVER['HTTP_ACCEPT_ENCODING'];
    $originalString = $this->config['media']['secret'] . $del . $fileString . $del . $userString;
    // Вернуть хэш
    return hash('sha512', $originalString);
  }

  // Получить конечный путь к файлу
  public function getMediaFileSrc(string $hash, string $ext, string $size = 'original'): string
  {
    $path = "";
    // Картинки
    if ($this->allExtensions[$ext] === 'images') {
      $path = $this->imagesPath;
    }
    // Остальные файлы
    else {
      $path = $this->otherPath;
    }
    // Вернуть конечный путь к файлу
    return $path . $hash . '.' . $ext;
  }

  // Конвертация данных
  private function convertMediaData(array $media): array|null
  {
    if (is_array($media) && count($media) > 0) {
      $fileSrc = $this->getMediaFileSrc($media['hash'], $media['extension']);
      // Файл найден
      if (file_exists($fileSrc) &&  is_file($fileSrc)) {
        $accessHash = $this->getAccessHash($media);
        $fileUrl = $this->mediaDomain . '/' . $media['id'] . '/' . $accessHash;
        // Вернуть массив
        return array(
          'id' => intval($media['id']),
          'createDate' => $media['create_date'],
          'userId' => intval($media['user_id']),
          'hash' => $media['hash'],
          'size' => intval($media['size']),
          'extension' => strval($media['extension']),
          'originalName' => intval($media['original_name']),
          'keywords' => explode(',', $media['keywords']),
          'description' => $media['description'],
          'url' => $fileUrl,
          'accessHash' => $accessHash
        );
      }
    }
    // Ничего не найдено
    return null;
  }
}
