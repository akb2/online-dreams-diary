<?

namespace Models;



// Основной класс данных
abstract class User
{
  public int $id;
  public string $login;
  public string $name;
  public string $lastName;
  public string $birthDate;
  public int $sex;
  public string $email;
}
