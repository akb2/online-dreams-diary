SELECT
  `id`,
  `token`,
  `user_id`,
  `last_action_date`
FROM `tokens`
WHERE
  `token` = ?
LIMIT 1