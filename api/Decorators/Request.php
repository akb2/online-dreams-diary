<?

namespace Decorators;

use Attribute;



#[Attribute(Attribute::IS_REPEATABLE | Attribute::TARGET_METHOD)]
class Request
{
  private string $requestType;



  public function __construct(string $requestType)
  {
    $this->requestType = strtolower($requestType);
  }



  // Преобразование
  public function execute(array $data): array|true
  {
    return strtolower($_SERVER['REQUEST_METHOD']) === $this->requestType ? true : array(
      'code' => '1001'
    );
  }
}
