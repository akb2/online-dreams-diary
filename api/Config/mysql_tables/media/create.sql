INSERT INTO `media_files`
  (
    `user_id`,
    `hash`,
    `size`,
    `extension`,
    `original_name`,
    `keywords`,
    `description`
  )
VALUES
  (
    :user_id,
    :hash,
    :size,
    :extension,
    :original_name,
    :keywords,
    :description
  )