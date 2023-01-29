SELECT COUNT(*)
FROM `notifications`
WHERE
`user_id` = :user_id

<? if ($input['status'] >= 0) : ?>
  AND `status` = :status
<? endif; ?>