CREATE DATABASE nodejs_login;
USE nodejs_login;
SHOW TABLES;
ALTER TABLE users ADD COLUMN username VARCHAR(30) NOT NULL;
SELECT 
* FROM users;
DELETE FROM users;

DELETE FROM users WHERE id = 44;

SHOW COLUMNS FROM users LIKE '%name';

ALTER TABLE users AUTO_INCREMENT = 100;

INSERT INTO top5songs (id) VALUES(127);
SELECT * FROM top5songs WHERE id = 122;

SELECT * FROM top5songs WHERE id = 127;
UPDATE top5songs SET song_two = 'songid' WHERE id = 126;
SELECT * FROM top5songs;
DELETE FROM top5songs WHERE id = 127;
ALTER TABLE users ADD COLUMN top5songs VARCHAR(255);
ALTER TABLE users DROP COLUMN top5songs;

ALTER TABLE users ADD COLUMN access_token VARCHAR(255);
ALTER TABLE users MODIFY COLUMN authCode VARCHAR(500);
ALTER TABLE users ADD COLUMN authCode VARCHAR(255);

SELECT * FROM relationship;
SELECT user_id_one FROM relationship WHERE user_id_two = 6;

SELECT relationship.user_id_one, users.username FROM relationship INNER JOIN users ON relationship.user_id_one = users.id WHERE (user_id_one = 6 OR user_id_two = 6) AND status = 0 AND action_user_id != 1;

SELECT users.username FROM relationship INNER JOIN users ON IF(7=user_id_one, relationship.user_id_two = users.id, relationship.user_id_one = users.id) WHERE (user_id_one = 7 OR user_id_two = 7) AND status = 1;

UPDATE relationship SET status = 0, action_user_id = 6
  WHERE user_id_one = 6 AND user_id_two = 7;
  
CREATE TABLE IF NOT EXISTS `nodejs_login`.`top5songs` (
	`id` INT(11) NOT NULL,
    `song_one` VARCHAR(255),
    `song_two` VARCHAR(255),
    `song_three` VARCHAR(255),
    `song_four` VARCHAR(255),
    `song_five` VARCHAR(255),
    PRIMARY KEY (`id`),
    INDEX `fk_top5songs_users_idx` (`id` ASC) VISIBLE,
	CONSTRAINT `fk_top5songs_users`
		FOREIGN KEY (`id`)
		REFERENCES `nodejs_login`.`users` (`id`));
        
DROP TABLE top5songs;
        
SELECT * FROM top5songs;

SELECT username, song_one FROM users INNER JOIN top5songs ON users.id = top5songs.id WHERE users.id = 114;

DELETE FROM top5songs;

INSERT INTO top5songs (id, song_one, song_two, song_three, song_four, song_five) VALUES(122, 'sjkadhs', 'sjkadhs', 'sjkadhs', 'sjkadhs', 'sjkadhs');
INSERT INTO top5songs (id, song_one, song_two, song_three, song_four, song_five) VALUES(114, NULL, NULL, NULL, NULL, NULL);

CREATE TABLE IF NOT EXISTS `nodejs_login`.`users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `username` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 8
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

DROP TABLE relationship;
DROP TABLE users;
-- -----------------------------------------------------
-- Table `mydb`.`relationship`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `nodejs_login`.`relationship` (
  `user_id_one` INT(11) NOT NULL,
  `user_id_two` INT(11) NOT NULL,
  `status` INT(11) NULL DEFAULT NULL,
  `action_user_id` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`user_id_one`, `user_id_two`),
  INDEX `fk_relationship_users_idx` (`user_id_one` ASC) VISIBLE,
  CONSTRAINT `fk_relationship_users`
    FOREIGN KEY (`user_id_one`)
    REFERENCES `nodejs_login`.`users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;

