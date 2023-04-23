SELECT COUNT(*)
FROM `comments`
WHERE
  `material_type` = :material_type AND
  `material_id` = :material_id AND
  `create_date` >= STR_TO_DATE(:create_date, '%Y-%m-%dT%TZ') AND
  `id` > :id