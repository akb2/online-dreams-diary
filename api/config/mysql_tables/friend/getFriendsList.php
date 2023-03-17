SELECT
`id`,
`out_user_id`,
`in_user_id`,
`status`,
DATE_FORMAT(`out_date`, '%Y-%m-%dT%TZ') AS `out_date`,
DATE_FORMAT(`in_date`, '%Y-%m-%dT%TZ') AS `in_date`
FROM `friends`
WHERE
`id` > 0

<? if ($input['type'] == 'friends') : ?>
  <?/* // ? Список друзей */ ?>
  <? $sortField = 'in_date'; ?>
  AND `status` = 1 AND
  (
  `out_user_id` = :user_id OR
  `in_user_id` = :user_id
  )

<? elseif ($input['type'] == 'subscribers') : ?>
  <?/* // ? Подписчики */ ?>
  AND ((
  `in_user_id` = :user_id AND
  `status` = 0
  ) OR (
  `out_user_id` = :user_id AND
  `status` = 2
  ))

<? elseif ($input['type'] == 'subscribe') : ?>
  <?/* // ? Подписки */ ?>
  AND ((
  `out_user_id` = :user_id AND
  `status` = 0
  ) OR (
  `in_user_id` = :user_id AND
  `status` = 2
  ))
<? endif; ?>

ORDER BY RAND()
LIMIT <?= $input['limit_start']; ?>, <?= $input['limit_length']; ?>