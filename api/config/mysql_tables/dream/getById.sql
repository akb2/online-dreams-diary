SELECT
    `id`,
    `user_id`,
    `mode`,
    `status`,
    DATE_FORMAT(`create_date`, '%Y-%m-%dT%TZ') AS `create_date`,
    DATE_FORMAT(`date`, '%Y-%m-%dT%TZ') AS `date`,
    `title`,
    `description`,
    `keywords`,
    `text`,
    `places`,
    `members`,
    `map`,
    `header_type`,
    `header_background`
FROM `dreams`
WHERE
  `id` = ?