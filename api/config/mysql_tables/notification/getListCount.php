SELECT COUNT(*)
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