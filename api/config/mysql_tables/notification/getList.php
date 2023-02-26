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

ORDER BY `create_date` DESC
LIMIT <?= $input['limit_start'] ?>, <?= $input['limit_length']; ?>