<?
// Загрузить настройки
function getSettings(): array
{
  $src = '../Config/settings.json';
  // Проверить настройки
  if (file_exists($src)) {
    $fileData = file_get_contents($src);
    $jsonData = json_decode($fileData, true);
    if (count($jsonData) > 0) {
      return $jsonData;
    }
  }
  // Вернуть пустой массив
  return array();
}

$mediaConfig = getSettings();
$originalDirectory = getcwd();
$originalDocumentRoot = $_SERVER['DOCUMENT_ROOT'];
$_SERVER['DOCUMENT_ROOT'] = realpath($mediaConfig['apiPath']);
chdir($mediaConfig['apiPath']);

// Настройки автолоудинга
spl_autoload_register(function ($name) {
  $name = preg_replace('/^(.*?)(Service)$/i', '$1', $name);
  $file = $name . '.php';
  $file = preg_replace('/([\/\\\]+)/i', '/', $file);
  // Подключить файл
  if (file_exists($file)) {
    include_once $file;
  }
});

use Services\App;
use Services\MediaService;



// Настройки приложения
$app = new App();
$appConfig = $app->getSecretDatas();
$pdo = $app->dbConnect();
$mediaService = new MediaService($pdo, $appConfig);

// Данные
$sizes = array('small', 'middle', 'large', 'original');
$mixedUrl = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
[$mediaId, $accessHash, $size] = $mixedUrl;
$media = $mediaService->getById($mediaId);



// Вернуть файл
if (isset($media['id']) && isset($media['accessHash']) && $media['id'] === intval($mediaId) && $media['accessHash'] === $accessHash && in_array($size, $sizes, true)) {
  $fileSrc = realpath($mediaService->getMediaFileSrc($media['hash'], $media['extension'], $size));
  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $mimeType = $finfo->file($fileSrc);
  $fileSize = filesize($fileSrc);
  $fileName = basename($fileSrc);
  $maxAgeByHours = 5;
  $maxAgeBySeconds = $maxAgeByHours * 3600;
  // Отправка заголовков
  header('Content-Type: ' . $mimeType);
  header('Content-Length: ' . $fileSize);
  header('Content-Disposition: inline; filename="' . $fileName . '"');
  header('Cache-Control: private, max-age=' . $maxAgeBySeconds . ', pre-check=' . $maxAgeBySeconds);
  header('Pragma: private');
  header('Expires: ' . date(DATE_RFC822, strtotime(' ' . $maxAgeByHours . ' hour')));
  // Вывод содержимого файла
  readfile($fileSrc);
  // Выход
  exit;
}

// Ошибка 403
else {
  header('HTTP/1.1 403 Forbidden');
  // Выход
  exit;
}
