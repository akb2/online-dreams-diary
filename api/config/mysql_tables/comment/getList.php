SELECT
`id`,
`user_id`,
`reply_to_user_id`,
`material_type`,
`material_id`,
`material_owner`,
`text`,
DATE_FORMAT(`create_date`, '%Y-%m-%dT%TZ') AS `create_date`,
`attachment`
FROM `comments`
WHERE
`material_type` = :material_type AND
`material_id` = :material_id
ORDER BY `create_date` DESC
LIMIT <?= $input['limit_start']; ?>, <?= $input['limit_length']; ?>