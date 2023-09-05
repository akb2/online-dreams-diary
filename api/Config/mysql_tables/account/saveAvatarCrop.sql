UPDATE `users`
SET
  `avatar_crop_data` = ?,
  `last_edit_date` = CURRENT_TIMESTAMP
WHERE
  `id` = ?