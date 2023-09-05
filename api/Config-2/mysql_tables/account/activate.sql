UPDATE `users`
SET
  `status` = 1,
  `activation_key` = "",
  `activation_key_expire` = CURRENT_TIMESTAMP,
  `last_edit_date` = CURRENT_TIMESTAMP
WHERE
  `id` = ?