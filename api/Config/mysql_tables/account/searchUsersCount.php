SELECT COUNT(*)
FROM `users`
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
  AND MATCH (`name`, `last_name`, `patronymic`) AGAINST (:q IN BOOLEAN MODE)
<? endif; ?>

<?/* Поиск по полу пользователя */ ?>
<? if (strlen($input['sex']) > 0 && (strval($input['sex']) === '0' || strval($input['sex']) === '1')) : ?>
  AND `sex` = :sex
<? endif; ?>

<?/* Поиск по году рождения */ ?>
<? if (strlen($input['birth_year']) > 0) : ?>
  AND EXTRACT(year FROM `birth_date`) = :birth_year
<? endif; ?>

<?/* Поиск по месяцу рождения */ ?>
<? if (strlen($input['birth_month']) > 0) : ?>
  AND EXTRACT(month FROM `birth_date`) = :birth_month
<? endif; ?>

<?/* Поиск по дню рождения */ ?>
<? if (strlen($input['birth_day']) > 0) : ?>
  AND EXTRACT(day FROM `birth_date`) = :birth_day
<? endif; ?>

<?/* Поиск по статусу пользователя */ ?>
<? if ($input['status'] > 0) : ?>
  AND `status` = :status
<? endif; ?>