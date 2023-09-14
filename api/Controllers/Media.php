<?

namespace Controllers;

use Decorators\CheckToken;
use Decorators\Request;
use PDO;
use Services\MediaService;



class Media
{
  private $config;
  private PDO $pdo;

  private MediaService $mediaService;



  // Получить настройки приложения
  public function setConfig(array $config): void
  {
    $this->config = $config;
  }

  // Получить настройки БД
  public function setDbContext(PDO $pdo): void
  {
    $this->pdo = $pdo;
  }

  // Запуск сервисов
  public function setServices(): void
  {
    $this->mediaService = new MediaService($this->pdo, $this->config);
  }



  // Загрузка нового медиафайла
  #[Request('post'), CheckToken]
  public function upload($data): array
  {
    $code = '4001';
    $file = $_FILES['file'];
    $media = array();
    // Файл передан
    if (!!$file) {
      $mediaId = $this->mediaService->createFromUpload($file);
      // Медиа файл загружен
      if ($mediaId > 0) {
        $media = $this->mediaService->getById($mediaId);
        // Медиа файл получен
        if (isset($media['id']) && $media['id'] > 0) {
          $code = '0001';
        }
        // Ошибка загрузки медиа файла
        else {
          $code = '4003';
        }
      }
    }
    // Ошибка передачи файла
    else {
      $code = '4002';
    }
    // Вернуть результат
    return array(
      'code' => $code,
      'data' => $media
    );
  }
}



return new Media();
