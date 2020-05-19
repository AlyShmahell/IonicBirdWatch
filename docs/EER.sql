-- MySQL Script generated by MySQL Workbench
-- Tue May 19 04:13:59 2020
-- Model: EER    Version: 1.0
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema wildwatch
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema wildwatch
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `wildwatch` DEFAULT CHARACTER SET utf8 ;
USE `wildwatch` ;

-- -----------------------------------------------------
-- Table `wildwatch`.`users`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `wildwatch`.`users` ;

CREATE TABLE IF NOT EXISTS `wildwatch`.`users` (
  `username` VARCHAR(90) NOT NULL,
  `password` VARCHAR(90) NOT NULL,
  `firstname` VARCHAR(90) NOT NULL,
  `lastname` VARCHAR(90) NOT NULL,
  `fullname` VARCHAR(90) NOT NULL,
  `website` VARCHAR(90) NULL,
  `bio` VARCHAR(180) NULL,
  `photo` LONGBLOB NULL,
  PRIMARY KEY (`username`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE,
  UNIQUE INDEX `photo_UNIQUE` (`photo` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `wildwatch`.`wildlife`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `wildwatch`.`wildlife` ;

CREATE TABLE IF NOT EXISTS `wildwatch`.`wildlife` (
  `id` INT NOT NULL,
  `username` VARCHAR(90) NOT NULL,
  `type` VARCHAR(90) NOT NULL,
  `species` VARCHAR(90) NOT NULL,
  `notes` VARCHAR(180) NOT NULL,
  `location` POINT NOT NULL,
  `date` DATE NOT NULL,
  `photo` LONGBLOB NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC) VISIBLE,
  UNIQUE INDEX `photo_UNIQUE` (`photo` ASC) VISIBLE,
  INDEX `fk_username_references_users` (`username` ASC) VISIBLE,
  CONSTRAINT `fk_data_user1`
    FOREIGN KEY (`username`)
    REFERENCES `wildwatch`.`users` (`username`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `wildwatch`.`curators`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `wildwatch`.`curators` ;

CREATE TABLE IF NOT EXISTS `wildwatch`.`curators` (
  `username` VARCHAR(90) NOT NULL,
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE,
  INDEX `fk_username_references_users` () VISIBLE,
  CONSTRAINT `fk_admin_user1`
    FOREIGN KEY (`username`)
    REFERENCES `wildwatch`.`users` (`username`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `wildwatch`.`reports`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `wildwatch`.`reports` ;

CREATE TABLE IF NOT EXISTS `wildwatch`.`reports` (
  `id` INT NOT NULL,
  `code` INT NOT NULL,
  `text` VARCHAR(180) NOT NULL,
  `resolved` TINYINT NOT NULL,
  `username` VARCHAR(90) NULL,
  INDEX `fk_id_references_wildlife` (`username` ASC) VISIBLE,
  INDEX `fk_username_references_curators` () VISIBLE,
  UNIQUE INDEX `id_UNIQUE` (`id` ASC) VISIBLE,
  CONSTRAINT `fk_reports_admin`
    FOREIGN KEY (`username`)
    REFERENCES `wildwatch`.`curators` (`username`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_reports_data1`
    FOREIGN KEY (`id`)
    REFERENCES `wildwatch`.`wildlife` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

USE `wildwatch`;

DELIMITER $$

USE `wildwatch`$$
DROP TRIGGER IF EXISTS `wildwatch`.`set_fullname` $$
USE `wildwatch`$$
CREATE DEFINER = CURRENT_USER TRIGGER `wildwatch`.`set_fullname` AFTER INSERT ON `user` FOR EACH ROW
BEGIN
	set new.fullname = CONCAT(new.firstname, " ", new.lastname);
END$$


USE `wildwatch`$$
DROP TRIGGER IF EXISTS `wildwatch`.`update_firstname_and_lastname` $$
USE `wildwatch`$$
CREATE DEFINER = CURRENT_USER TRIGGER `wildwatch`.`update_firstname_and_lastname` AFTER UPDATE ON `user` FOR EACH ROW
BEGIN
	IF !(new.fullname <=> old.fullname) THEN
      set new.firstname = substring_index2(new.fullname, ' ', 1);
      set new.lastname = substring_index2(new.fullname, ' ', 2);
   END IF;
END$$


USE `wildwatch`$$
DROP TRIGGER IF EXISTS `wildwatch`.`stop_insertion_if_same_entry` $$
USE `wildwatch`$$
CREATE DEFINER = CURRENT_USER TRIGGER `wildwatch`.`stop_insertion_if_same_entry` BEFORE INSERT ON `data` FOR EACH ROW
BEGIN
	IF (SELECT EXISTS(SELECT * FROM `data` WHERE new.type <=> old.type and  new.species <=> old.species and new.location <=> old.location)) THEN
      set new.species = NULL;
   END IF;
END$$


DELIMITER ;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
