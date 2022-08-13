SELECT COUNT(*)
FROM `users`
WHERE
  `id` > 0

  <?/* Поиск по поисковому запросу */?>
  <? if(strlen($input["q"]) > 0): ?>
    AND MATCH (`name`, `last_name`, `patronymic`) AGAINST (:q IN BOOLEAN MODE)
  <? endif;?>