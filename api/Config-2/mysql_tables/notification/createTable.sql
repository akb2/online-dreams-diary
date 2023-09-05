CREATE TABLE `notifications`
  (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT,
    `status` INT(1) NOT NULL DEFAULT 0,
    `create_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `text` VARCHAR(1000) NOT NULL DEFAULT "",
    `link` VARCHAR(300),
    `action_type` VARCHAR(50),
    `data` JSON,
    PRIMARY KEY (`id`),
    INDEX `user_id` (`user_id`),
    INDEX `create_date` (`create_date`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
  )
ENGINE = InnoDB
CHARSET = utf8 COLLATE utf8_general_ci