SELECT
  `id`
FROM `users`
WHERE
  `login` = ? AND
  `password` = ?
LIMIT 1