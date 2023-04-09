CREATE TABLE `media_files`
  (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT,
    `hash` CHAR(128),
    `create_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `size` BIGINT,
    `extension` VARCHAR(10),
    `original_name` VARCHAR(255),
    `keywords` TEXT,
    `description` TEXT,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `hash` (`hash`),
    INDEX `create_date` (`create_date`),
    INDEX `user_id` (`user_id`),
    INDEX `extension` (`extension`)
  )
ENGINE = InnoDB
CHARSET = utf8 COLLATE utf8_general_ci