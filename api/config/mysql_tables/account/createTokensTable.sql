CREATE TABLE `tokens`
  (
    `id` INT NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(128) NOT NULL DEFAULT "",
    `create_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_action_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `user_id` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE `token` (`token`)
  )
ENGINE = InnoDB
CHARSET = utf8 COLLATE utf8_general_ci