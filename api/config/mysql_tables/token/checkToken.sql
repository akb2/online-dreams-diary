SELECT
  `id`,
  `token`,
  `user_id`,
  `last_action_date`,
  INET_NTOA(`ip`) AS `ip`,
  `os`,
  `browser`,
  `browser_version`
FROM `tokens`
WHERE
  `token` = ?
LIMIT 1