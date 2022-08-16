SELECT COUNT(*)
FROM `users`
WHERE
  `id` > 0

  <?/* Поиск по поисковому запросу */?>
  <? if (strlen($input["q"]) > 0): ?>
    AND MATCH (`name`, `last_name`, `patronymic`) AGAINST (:q IN BOOLEAN MODE)
  <? endif;?>

  <?/* Поиск по полу пользователя */?>
  <? if (strlen($input["sex"]) > 0 && (strval($input["sex"]) === "0" || strval($input["sex"]) === "1")): ?>
    AND `sex` = :sex
  <? endif;?>

  <?/* Поиск по году рождения */?>
  <? if (strlen($input["birth_year"]) > 0): ?>
    AND EXTRACT(year FROM `birth_date`) = :birth_year
  <? endif; ?>

  <?/* Поиск по месяцу рождения */?>
  <? if (strlen($input["birth_month"]) > 0): ?>
    AND EXTRACT(month FROM `birth_date`) = :birth_month
  <? endif; ?>

  <?/* Поиск по дню рождения */?>
  <? if (strlen($input["birth_day"]) > 0): ?>
    AND EXTRACT(day FROM `birth_date`) = :birth_day
  <? endif; ?>