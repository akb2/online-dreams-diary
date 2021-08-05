SELECT
  `id`,
  `status`,
  `login`,
  `name`,
  `last_name`,
  `patronymic`,
  `register_date`,
  `birth_date`,
  `sex`,
  `email`,
  `roles`
FROM `users`
WHERE
  `id` = ?