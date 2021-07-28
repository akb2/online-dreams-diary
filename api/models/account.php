<?

namespace OnlineDreamsDiary\Models;



// Основной класс данных
interface User
{
  public int $id;
  public string $login;
  public string $name;
  public string $lastName;
  public string $birthDate;
  public int $sex;
  public string $email;
}

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
