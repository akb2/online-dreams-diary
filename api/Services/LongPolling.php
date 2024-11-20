<?

namespace Services;

use Exception;

class LongPollingService
{
  private array $config;

  public function __construct(array $config)
  {
    $this->config = $config;
  }



  // Получить URL
  private function getUrl(string $path, string $type): string
  {
    return $this->config['longPollingDomain'] .  $type . '/' . $path;
  }



  // Новый процесс
  public function run(int $wait = 10, int $limit = 5, $inData, $callback)
  {
    $getNext = true;
    $i = 0;
    // Цикл запросов
    while ($getNext) {
      if (connection_status() == 0) {
        $data = $callback($inData);
        // Данные обнаружены
        if (!!$data) {
          return $data;
        }
        // Продолжить работу
        else {
          $i++;
          // Остановка
          $getNext = $i < $limit && connection_status() == 0;
          // Ожидание
          if ($getNext) {
            sleep($wait);
          }
        }
      }
      // Остановить процесс
      else {
        die;
      }
    }
    // Отработало без результата
    return null;
  }

  // Отправить данные
  public function send(string $path, mixed $data)
  {
    $curl = curl_init();
    // Настройки CURL
    curl_setopt($curl, CURLOPT_VERBOSE, 1);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_URL, $this->getUrl($path, 'push'));
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_exec($curl);
  }

  // Получить данные
  public function get(string $path): mixed
  {
    $data = null;
    $curl = curl_init();
    // Настройки CURL
    curl_setopt($curl, CURLOPT_URL, $this->getUrl($path, 'get'));
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($curl);
    // Расшифровка
    try {
      $data = json_decode($result, true);
    }
    // Без расшифровки
    catch (Exception $e) {
      $data = array('text' => $result);
    }
    // Расшифровка ответа
    parse_str(strval($data['text']), $output);
    // Вернуть ответ
    return $output;
  }
}
