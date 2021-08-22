SELECT
  `id`,
  `token`,
  `create_date`,
  `last_action_date`,
  `user_id`,
  INET_NTOA(`ip`) AS `ip`,
  `os`,
  `browser`,
  `browser_version`
FROM `tokens`
WHERE
  `token` = ?
LIMIT 1