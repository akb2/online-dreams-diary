SELECT COUNT(*)
FROM `dreams`
WHERE
`id` > 0

<?/* Поиск по списку IDs */ ?>
<? if (count($input['ids']) > 0) : ?>
  <? $i = 0; ?>
  AND (
  <? foreach ($input['ids'] as $id) : ?>
    <? if ($i > 0) : ?> OR <? endif; ?>
    `id` = "<?= intval($id); ?>"
    <? $i += 1; ?>
  <? endforeach; ?>
  )
<? endif; ?>

<?/* Исключение IDs из поиска */ ?>
<? if (count($input['exclude_ids']) > 0) : ?>
  <? foreach ($input['exclude_ids'] as $id) : ?>
    AND `id` != "<?= intval($id); ?>"
  <? endforeach; ?>
<? endif; ?>

<?/* Поиск по поисковому запросу */ ?>
<? if (strlen($input['q']) > 0) : ?>
  AND MATCH (`title`, `description`, `keywords`, `text`) AGAINST (:q IN BOOLEAN MODE)
<? endif; ?>

<?/* Фильтр по пользователю */ ?>
<? if ($input['user_id'] > 0) : ?>
  AND `user_id` = :user_id
<? endif; ?>

<?/* Фильтр по статусам: собственные сновидения */ ?>
<?/* // ? draft(0), private(1), hash(2), friends(3), users(4), public(5) */ ?>
<? if ($input['user_id'] > 0 && $input['check_token'] && $input["user_id"] === $input["current_user"]) : ?>

  <?/* Фильтр по статусам: определенного пользователя */ ?>
  <?/* // ? !friends(3)!, *users(4)*, public(5) */ ?>
<? elseif ($input['user_id'] > 0 && $input['check_token'] && $input["user_id"] !== $input["current_user"]) : ?>
  AND (
  `status` = 5 OR
  `status` = 4
  <? if ($input['are_friends']) : ?> OR `status` = 3 <? endif; ?>
  )

  <?/* Фильтр по статусам: Общий дневник: Авторизованный пользователь */ ?>
  <?/* // ? *users(4)*, public(5) */ ?>
<? elseif ($input['check_token']) : ?>
  AND (
  `status` = 5 OR
  `status` = 4
  )

  <?/* Фильтр по статусам: Общий дневник: Неавторизованный пользователь */ ?>
  <?/* // ? public(5) */ ?>
<? else : ?>
  AND `status` = 5
<? endif; ?>