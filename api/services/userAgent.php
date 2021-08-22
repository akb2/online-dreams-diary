<?

namespace OnlineDreamsDiary\Services;



class UserAgentService
{
  // Получить IP пользователя
  public function getIp(): string
  {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
      return $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
      return $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
      return $_SERVER['REMOTE_ADDR'];
    }
  }

  // Получить UserAgent
  public function getUserAgent(): array
  {
    $browser = get_browser(null, true);
    // Вернуть данные
    return $browser ? $browser : array(
      "platform" => null,
      "browser" => null,
      "version" => null,
    );
  }
}
