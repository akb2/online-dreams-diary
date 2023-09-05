SELECT
  `id`,
  `token`,
  `user_id`,
  DATE_FORMAT(`last_action_date`, '%Y-%m-%dT%TZ') AS `last_action_date`,
  INET_NTOA(`ip`) AS `ip`,
  `os`,
  `browser`,
  `browser_version`
FROM `tokens`
WHERE
  `token` = ?
LIMIT 1