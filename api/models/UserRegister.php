<?

namespace Models;



// Интерфейс данных для регистрации
interface UserRegister
{
  public string $login;
  public string $password;
  public string $name;
  public string $lastName;
  public string $birthDate;
  public int $sex;
  public string $email;
  public string $captcha;
}