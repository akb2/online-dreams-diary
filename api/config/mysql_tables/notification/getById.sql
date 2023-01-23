SELECT
  `id`,
  `user_id`,
  `status`,
  DATE_FORMAT(`create_date`, '%Y-%m-%dT%TZ') AS `create_date`,
  `text`,
  `link`,
  `action_type`,
  `data`
FROM `notifications`
WHERE `id` = ?