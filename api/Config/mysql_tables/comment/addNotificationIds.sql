UPDATE `comments`
SET
  `owner_notification_id` = ?,
  `reply_notification_id` = ?
WHERE
  `id` = ?;