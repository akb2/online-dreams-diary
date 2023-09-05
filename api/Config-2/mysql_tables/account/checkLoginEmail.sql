SELECT
  `id`,
  `login`,
  `email`
FROM `users`
WHERE
  `login` = ? OR
  `email` = ?
LIMIT 1