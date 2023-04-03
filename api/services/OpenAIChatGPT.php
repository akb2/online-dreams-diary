<?

namespace Services;



class OpenAIChatGPTService
{
  private array $config;

  private string $secretToken;
  private array $gptUrls;

  public function __construct(array $config)
  {
    $this->config = $config;
    // Параметры
    $this->secretToken = $this->config['chatGpt']['sectretToken'];
    $this->gptUrls = array(
      'dream' => 'https://api.openai.com/v1/completions'
    );
  }



  // Запрос интерпритации сновидения
  public function dreamInterpretate(array $dream): string
  {
    if (!!$dream && !!$dream['text']) {
      $dreamTypes = array(
        'Обычное сновидение',
        'Сплошная болтовня',
        'Полнейший бред',
        'Эпичное',
        'Осознанное сновидение'
      );
      $dreamMoods = array(
        'Филосовское',
        'Веселое',
        'Обычное',
        'Грустное',
        'Мрачное',
        'Страх'
      );
      // Данные сновидения
      $dreamTitle = $dream['title'] ?? '';
      $dreamDescription = $dream['description'] ?? '';
      $dreamKeywords = $dream['keywords'] ?? '';
      $dreamDate = date('Y-m-d\TH:i:s\Z', strtotime($dream['date']));
      $dreamType = $dreamTypes[$dream['type']];
      $dreamMood = $dreamMoods[$dream['mood']];
      $dreamText = $dream['text'];
      // Текст для интерпритации
      $text =
        'Интерпретируй пожалуйста мое сновидение' . "\n" .
        (!!$dreamTitle ? 'Название: ' . $dreamTitle . "\n" : '') .
        (!!$dreamDescription ? 'Краткое описание: ' . $dreamDescription . "\n" : '') .
        (!!$dreamKeywords ? 'Ключевые слова: ' . $dreamKeywords . "\n" : '') .
        (!!$dreamDate ? 'Когда приснился: ' . $dreamDate . "\n" : '') .
        (!!$dreamType ? 'Тип сновидения: ' . $dreamType . "\n" : '') .
        (!!$dreamMood ? 'Настроение в сновидении: ' . $dreamMood . "\n" : '') .
        'Полное описание: ' . strip_tags($dreamText) .
        '';
      // Параметры запроса
      $url = $this->gptUrls['dream'];
      $body = array(
        "model" => "text-davinci-003",
        'prompt' => $text,
        'max_tokens' => 1024,
        'temperature' => 0.5,
        'stream' => false,
        'stop' => '###'
      );
      $data = $this->gptRequest($url, $body);
      // Вернуть данные
      if (!!$data) {
        return $data;
      }
    }
    // Не удалось интерпретировать
    return '';
  }



  // Запрос к GPT
  private function gptRequest($url, $body)
  {
    if (!!$url && !!$body && !!$this->secretToken) {
      $ch = curl_init();
      // Настройки запроса
      curl_setopt($ch, CURLOPT_URL, $url);
      curl_setopt($ch, CURLOPT_POST, 1);
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json',
        'Authorization: Bearer ' . $this->secretToken
      ));
      // Выполнить запрос
      $response = curl_exec($ch);
      // Закрытие cURL-сессии
      curl_close($ch);
      // Обработка данных
      if (!!$response) {
        $data = json_decode($response, true);
        $data = strval($data['choices'][0]['text'] ?? '');
        // Вернуть ответ
        return $data;
      }
    }
    // Ошибка запроса
    return null;
  }
}
