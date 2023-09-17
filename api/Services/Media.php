<?

namespace Services;

use PDO;
use Libs\Thumbs;



class MediaService
{
  private PDO $pdo;
  private array $config;

  private DataBaseService $dataBaseService;

  private string $imagesPathOriginal;
  private string $imagesPathLarge;
  private string $imagesPathMiddle;
  private string $imagesPathSmall;
  private string $otherPath;

  private array $imagesLargeSize;
  private array $imagesMiddleSize;
  private array $imagesSmallSize;

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
    $this->imagesPathOriginal = strval($this->config['media']['path']['images']['original']);
    $this->imagesPathLarge = strval($this->config['media']['path']['images']['large']);
    $this->imagesPathMiddle = strval($this->config['media']['path']['images']['middle']);
    $this->imagesPathSmall = strval($this->config['media']['path']['images']['small']);
    $this->otherPath = strval($this->config['media']['path']['other']);
    $this->imagesLargeSize = $this->config['media']['imagesResolutions']['large'];
    $this->imagesMiddleSize = $this->config['media']['imagesResolutions']['middle'];
    $this->imagesSmallSize = $this->config['media']['imagesResolutions']['small'];
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
            $fileSrc = $this->getMediaFileSrc($fileHash, $fileExt, 'original');
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



  // Получить новые размеры картинки
  private function getNewImageResolution(string $fileSrc, string $size): array
  {
    list($originalWidth, $originalHeight) = getimagesize($fileSrc);
    // Размеры
    $resolutions = array(
      'large' => $this->imagesLargeSize,
      'middle' => $this->imagesMiddleSize,
      'small' => $this->imagesSmallSize
    );
    // Определение преобразования
    if (isset($resolutions[$size])) {
      ['width' => $maxWidth, 'height' => $maxHeight] = $resolutions[$size];
      // Изображение должно быть больше максимальных размеров
      if ($originalWidth > $maxWidth || $originalHeight > $maxHeight) {
        $originalAspectRatio = $originalWidth / $originalHeight;
        $maxAspectRatio = $maxWidth / $maxHeight;
        $newWidth = $maxWidth;
        $newHeight = $maxHeight;
        // Ограничить по ширине
        if ($originalAspectRatio > $maxAspectRatio) {
          $newHeight = $newWidth / $originalAspectRatio;
        }
        // Ограничить по высоте
        else {
          $newWidth = $newHeight * $originalAspectRatio;
        }
        // Вернуть новые размеры
        return array(
          'width' => round($newWidth),
          'height' => round($newHeight)
        );
      }
    }
    // Вернуть оригинальное разрешение
    return array(
      'width' => $originalWidth,
      'height' => $originalHeight
    );
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
      $pathes = array(
        "original" => $this->imagesPathOriginal,
        "large" => $this->imagesPathLarge,
        "middle" => $this->imagesPathMiddle,
        "small" => $this->imagesPathSmall,
      );
      $path = $pathes[$size];
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
      $fileSrcOriginal = $this->getMediaFileSrc($media['hash'], $media['extension'], 'original');
      $fileSrcLarge = $this->getMediaFileSrc($media['hash'], $media['extension'], 'large');
      $fileSrcMiddle = $this->getMediaFileSrc($media['hash'], $media['extension'], 'middle');
      $fileSrcSmall = $this->getMediaFileSrc($media['hash'], $media['extension'], 'small');
      // Файл найден
      if (file_exists($fileSrcOriginal) &&  is_file($fileSrcOriginal)) {
        $accessHash = $this->getAccessHash($media);
        $fileUrlOriginal = $this->mediaDomain . '/' . $media['id'] . '/' . $accessHash . '/original';
        $fileUrlLarge = $this->mediaDomain . '/' . $media['id'] . '/' . $accessHash . '/large';
        $fileUrlMiddle = $this->mediaDomain . '/' . $media['id'] . '/' . $accessHash . '/middle';
        $fileUrlSmall = $this->mediaDomain . '/' . $media['id'] . '/' . $accessHash . '/small';
        $resizeArray = array(
          'large' => $fileSrcLarge,
          'middle' => $fileSrcMiddle,
          'small' => $fileSrcSmall,
        );
        // Создать большую картинку
        foreach ($resizeArray as $size => $src) {
          if (!(file_exists($src) && is_file($src))) {
            ['width' => $width, 'height' => $height] = $this->getNewImageResolution($fileSrcOriginal, $size);
            // Копировать файл
            copy($fileSrcOriginal, $src);
            // Изменить размер
            $image = new Thumbs($src);
            $image->resize($width, $height);
            $image->save();
          }
        }
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
          'url' => $fileUrlOriginal,
          'urlLarge' => $fileUrlLarge,
          'urlMiddle' => $fileUrlMiddle,
          'urlSmall' => $fileUrlSmall,
          'accessHash' => $accessHash
        );
      }
    }
    // Ничего не найдено
    return null;
  }
}
