UPDATE `notifications`
SET
  `status` = 1
WHERE
  `id` = :id AND
  `user_id` = :user_id