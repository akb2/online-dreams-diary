<?
  $count = 128;

  $firstNames = array(
    array('Андрей', 'Дмитрий', 'Василий', 'Михаил', 'Пётр', 'Александр', 'Алексей', 'Виктор', 'Сергей'),
    array('Мария', 'Елена', 'Римма', 'Анна', 'Валентина', 'Злата', 'Арина', 'Ольга', 'Кристина')
  );
  $lastNames = array(
    array('Дерюженков', 'Кобелев', 'Гнездилов', 'Сергеев', 'Петров', 'Сахаров', 'Коновалов', 'Рогов', 'Носов'),
    array('Дерюженкова', 'Кобелева', 'Гнездилова', 'Сергеева', 'Петрова', 'Сахарова', 'Коновалова', 'Рогова', 'Носова'),
  );
  $patronymics = array(
    array('Андреевич', 'Дмитриевич', 'Васильевич', 'Михаилович', 'Петрович', 'Александрович', 'Алексеевич', 'Викторович', 'Сергеевич', 'Борисович', 'Юрьевич'),
    array('Андреевна', 'Дмитриевна', 'Васильевна', 'Михаиловна', 'Петровна', 'Александровна', 'Алексеевна', 'Викторовна', 'Сергеевна', 'Борисовна', 'Юрьевна'),
  );
  $statuses = array(
    array(
      'Когда нет настоящей жизни, то живут миражами. Все-таки лучше, чем ничего. Антон Чехов "Дядя Ваня"',
      'Секрет успехa в жизни связaн с честностью и порядочностью: Если у вaс нет этих кaчеств — успех гaрaнтировaн...',
      'Наступает весна и нам не спится,не спится,не спиться бы...',
      'Одна мудрая мысль, рождает много похожих.',
      'Чем короче мысль, тем сильнее смысл.',
    ),
    array(
      'И всё-таки женская дружба существует, как ни крути… люблю тебя, моя подруженция=*)',
      'Иногда женщине больше ничего не остается, кроме как быть стервой...',
      'Я просто СЧАСТЛИВА от того что, ТЫ у МЕНЯ ЕСТЬ… Вот это счастье)',
      'Ничто так не старит женщину, как слишком богатый костюм.',
      'Тяжело быть изюминкой в коробке с изюмом',
    ),
    array(
      'Школа закончится, воспоминания пройдут, сомнения останутся, и только наша дружба будет жить дальше.',
      'Счастье — это когда тебе ничего не нужно в данный момент, кроме того, что уже есть. Эльчин Сафарли',
      'Знаете, с годами все больше убеждаюсь в 2-х вещах: всё тайное, станет явным. И всё возвращается как бумеранг.',
      'Забыть нельзя, вернуть невозможно...',
      'Уборка - это равномерное распределение мусора...',
    ),
  );

  // Администратор
  // ! Обязательно заполните эти данные
  $users = array(array(
    // Статус аккаунта
    'status' => 1,
    // Текстовый статус
    'page_status' => '',
    // Логин
    'login' => '',
    // Хеш пароля
    'password' => '',
    // Имя
    'name' => '',
    // Фамилия
    'last_name' => '',
    // Отчество
    'patronymic' => '',
    // Дата рождения: YYYY-MM-DD
    'birth_date' => '',
    // Пол: 0 (М) и 1 (Ж)
    'sex' => 0,
    'email' => '',
    // Роль администратора
    'roles' => array('admin'),
    'avatar_crop_data' => array(),
    'settings' => array(
      "profileBackground" => 3,
      "profileHeaderType" => 'full'
    )
  ));

  // Случайный элемент из массива
  function getRandomElm(array $array) {
    return $array[rand(0, count($array) - 1)];
  }

  // Случайное булево
  function getRandBool(): bool {
    return rand(0, 1) === 1;
  }

  // Заполнить пользователей
  for($k = 1; $k < $count; $k++) {
    $sex = rand(0, 1);
    $statusKey = getRandBool()? $sex: 2;
    $firstName = getRandomElm($firstNames[$sex]);
    $lastName = getRandomElm($lastNames[$sex]);
    $patronymic = getRandBool()? getRandomElm($patronymics[$sex]): "";
    $status = getRandBool()? getRandomElm($statuses[$statusKey]): "";
    $profileBackground = rand(1, 12);
    $profileHeaderType = getRandomElm(array('full', 'short', 'collapsed'));
    // Данные юзера
    $users[$k] = array(
      'status' => 1,
      'page_status' => $status,
      'login' => 'test' . $k,
      'password' => 'cb37560b14051388a1f9f7a7c25f1218587d9da83a02ef2494b42e6e4f386710c3161488bbeb41f083e10a445bf8ae00da9a29084c9cdfc282e32bc6610bb234',
      'name' => $firstName,
      'last_name' => $lastName,
      'patronymic' => $patronymic,
      'birth_date' => rand(1970, 2004) . '-' . rand(1, 12) . '-' . rand(1, 28),
      'sex' => $sex,
      'email' => 'akb2-online-' . $k . '@ya.ru',
      'roles' => array(),
      'avatar_crop_data' => array(),
      'settings' => array(
        "profileBackground" => $profileBackground,
        "profileHeaderType" => $profileHeaderType
      )
    );
  }
?>

<? foreach($users as $user): ?>
  INSERT INTO `users`
    (
      <? $i = 0; ?>
      <? foreach($user as $k => $v): ?>
        <? if($i > 0): ?>, <? endif; ?>
        `<?=$k;?>`
        <? $i++; ?>
      <? endforeach; ?>
    )
    VALUES (
      <? $i = 0; ?>
      <? foreach($user as $k => $v): ?>
        <? if($i > 0): ?>, <? endif; ?>

        <? if(gettype($v) === 'integer' || gettype($v) === 'double'): ?> <?=$v;?>
        <? elseif(gettype($v) === 'array' || gettype($v) === 'object'): ?> "<?=addslashes(json_encode($v));?>"
        <? else: ?> "<?=addslashes(strval($v));?>"
        <? endif; ?>

        <? $i++; ?>
      <? endforeach; ?>
    );
<? endforeach; ?>