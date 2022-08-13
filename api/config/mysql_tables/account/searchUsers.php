SELECT
  `id`,
  `page_status`,
  `settings`,
  `status`,
  `login`,
  `name`,
  `last_name`,
  `patronymic`,
  `register_date`,
  `birth_date`,
  `sex`,
  `email`,
  `roles`,
  `avatar_crop_data`

  <?/* Поиск по поисковому запросу + сортировка */?>
  <? if(strlen($input["q"]) > 0): ?>
    , MATCH (`name`, `last_name`, `patronymic`) AGAINST (:q IN BOOLEAN MODE) AS `q`
  <? endif;?>
FROM `users`
WHERE
  `id` > 0

  <?/* Поиск по поисковому запросу */?>
  <? if(strlen($input["q"]) > 0): ?>
    AND MATCH (`name`, `last_name`, `patronymic`) AGAINST (:q IN BOOLEAN MODE)
  <? endif;?>

ORDER BY  <? if(strlen($input["q"]) > 0): ?>`q` DESC,<? endif;?> `id` ASC
LIMIT <?=$input['limit_start'];?>, <?=$input['limit_length'];?>