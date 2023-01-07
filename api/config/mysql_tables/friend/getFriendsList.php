<? $sortField = 'out_date'; ?>

SELECT
`id`,
`out_user_id`,
`in_user_id`,
`status`,
DATE_FORMAT(`out_date`, '%Y-%m-%dT%TZ') AS `out_date`,
DATE_FORMAT(`in_date`, '%Y-%m-%dT%TZ') AS `in_date`
FROM `friends`
WHERE

<? if ($input['type'] == 'friends') : ?>
  <?/* // ? Список друзей */ ?>
  <? $sortField = 'in_date'; ?>
  `status` = 1 AND
  (
  `out_user_id` = :user_id OR
  `in_user_id` = :user_id
  )

<? else if ($input['type'] == 'subscribers') : ?>
  <?/* // ? Подписчики */ ?>
  ((
  `in_user_id` = :user_id AND
  `status` = 0
  ) OR (
  `out_user_id` = :user_id AND
  `status` = 2
  ))

<? else if ($input['type'] == 'subscribe') : ?>
  <?/* // ? Подписки */ ?>
  ((
  `out_user_id` = :user_id AND
  `status` = 0
  ) OR (
  `in_user_id` = :user_id AND
  `status` = 2
  ))
<? endif; ?>

ORDER BY `<?= $sortField; ?>` DESC
LIMIT <?= $input['limit_start']; ?>, <?= $input['limit_length']; ?>