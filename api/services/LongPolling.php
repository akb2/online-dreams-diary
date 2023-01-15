<?

namespace Services;



class LongPollingService
{
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
}
