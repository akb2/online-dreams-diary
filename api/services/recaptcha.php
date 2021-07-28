<?

namespace OnlineDreamsDiary\Services;



class ReCaptchaService
{
  private string $secretCode = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";
  private string $url = "https://www.google.com/recaptcha/api/siteverify?secret=";
  private string $captcha;

  function __construct(string $captcha)
  {
    $this->captcha = $captcha;
  }



  // Получить URL для проверки
  public function checkCaptcha(): bool
  {
    $url = $this->url . urlencode($this->secretCode) . "&response=" . urlencode($this->captcha);
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
