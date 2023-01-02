UPDATE `users`
SET
  `last_action_date` = CURRENT_TIMESTAMP
WHERE
  `id` = ?