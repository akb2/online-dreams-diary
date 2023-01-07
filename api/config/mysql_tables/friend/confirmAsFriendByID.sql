UPDATE `friends`
SET
  `status` = 1,
  `in_date` = CURRENT_TIMESTAMP
WHERE
  `id` = ?