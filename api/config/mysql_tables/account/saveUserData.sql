UPDATE `users`
SET
  `name` = ?,
  `last_name` = ?,
  `patronymic` = ?,
  `birth_date` = ?,
  `sex` = ?,
  `email` = ?
WHERE
  `id` = ?