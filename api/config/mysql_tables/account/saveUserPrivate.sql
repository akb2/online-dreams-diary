UPDATE `users`
SET
  `private` = ?,
  `last_edit_date` = CURRENT_TIMESTAMP
WHERE
  `id` = ?