SELECT
  `id`,
  `user_id`,
  `reply_to_user_id`,
  `material_type`,
  `material_id`,
  `text`,
  DATE_FORMAT(`create_date`, '%Y-%m-%dT%TZ') AS `create_date`,
  `attachment`
FROM `comments`
WHERE
  `material_type` = :material_type AND
  `material_id` = :material_id
ORDER BY `create_date` DESC
LIMIT :limit_start, :limit_end