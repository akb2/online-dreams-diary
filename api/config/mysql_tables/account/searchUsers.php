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
FROM `users`
WHERE
  `id` > 0
ORDER BY `id` ASC
LIMIT <?=$input['limit_start'];?>, <?=$input['limit_length'];?>