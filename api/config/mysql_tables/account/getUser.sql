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
  `register_date`,
  `last_action_date`,
  `birth_date`,
  `sex`,
  `email`,
  `roles`,
  `avatar_crop_data`
FROM `users`
WHERE
  `id` = ?