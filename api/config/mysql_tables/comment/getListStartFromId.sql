SELECT
  `id`,
  `user_id`,
  `reply_to_user_id`,
  `material_type`,
  `material_id`,
  `material_owner`,
  `text`,
  DATE_FORMAT(`create_date`, '%Y-%m-%dT%TZ') AS `create_date`,
  `attachment`

FROM `comments`

WHERE
  `material_type` = :material_type AND
  `material_id` = :material_id AND
  `id` <= :start_with_id

ORDER BY `create_date` DESC, `id` DESC
LIMIT 0, :limit_length