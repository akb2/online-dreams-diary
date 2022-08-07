<?
  $count = 616;
  // См. в account/createAdmin.phpS
  $maxUserId = 128;
  $loremCount = 10;

  $statuses = array(0, 1, 4, 5);
  $titles = array(
    'Проулки', 'Встреча с мамой', 'Крест из кафельной плитки', 'Бешеный малой', 'Второй раз в школу',
    'Я железный человек', 'Лишняя', 'Даня народ собирать решил', 'И снова меня укусил паук', 'Странная GTA',
    'Метро 2033. Начало', 'Жертвенные овечки', 'Очередной забытый сон', 'СтиШок', 'Первый "лазутчик"',
    'Свитч', 'Целое путешествие по городу', 'Мир Фантазии', 'Переезд', 'Ангельские переживания',
  );
  $descriptions = array();
  $texts = array();

  // Заполнить описания
  for($k = 0; $k < $loremCount; $k++) {
    $descriptions[$k] = file_get_contents('https://loripsum.net/api/1/short/plaintext');
    $texts[$k] = file_get_contents('https://loripsum.net/api/10/long/headers/ul/ol/bq/dl/decorate');
  }

  // Случайный элемент из массива
  function getRandomElmD(array $array) {
    return $array[array_rand($array, 1)];
  }

  // Случайное булево
  function getRandBoolD(): bool {
    return rand(0, 1) === 1;
  }

  // Годы в секундах
  function yearsToSecs(int $year): int {
    return 60 * 60 * 24 * 365 * $year;
  }

  // Заполнить сновидения
  for($k = 1; $k < $count; $k++) {
    $mode = rand(0, 2);
    // Данные сновидения
    $dreams[$k] = array(
      'user_id' => rand(1, $maxUserId),
      'mode' => $mode,
      'status' => getRandomElmD($statuses),
      'date' => date('Y-m-d', rand(date('U') - yearsToSecs(4), date('U'))),
      'title' => getRandomElmD($titles),
      'description' => getRandBoolD()? getRandomElmD($descriptions): '',
      'keywords' => getRandBoolD()? implode(',', explode(' ', getRandomElmD($descriptions))): "",
      'text' => $mode === 1 && !getRandBoolD()? '': getRandomElmD($texts),
      'places' => array(),
      'members' => array(),
      'header_type' => getRandomElmD(array('full', 'short', 'collapse')),
      'header_background' => rand(1, 12),
    );
  }
?>

<? foreach($dreams as $dream): ?>
  INSERT INTO `dreams`
    (
      <? $i = 0; ?>
      <? foreach($dream as $k => $v): ?>
        <? if($i > 0): ?>, <? endif; ?>
        `<?=$k;?>`
        <? $i++; ?>
      <? endforeach; ?>
    )
    VALUES (
      <? $i = 0; ?>
      <? foreach($dream as $k => $v): ?>
        <? if($i > 0): ?>, <? endif; ?>

        <? if(gettype($v) === 'integer' || gettype($v) === 'double'): ?> <?=$v;?>
        <? elseif(gettype($v) === 'array' || gettype($v) === 'object'): ?> "<?=addslashes(json_encode($v));?>"
        <? else: ?> "<?=addslashes(strval($v));?>"
        <? endif; ?>

        <? $i++; ?>
      <? endforeach; ?>
    );
<? endforeach; ?>