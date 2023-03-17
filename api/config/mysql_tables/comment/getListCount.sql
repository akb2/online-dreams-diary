SELECT COUNT(*)
FROM `comments`
WHERE
  `material_type` = :material_type AND
  `material_id` = :material_id