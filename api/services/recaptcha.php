<?

namespace OnlineDreamsDiary\Services;



class ReCaptchaService
{
  private string $url = "https://www.google.com/recaptcha/api/siteverify?secret=";
  private string $captcha;
  private array $config;

  function __construct(string $captcha, array $config)
  {
    $this->captcha = $captcha;
    $this->config = $config;
  }



  // Получить URL для проверки
  public function checkCaptcha(): bool
  {
    $url = $this->url . urlencode($this->config["reCaptchaPassword"]["secret"]) . "&response=" . urlencode($this->captcha);
    $response = file_get_contents($url);
    $responseKeys = json_decode($response, true);
    // Капча пройдена
    if ($responseKeys["success"]) {
      return true;
    }
    // Код неверный
    return false;
  }
}
