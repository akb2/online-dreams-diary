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
WHERE
`user_id` = :user_id

<? if ($input['status'] >= 0) : ?>
  AND `status` = :status
<? endif; ?>

ORDER BY `create_date` DESC
LIMIT <?= $input['limit_start'] ?>, <?= $input['limit_length']; ?>