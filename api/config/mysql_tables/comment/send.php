INSERT INTO `comments` (
`user_id`,
`reply_to_user_id`,
`material_type`,
`material_id`,
`text`,
`attachment`
)
VALUES (
:user_id,
<?= !!$input['reply_to_user_id'] ? ':reply_to_user_id' : 'NULL' ?>,
:material_type,
:material_id,
:text,
<?= !!$input['attachment'] ? ':attachment' : 'NULL' ?>
)