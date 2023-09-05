<?

namespace Services;



class UserAgentService
{
  // Получить IP пользователя
  public function getIp(): string
  {
    $ip = "";
    $isLocalHost = ["::1"];
    //
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
      $ip = $_SERVER['HTTP_CLIENT_IP'];
    }
    //
    elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
      $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    }
    //
    else {
      $ip = $_SERVER['REMOTE_ADDR'];
    }
    // Вернуть IP
    return in_array($ip, $isLocalHost) ? "127.0.0.1" : $ip;
  }

  // Получить UserAgent
  public function getUserAgent()
  {
    $browser = get_browser(null, true);
    // Вернуть данные
    return $browser ?? array(
      "platform" => null,
      "browser" => null,
      "version" => null,
    );
  }
}
