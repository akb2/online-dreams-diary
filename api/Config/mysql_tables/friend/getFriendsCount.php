SELECT COUNT(*)
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