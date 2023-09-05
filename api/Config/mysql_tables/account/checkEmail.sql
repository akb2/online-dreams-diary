SELECT
  `id`
FROM `users`
WHERE
  `id` != ? AND
  `email` = ?
LIMIT 1