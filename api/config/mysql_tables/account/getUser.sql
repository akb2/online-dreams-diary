SELECT
  `id`,
  `page_status`,
  `activation_key`,
  `activation_key_expire`,
  `settings`,
  `private`,
  `status`,
  `login`,
  `name`,
  `last_name`,
  `patronymic`,
  DATE_FORMAT(`register_date`, '%Y-%m-%dT%TZ') AS `register_date`,
  DATE_FORMAT(`last_action_date`, '%Y-%m-%dT%TZ') AS `last_action_date`,
  `birth_date`,
  `sex`,
  `email`,
  `roles`,
  `avatar_crop_data`
FROM `users`
WHERE
  `id` = ?