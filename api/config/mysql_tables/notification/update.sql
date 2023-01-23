UPDATE `notifications`
SET
  `text` = :text,
  `link` = :link,
  `action_type` = :action_type,
  `data` = :data,
  `create_date` = CURRENT_TIMESTAMP
WHERE
  `id` = :id