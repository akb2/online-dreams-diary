<?

namespace Models;



// Основной класс сновидения
interface Dream
{
  public int $id;
  public int $userId;
  public string $createDate;
  public string $date;
  public string $title;
  public string $description;
  public string $keywords;
  public string $text;
  public string $places;
  public string $members;
  public string $map;
  public int $mode;
  public int $status;
  public string $headerType;
  public int $headerBackgroundId;
}
