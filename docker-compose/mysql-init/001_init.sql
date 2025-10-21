-- Create schema for field_report app
CREATE DATABASE IF NOT EXISTS `rapport` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `rapport`;

-- Users table (used by verif.php)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `UserName` VARCHAR(100) NOT NULL,
  `Code` VARCHAR(100) NOT NULL,
  UNIQUE KEY `uk_users_username` (`UserName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Invest table (used by index.php)
CREATE TABLE IF NOT EXISTS `invest` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `UserName` VARCHAR(100) NOT NULL,
  `Code` VARCHAR(100) NOT NULL,
  UNIQUE KEY `uk_invest_username` (`UserName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Contacts table (expected by contact.php)
CREATE TABLE IF NOT EXISTS `contacts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `users_name` VARCHAR(100) NOT NULL,
  `contact_refus` INT NOT NULL DEFAULT 0,
  `annulee_interrompue` INT NOT NULL DEFAULT 0,
  `sans_reponse` INT NOT NULL DEFAULT 0,
  `contact_reussi` INT NOT NULL DEFAULT 0,
  `contact_pris` INT NOT NULL DEFAULT 0,
  `date_contact` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Interview table (expected by interview.php)
CREATE TABLE IF NOT EXISTS `interview` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `users_name` VARCHAR(100) NOT NULL,
  `nom_interlocuteur` VARCHAR(255) NOT NULL,
  `age_interlocuteur` VARCHAR(10) NOT NULL,
  `sex_interlocuteur` VARCHAR(10) NOT NULL,
  `lieux_interlocuteur` TEXT NOT NULL,
  `numero_interlocuteur` VARCHAR(50) NOT NULL,
  `mail_interlocuteur` VARCHAR(150) NOT NULL,
  `date_interview` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Projet table (expected by localisation.php)
CREATE TABLE IF NOT EXISTS `projet` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `users_name` VARCHAR(100) NOT NULL,
  `ville` VARCHAR(100) NOT NULL,
  `projet` VARCHAR(100) NOT NULL,
  `date_projet` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default lists used by fonction.php
CREATE TABLE IF NOT EXISTS `defaut_projet` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `projet` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `defaut_ville` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ville` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Minimal seed data
INSERT INTO `users` (`UserName`, `Code`) VALUES ('Camd0101', '0101')
  ON DUPLICATE KEY UPDATE `Code`=VALUES(`Code`);
INSERT INTO `invest` (`UserName`, `Code`) VALUES ('Camd0101', '0101')
  ON DUPLICATE KEY UPDATE `Code`=VALUES(`Code`);

INSERT INTO `defaut_projet` (`projet`) VALUES ('Retail'), ('Mystering-shoping'), ('Fleuve')
  ON DUPLICATE KEY UPDATE `projet`=`projet`;
INSERT INTO `defaut_ville` (`ville`) VALUES ('Kinshasa'), ('Lubumbashi'), ('Boma')
  ON DUPLICATE KEY UPDATE `ville`=`ville`;
