SELECT
    `id`,
    `user_id`,
    `mode`,
    `status`,
    `create_date`,
    `date`,
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