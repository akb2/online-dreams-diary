SELECT COUNT(*)
FROM `users`
WHERE
  `id` = :id AND
  `password` = :password