INSERT INTO `users`
  (
    `status`,
    `page_status`,
    `login`,
    `password`,
    `name`,
    `last_name`,
    `patronymic`,
    `register_date`,
    `birth_date`,
    `sex`,
    `email`,
    `roles`,
    `avatar_crop_data`,
    `settings`
  )
  VALUES (
    1,
    "**Текст статуса на странице**",
    "**Логин**",
    "**Хэш пароля**",
    "**Имя**",
    "**Фамилия**",
    "**Отчество**",
    CURRENT_TIMESTAMP,
    "**Дата рождения**",
    0,
    "**Адрес почты**",
    "[\"admin\"]",
    "[]",
    "[]"
  )