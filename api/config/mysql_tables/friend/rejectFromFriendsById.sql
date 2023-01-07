UPDATE `friends`
SET
  `status` = IF(`in_user_id` = :user_id, 0, 2),
  `in_date` = CURRENT_TIMESTAMP
WHERE
  `id` = :id