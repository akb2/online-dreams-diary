UPDATE `users`
SET
  `activation_key` = ?,
  `activation_key_expire` = ?
WHERE
  `id` = ?