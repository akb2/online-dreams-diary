UPDATE `users`
SET
  `settings` = ?,
  `last_edit_date` = CURRENT_TIMESTAMP
WHERE
  `id` = ?