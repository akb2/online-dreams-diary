UPDATE `friends`
SET
  `status` = 1,
  `in_date` = CURRENT_TIMESTAMP
WHERE (
  (
    `out_user_id` = :out_user_id AND
    `in_user_id` = :in_user_id
  ) OR (
    `in_user_id` = :out_user_id AND
    `out_user_id` = :in_user_id
  )
)