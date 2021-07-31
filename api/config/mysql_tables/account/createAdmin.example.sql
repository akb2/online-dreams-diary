INSERT INTO `users`
  (
    `status`,
    `login`,
    `password`,
    `name`,
    `last_name`,
    `register_date`,
    `birth_date`,
    `sex`,
    `email`,
    `roles`
  )
  VALUES (
    1,
    "**Логин**",
    "**Хэш пароля**",
    "**Имя**",
    "**Пароль**",
    CURRENT_TIMESTAMP,
    "**Дата рождения**",
    0,
    "**Адрес почты**",
    "[\"admin\"]"
  )