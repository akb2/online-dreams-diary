DELETE FROM `tokens`
WHERE
  `user_id` = ? AND
  `token` != ?