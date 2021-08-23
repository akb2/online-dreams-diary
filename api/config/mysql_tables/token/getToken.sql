SELECT
  `id`,
  `token`,
  DATE_FORMAT(`create_date`, '%Y-%m-%dT%TZ') AS `create_date`,
  DATE_FORMAT(`last_action_date`, '%Y-%m-%dT%TZ') AS `last_action_date`,
  `user_id`,
  INET_NTOA(`ip`) AS `ip`,
  `os`,
  `browser`,
  `browser_version`
FROM `tokens`
WHERE
  `token` = ?
LIMIT 1