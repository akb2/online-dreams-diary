CREATE TABLE `users`
  (
    `id` INT NOT NULL AUTO_INCREMENT,
    `status` TINYINT(1) NOT NULL DEFAULT 0,
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
    PRIMARY KEY (`id`),
    UNIQUE `login` (`login`),
    UNIQUE `email` (`email`)
  )
ENGINE = InnoDB
CHARSET = utf8 COLLATE utf8_general_ci