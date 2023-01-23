SELECT COUNT(*)
FROM `notifications`
WHERE
`user_id` = :user_id

<? if ($input['last_id'] > 0) : ?>
  AND `id` <?= htmlspecialchars_decode('&lt;'); ?> :last_id
<? endif; ?>

<? if ($input['status'] >= 0) : ?>
  AND `status` = :status
<? endif; ?>