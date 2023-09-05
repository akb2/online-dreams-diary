SELECT `id`
FROM `notifications`
WHERE
`user_id` = :user_id AND
`action_type` = :action_type AND
`link` = :link AND
`text` = :text AND

<? if (isset($input['data']) && (is_array($input['data']) || is_string($input['data']))) : ?>
  <? $i = 0; ?>
  <? $data = is_array($input['data']) ? $input['data'] : json_decode($input['data'], false) ?>
  <? foreach ($data as $key => $value) : ?>
    <?= $i > 0 ? 'AND' : ''; ?>
    JSON_CONTAINS(`data`->"$.<?= $key; ?>", "<?= $value ?>")
    <? $i++; ?>
  <? endforeach; ?>
<? endif; ?>

ORDER BY `create_date` DESC
LIMIT 1