CREATE TABLE `users`
  (
    `id` INT NOT NULL AUTO_INCREMENT,
    `page_status` VARCHAR(128) NOT NULL DEFAULT "",
    `status` TINYINT(1) NOT NULL DEFAULT 0,
    `activation_key` VARCHAR(128) NOT NULL DEFAULT "",
    `activation_key_expire` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `login` VARCHAR(24) NOT NULL DEFAULT "",
    `password` VARCHAR(128) NOT NULL DEFAULT "",
    `name` VARCHAR(30) NOT NULL DEFAULT "",
    `last_name` VARCHAR(30) NOT NULL DEFAULT "",
    `patronymic` VARCHAR(30) NOT NULL DEFAULT "",
    `register_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `birth_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `sex` TINYINT(1) NOT NULL DEFAULT 0,
    `email` VARCHAR(120) NOT NULL DEFAULT "",
    `roles` JSON NOT NULL,
    `avatar_crop_data` JSON NOT NULL,
    `settings` JSON NOT NULL,
    `private` JSON NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE `login` (`login`),
    UNIQUE `email` (`email`),
    FULLTEXT (`name`, `last_name`, `patronymic`)
  )
ENGINE = InnoDB
CHARSET = utf8 COLLATE utf8_general_ci