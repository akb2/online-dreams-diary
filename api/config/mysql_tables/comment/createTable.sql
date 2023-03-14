CREATE TABLE `comments`
  (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT,
    `reply_to_user_id` INT,
    `material_type` TINYINT(1),
    `material_id` INT,
    `text` TEXT,
    `create_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `attachment` JSON,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reply_to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `user_id` (`user_id`),
    INDEX `create_date` (`create_date`),
    INDEX `material` (`material_type`, `material_id`),
    FULLTEXT (`text`)
  )
ENGINE = InnoDB
CHARSET = utf8 COLLATE utf8_general_ci