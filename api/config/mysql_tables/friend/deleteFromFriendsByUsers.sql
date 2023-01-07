DELETE FROM `friends`
WHERE
  `out_user_id` = ? AND
  `in_user_id` = ?