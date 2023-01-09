CREATE TABLE `friends`
  (
    `id` INT NOT NULL AUTO_INCREMENT,
    `out_user_id` INT NOT NULL DEFAULT 0,
    `in_user_id` INT NOT NULL DEFAULT 0,
    `status` TINYINT(1) NOT NULL DEFAULT 0,
    `out_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `in_date` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    UNIQUE `users` (`out_user_id`, `in_user_id`),
    INDEX `out_date` (`out_date`),
    INDEX `in_date` (`in_date`)
  )
ENGINE = InnoDB
CHARSET = utf8 COLLATE utf8_general_ci