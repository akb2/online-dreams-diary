INSERT INTO `tokens`
  (
    `token`,
    `user_id`,
    `ip`,
    `os`,
    `browser`,
    `browser_version`
  )
  VALUES (
    ?,
    ?,
    INET_ATON(?),
    ?,
    ?,
    ?
  )