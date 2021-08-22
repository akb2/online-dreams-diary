CREATE TABLE `tokens`
  (
    `id` INT NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(128) NOT NULL DEFAULT "",
    `create_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_action_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `user_id` INT,
    `ip` INT(10) UNSIGNED NOT NULL,
    `os` VARCHAR(64),
    `browser` VARCHAR(128),
    `browser_version` VARCHAR(64),
    PRIMARY KEY (`id`),
    UNIQUE `token` (`token`),
    INDEX `user_id` (`user_id`),
    INDEX `create_date` (`create_date`),
    INDEX `last_action_date` (`last_action_date`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
  )
ENGINE = InnoDB
CHARSET = utf8 COLLATE utf8_general_ci