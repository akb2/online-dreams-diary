CREATE DATABASE IF NOT EXISTS online_dreams_diary;
USE online_dreams_diary;

-- Пользователи
CREATE TABLE IF NOT EXISTS `users`
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
    `last_action_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_edit_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
CHARSET = utf8 COLLATE utf8_general_ci;

-- Сновидения
CREATE TABLE IF NOT EXISTS `dreams`
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
    `interpretation` TEXT,
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
CHARSET = utf8 COLLATE utf8_general_ci;

-- Друзья, подписки и подписчики
CREATE TABLE IF NOT EXISTS `friends`
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
    INDEX `in_date` (`in_date`),
    FOREIGN KEY (`out_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`in_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
  )
ENGINE = InnoDB
CHARSET = utf8 COLLATE utf8_general_ci;

-- Информация о файлах
CREATE TABLE IF NOT EXISTS `media_files`
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
CHARSET = utf8 COLLATE utf8_general_ci;

-- Уведомления
CREATE TABLE IF NOT EXISTS `notifications`
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
CHARSET = utf8 COLLATE utf8_general_ci;

-- Комментарии
CREATE TABLE IF NOT EXISTS `comments`
  (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT,
    `reply_to_user_id` INT,
    `material_type` TINYINT(1),
    `material_id` INT,
    `material_owner` INT,
    `owner_notification_id` INT,
    `reply_notification_id` INT,
    `text` TEXT,
    `create_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `attachment` JSON,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reply_to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`material_owner`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`owner_notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reply_notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
    INDEX `user_id` (`user_id`),
    INDEX `create_date` (`create_date`),
    INDEX `material` (`material_type`, `material_id`),
    FULLTEXT (`text`)
  )
ENGINE = InnoDB
CHARSET = utf8 COLLATE utf8_general_ci;

-- Токены авторизации
CREATE TABLE IF NOT EXISTS `tokens`
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
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
  )
ENGINE = MEMORY
CHARSET = utf8 COLLATE utf8_general_ci;

-- Триггеры
DELIMITER $$
  -- Удалить комментарии при удалении пользователя
  CREATE TRIGGER `delete_comments_on_user_delete`
  AFTER DELETE ON `users`
  FOR EACH ROW
  BEGIN
    DELETE FROM `comments`
    WHERE `material_type` = 0
    AND `material_id` = OLD.`id`;
  END$$
  -- Удалить комментарии при удалении сновидения
  CREATE TRIGGER `delete_comments_on_dream_delete`
  AFTER DELETE ON `dreams`
  FOR EACH ROW
  BEGIN
    DELETE FROM `comments`
    WHERE `material_type` = 1
    AND `material_id` = OLD.`id`;
  END$$
  -- Удалить комментарии при удалении файла
  CREATE TRIGGER `delete_comments_on_media_file_delete`
  AFTER DELETE ON `media_files`
  FOR EACH ROW
  BEGIN
    DELETE FROM `comments`
    WHERE `material_type` = 2
    AND `material_id` = OLD.`id`;
  END$$
  -- Удалить уведомления при удалении комментария
  CREATE TRIGGER `delete_notifications_after_comment`
  AFTER DELETE ON `comments`
  FOR EACH ROW
  BEGIN
    DELETE FROM `notifications`
    WHERE `id` = OLD.`owner_notification_id`;
    DELETE FROM `notifications`
    WHERE `id` = OLD.`reply_notification_id`;
  END$$
DELIMITER ;