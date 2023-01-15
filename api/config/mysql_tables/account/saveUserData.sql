UPDATE `users`
SET
  `name` = ?,
  `last_name` = ?,
  `patronymic` = ?,
  `birth_date` = ?,
  `sex` = ?,
  `email` = ?,
  `last_edit_date` = CURRENT_TIMESTAMP
WHERE
  `id` = ?