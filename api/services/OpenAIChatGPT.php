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
      'models' => array('https://api.openai.com/v1/models', false),
      'dream' => array('https://api.openai.com/v1/chat/completions', true)
    );
  }



  // Список доступных моделей\
  public function getModelsInfo(): array|null
  {
    [$url, $isPost] = $this->gptUrls['models'];
    return $this->gptRequest($url, $isPost);
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
        (!!$dreamTitle ? 'Название: ' . $dreamTitle . "\n" : '') .
        (!!$dreamDate ? 'Дата: ' . $dreamDate . "\n" : '') .
        (!!$dreamType ? 'Тип: ' . $dreamType . "\n" : '') .
        (!!$dreamMood ? 'Настроение: ' . $dreamMood . "\n" : '') .
        'Текст: ' . strip_tags($dreamText) .
        '';
      // Параметры запроса
      [$url, $isPost] = $this->gptUrls['dream'];
      $body = array(
        'model' => 'gpt-3.5-turbo',
        'temperature' => 0.8,
        'max_tokens' => 2048,
        'messages' => array(
          array('role' => 'system', 'content' => 'Тебе надо дать толкование сновидения по описанию'),
          array('role' => 'user', 'content' => $text),
        )
      );
      $data = $this->gptRequest($url, $isPost, $body);
      // Вернуть данные
      if (!!$data) {
        return strval($data['choices'][0]['message']['content'] ?? '');;
      }
    }
    // Не удалось интерпретировать
    return '';
  }



  // Запрос к GPT
  private function gptRequest(string $url, bool $isPost = false, array $body = array()): array|null
  {
    if (!!$url && !!$this->secretToken) {
      $ch = curl_init();
      // Настройки запроса
      curl_setopt($ch, CURLOPT_URL, $url);
      curl_setopt($ch, CURLOPT_POST, $isPost ? 1 : 0);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json',
        'Authorization: Bearer ' . $this->secretToken
      ));
      // Данные
      if (!!$body) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
      }
      // Выполнить запрос
      $response = curl_exec($ch);
      // Закрытие cURL-сессии
      curl_close($ch);
      // Обработка данных
      if (!!$response) {
        return json_decode($response, true);
      }
    }
    // Ошибка запроса
    return null;
  }
}
