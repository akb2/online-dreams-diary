CREATE TABLE `dreams`
  (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT,
    `mode` INT(1) NOT NULL DEFAULT 0,
    `status` INT(1) NOT NULL DEFAULT 0,
    `type` INT(1) NOT NULL DEFAULT 0,
    `mood` INT(1) NOT NULL DEFAULT 2,
    `create_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `edit_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `title` VARCHAR(60) NOT NULL DEFAULT "Новое сновидение",
    `description` VARCHAR(400) NOT NULL DEFAULT "",
    `keywords` VARCHAR(500) NOT NULL DEFAULT "",
    `text` TEXT,
    `places` VARCHAR(2000) NOT NULL DEFAULT "",
    `members` VARCHAR(2000) NOT NULL DEFAULT "",
    `map` JSON,
    `header_type` VARCHAR(8) NOT NULL DEFAULT "short",
    `header_background` INT NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    INDEX `user_id` (`user_id`),
    INDEX `create_date` (`create_date`),
    INDEX `date` (`date`),
    INDEX `status` (`status`),
    INDEX `type` (`type`),
    INDEX `mood` (`mood`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    FULLTEXT (`title`, `description`, `keywords`, `text`)
  )
ENGINE = InnoDB
CHARSET = utf8 COLLATE utf8_general_ci