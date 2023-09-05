SELECT
  `id`,
  `status`,
  `activation_key`,
  `activation_key_expire`
FROM `users`
WHERE
  `login` = ? AND
  `password` = ?
LIMIT 1