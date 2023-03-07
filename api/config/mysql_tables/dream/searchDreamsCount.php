SELECT COUNT(*)
FROM `dreams`
WHERE
`id` > 0

<? // Поиск по списку IDs
if (count($input['ids']) > 0) : ?>
  <? $i = 0; ?>
  AND (
  <? foreach ($input['ids'] as $id) : ?>
    <? if ($i > 0) : ?> OR <? endif; ?>
    `id` = "<?= intval($id); ?>"
    <? $i += 1; ?>
  <? endforeach; ?>
  )
<? endif; ?>

<? // Исключение IDs из поиска
if (count($input['exclude_ids']) > 0) : ?>
  <? foreach ($input['exclude_ids'] as $id) : ?>
    AND `id` != "<?= intval($id); ?>"
  <? endforeach; ?>
<? endif; ?>

<? // Поиск по поисковому запросу */
if (strlen($input['q']) > 0) : ?>
  AND MATCH (`title`, `description`, `keywords`, `text`) AGAINST (:q IN BOOLEAN MODE)
<? endif; ?>

<? // Фильтр по пользователю
if ($input['user_id'] > 0) : ?>
  AND `user_id` = :user_id
<? endif; ?>

<? // Сновидения с картой и текстом
if (!!$input['withMap'] && !!$input['withText']) : ?>
  AND `mode` = 2
<? // Сновидения с картой
elseif (!!$input['withMap']) : ?>
  AND (`mode` = 2 OR `mode` = 1)
<? // Сновидения с текстом
elseif (!!$input['withText']) : ?>
  AND (`mode` = 2 OR `mode` = 0)
<? endif; ?>

<? // Фильтр по статусам: собственные сновидения */
// ? draft(0), private(1), hash(2), friends(3), users(4), public(5) */
if ($input['user_id'] > 0 && $input['check_token'] && $input["user_id"] === $input["current_user"]) : ?>
  <? if ($input['status'] >= 0) : ?>
    AND `status` = :status
  <? endif; ?>
<? // Фильтр по статусам: определенного пользователя */
// ? !friends(3)!, *users(4)*, public(5) */
elseif ($input['user_id'] > 0 && $input['check_token'] && $input["user_id"] !== $input["current_user"]) : ?>
  <? if ($input['status'] >= 0) : ?>
    <? if (($input['status'] == 3 && $input['are_friends']) || $input['status'] == 4 || $input['status'] == 5) : ?>
      AND `status` = :status
    <? else : ?>
      AND `status` = -2
    <? endif; ?>
  <? // Все доступные статусы
  else : ?>
    AND (
    `status` = 5 OR
    `status` = 4
    <? if ($input['are_friends']) : ?> OR `status` = 3 <? endif; ?>
    )
  <? endif; ?>
<? // Фильтр по статусам: Общий дневник: Авторизованный пользователь
// ? *users(4)*, public(5) */
elseif ($input['check_token']) : ?>
  <? if ($input['status'] >= 0) : ?>
    <? if ($input['status'] == 4 || $input['status'] == 5) : ?>
      AND `status` = :status
    <? else : ?>
      AND `status` = -2
    <? endif; ?>
  <? // Все доступные статусы
  else : ?>
    AND (
    `status` = 5 OR
    `status` = 4
    )
  <? endif; ?>
<? // Фильтр по статусам: Общий дневник: Неавторизованный пользователь
// ? public(5)
else : ?>
  AND `status` = 5
<? endif; ?>