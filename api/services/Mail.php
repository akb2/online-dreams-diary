<?

namespace Services;



class MailService
{
  private array $config;

  private array $headers;

  public function __construct(array $config)
  {
    $this->config = $config;
    // Конфигурирование
    $this->headers = array(
      'From' => "Online Dreams Diary <" . $this->config['mail']['sender'] . ">",
      'Return-Path' => $this->config['mail']['sender'],
      'Content-type' => 'text/html; charset=utf-8',
      'X-Mailer' => 'PHP/' . phpversion()
    );
  }



  // Отправка письма
  public function send(string $template, string $receiver, string $title, array $params = array()): bool
  {
    if (strlen($receiver) > 0 && strlen($title) > 0) {
      if (preg_match('/^[0-9a-z\-_\.]+@[0-9a-z\-_\.]+$/i', $receiver)) {
        $content = $this->getTemplate($template, $params);
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
    // Не удалось отправить письмо
    return false;
  }



  // Заменить в шаблоне переменные
  private function getTemplate(string $template, array $params): string
  {
    $templatePath = $this->config['mail']['templateDir'] . $template . '.html';
    // Todo: удалить сохранение обработанного письма
    $templateTempPath = $this->config['mail']['templateDir'] . $template . '.test.html';
    // Проверка пути шаблона
    if (file_exists($templatePath)) {
      $content = file_get_contents($templatePath);
      // Поиск переменных в шаблоне
      preg_match_all('/\{\{([A-z0-9\-_]{1,32})\}\}/m', $content, $keys);
      // Замена переменных в шаблоне
      if (isset($keys[1]) && count($keys[1]) > 0) {
        foreach ($keys[1] as $key) {
          if (preg_match('/\{\{' . $key . '\}\}/m', $content) && isset($params[$key])) {
            $content = preg_replace('/\{\{' . $key . '\}\}/m', $params[$key], $content);
          }
        }
      }
      // Todo: удалить сохранение обработанного письма
      file_put_contents($templateTempPath, $content);
      // Вернуть текст шаблона
      return $content;
    }
    // Пустое письмо
    return "";
  }
}
