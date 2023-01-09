SELECT COUNT(*)
FROM `friends`
WHERE

<? if ($input['type'] == 'friends') : ?>
  <?/* // ? Список друзей */ ?>
  `status` = 1 AND
  (
  `out_user_id` = :user_id OR
  `in_user_id` = :user_id
  )

<? else if ($input['type'] == 'subscribers') : ?>
  <?/* // ? Подписчики */ ?>
  (
  (
  `in_user_id` = :user_id AND
  `status` = 0
  ) OR (
  `out_user_id` = :user_id AND
  `status` = 2
  )
  )

<? else if ($input['type'] == 'subscribe') : ?>
  <?/* // ? Подписки */ ?>
  (
  (
  `out_user_id` = :user_id AND
  `status` = 0
  ) OR (
  `in_user_id` = :user_id AND
  `status` = 2
  )
  )
<? endif; ?>