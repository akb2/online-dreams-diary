UPDATE `users`
SET
  `page_status` = ?,
  `last_edit_date` = CURRENT_TIMESTAMP
WHERE
  `id` = ?