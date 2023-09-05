<?

namespace Models;



class File
{
  private string $file = "";


  public function __construct(string $file)
  {
    $this->file = $this->setAbsoluteDir($file);
  }



  // Корректировка пути
  private function setAbsoluteDir(string $file): string {
    $file = $_SERVER['DOCUMENT_ROOT'] . '/' . $file;
    $file = preg_replace('/([\/\\\]+)/i', '/', $file);
    // Вернуть файл
    return $file;
  }



  // Полный путь к файлу
  public function absoluteDir(): string {
    return $this->file;
  }

  // Проверка файла
  public function exists(): bool {
    return file_exists($this->file);
  }

  // Расширение файла
  public function extension(): string {
    return pathinfo($this->file, PATHINFO_EXTENSION);
  }

  // Содержимое файла
  public function content(): string {
    return file_get_contents($this->file);
  }



  // Выполнить код из файла
  public function eval($input = null): string
  {
    $content = "";
    // Выполнение файла
    if($this->exists()){
        $tempEcho = ob_get_contents();
        ob_end_clean();
        ob_start();
        include $this->file;
        $content = ob_get_contents();
        ob_end_clean();
        ob_start();
        echo $tempEcho;
    }
    // Файл не существует
    return $content;
  }
}