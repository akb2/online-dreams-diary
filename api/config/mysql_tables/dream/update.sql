UPDATE `dreams`
SET
  `mode` = :mode,
  `status` = :status,
  `date` = :date,
  `title` = :title,
  `description` = :description,
  `keywords` = :keywords,
  `text` = :text,
  `places` = :places,
  `members` = :members,
  `map` = :map,
  `header_type` = :header_type,
  `header_background` = :header_background,
  `edit_date` = CURRENT_TIMESTAMP
WHERE
  `id` = :id