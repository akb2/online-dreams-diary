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
  `header_type`,
  `header_background`
FROM `dreams`
WHERE
  `id` > 0

  <?/* Фильтр по пользователю */?>
  <? if($input['user_id'] > 0): ?>
    AND `user_id` = :user_id
  <? endif; ?>

  <?/* Фильтр по статусам: собственные сновидения */?>
  <?/* // ? draft(0), private(1), hash(2), friends(3), users(4), public(5) */?>
  <? if ($input['user_id'] > 0 && $input['check_token'] && $input["user_id"] === $input["current_user"]): ?>

  <?/* Фильтр по статусам: определенного пользователя */?>
  <?/* // ? !friends(3)!, *users(4)*, public(5) */?>
  <? elseif($input['user_id'] > 0 && $input["user_id"] !== $input["current_user"]): ?>
    AND (
      `status` = 5
      <? if($input['check_token']): ?> OR `status` = 4 <? endif; ?>
    )

  <?/* Фильтр по статусам: Общий дневник */?>
  <?/* // ? *users(4)*, public(5) */?>
  <? else: ?>
    AND (
      `status` = 5
      <? if($input['check_token']): ?> OR `status` = 4 <? endif; ?>
    )
  <? endif; ?>

ORDER BY `date` DESC
LIMIT <?=$input['limit_start'];?>, <?=$input['limit_length'];?>