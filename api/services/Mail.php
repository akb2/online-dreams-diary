<?

namespace Services;



class MailService
{
  private array $config;

  private string $senderMail;
  private string $templateDir;
  private array $headers;

  public function __construct(array $config)
  {
    $this->config = $config;
    // Определить переменные
    $this->senderMail = $this->config['mail']['sender'] ? $this->config['mail']['sender'] : $this->senderMail;
    $this->templateDir = $this->config['mail']['templateDir'] ? $this->config['mail']['templateDir'] : $this->templateDir;
    // Конфигурирование
    $this->headers = array(
      'From' => $this->senderMail,
      'X-Mailer' => 'PHP/' . phpversion()
    );
  }



  // Отправка письма
  public function send(string $template, string $receiver, string $title, array $params = array()): bool
  {
    if (strlen($receiver) > 0 && strlen($title) > 0) {
      if (preg_match('/$[0-9a-z\-_\.]+@[0-9a-z\-_\.]+^/i', $receiver)) {
        $templatePath = $this->templateDir . $template . '.html';
        // Проверить шаблон
        if (file_exists($templatePath)) {
          $content = file_get_contents($templatePath);
          preg_match('/\{\{([A-z0-9\-_]{1,32})\}\}/gm', $content, $keys);
          // Поиск и замена переменных в шаблоне
          // if (count($keys) > 0) {
          //   foreach ($keys as  $keys) {
          //     $key = $keys[1];
          //     // Поиск вхождения
          //     if (preg_match('/\{\{' . $key . '\}\}/gm', $content) && isset($params[$key])) {
          //       $content = preg_replace('/\{\{' . $key . '\}\}/gm', $params[$key], $content);
          //     }
          //   }
          // }
          // Отправка письма
          if (strlen($content) > 0) {
            return mail(
              $receiver,
              $title,
              $content,
              $this->headers
            );
          }
        }
      }
    }
    // Не удалось отправить письмо
    return false;
  }
}
