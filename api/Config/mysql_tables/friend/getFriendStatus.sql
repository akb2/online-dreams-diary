SELECT
  `id`,
  `out_user_id`,
  `in_user_id`,
  `status`,
  DATE_FORMAT(`out_date`, '%Y-%m-%dT%TZ') AS `out_date`,
  DATE_FORMAT(`in_date`, '%Y-%m-%dT%TZ') AS `in_date`
FROM `friends`
WHERE (
  (
    `out_user_id` = :out_user_id AND
    `in_user_id` = :in_user_id
  ) OR (
    `in_user_id` = :out_user_id AND
    `out_user_id` = :in_user_id
  )
)
ORDER BY `id` DESC
LIMIT 1