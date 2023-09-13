SELECT
  `id`,
  `user_id`,
  `hash`,
  DATE_FORMAT(`create_date`, '%Y-%m-%dT%TZ') AS `create_date`,
  `size`,
  `extension`,
  `original_name`,
  `keywords`,
  `description`
FROM `media_files`
WHERE
  `hash` = ?