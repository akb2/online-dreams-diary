INSERT INTO `notifications`
(
  `user_id`,
  `text`,
  `link`,
  `action_type`,
  `data`
)
VALUES
(
  :user_id,
  :text,
  :link,
  :action_type,
  :data
)