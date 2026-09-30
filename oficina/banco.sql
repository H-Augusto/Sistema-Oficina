-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema oficina
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema oficina
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `oficina` DEFAULT CHARACTER SET utf8 ;
USE `oficina` ;

-- -----------------------------------------------------
-- Table `oficina`.`cliente`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `oficina`.`cliente` (
  `id_cliente` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(150) NOT NULL,
  `telefone` VARCHAR(14) NOT NULL,
  `endereco` varchar(70) not null, 
  `cpf` VARCHAR(64) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `update_at` DATETIME NOT NULL,
  `active` TINYINT NOT NULL default 1,
  PRIMARY KEY (`id_cliente`),
  UNIQUE INDEX `cpf_UNIQUE` (`cpf` ASC) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `oficina`.`veiculo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `oficina`.`veiculo` (
  `id_veiculo` INT NOT NULL AUTO_INCREMENT,
  `marca` VARCHAR(35) NOT NULL,
  `ano` DATE NOT NULL,
  `placa` VARCHAR(7) NOT NULL,
  `modelo` VARCHAR(40) NOT NULL,
  `cor` VARCHAR(10) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `update_at` DATETIME NOT NULL,
  `active` TINYINT NOT NULL default 1,
  `cliente_id_cliente` INT NOT NULL,
  PRIMARY KEY (`id_veiculo`),
  UNIQUE INDEX `placa_UNIQUE` (`placa` ASC) ,
  INDEX `fk_veiculo_cliente1_idx` (`cliente_id_cliente` ASC) ,
  CONSTRAINT `fk_veiculo_cliente1`
    FOREIGN KEY (`cliente_id_cliente`)
    REFERENCES `oficina`.`cliente` (`id_cliente`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `oficina`.`usuario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `oficina`.`usuario` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(150) NOT NULL,
  `senha` VARCHAR(255) NOT NULL,
  `email` VARCHAR(85) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `update_at` DATETIME NOT NULL,
  `active` TINYINT NOT NULL default 1,
  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `oficina`.`OS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `oficina`.`OS` (
  `id_OS` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(25) NOT NULL,
  `valor` DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `update_at` DATETIME NOT NULL,
  `status` VARCHAR(45) NOT NULL,
  `id_veiculo` INT NOT NULL,
  `usuario_id_usuario` INT NOT NULL,
  PRIMARY KEY (`id_OS`, `id_veiculo`, `usuario_id_usuario`),
  INDEX `fk_OS_veiculo1_idx` (`id_veiculo` ASC) ,
  INDEX `fk_OS_usuario1_idx` (`usuario_id_usuario` ASC) ,
  CONSTRAINT `fk_OS_veiculo1`
    FOREIGN KEY (`id_veiculo`)
    REFERENCES `oficina`.`veiculo` (`id_veiculo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_OS_usuario1`
    FOREIGN KEY (`usuario_id_usuario`)
    REFERENCES `oficina`.`usuario` (`id_usuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `oficina`.`mecanico`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `oficina`.`mecanico` (
  `id_mecanico` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(90) NOT NULL,
  `telefone` VARCHAR(14) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `update_at` DATETIME NOT NULL,
  `active` TINYINT NOT NULL default 1,
  `cpf` VARCHAR(14) NOT NULL,
  PRIMARY KEY (`id_mecanico`),
  UNIQUE INDEX `cpf_UNIQUE` (`cpf` ASC) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `oficina`.`servico`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `oficina`.`servico` (
  `id_servico` INT NOT NULL,
  `servico` VARCHAR(25) NOT NULL,
  `preco` DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `update_at` DATETIME NOT NULL,
  `active` TINYINT NOT NULL default 1,
  PRIMARY KEY (`id_servico`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `oficina`.`OS_has_servico`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `oficina`.`OS_has_servico` (
  `OS_id_OS` INT NOT NULL,
  `servico_id_servico` INT NOT NULL,
  PRIMARY KEY (`OS_id_OS`, `servico_id_servico`),
  INDEX `fk_OS_has_servico_servico1_idx` (`servico_id_servico` ASC) ,
  INDEX `fk_OS_has_servico_OS1_idx` (`OS_id_OS` ASC) ,
  CONSTRAINT `fk_OS_has_servico_OS1`
    FOREIGN KEY (`OS_id_OS`)
    REFERENCES `oficina`.`OS` (`id_OS`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_OS_has_servico_servico1`
    FOREIGN KEY (`servico_id_servico`)
    REFERENCES `oficina`.`servico` (`id_servico`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `oficina`.`mecanico_has_OS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `oficina`.`mecanico_has_OS` (
  `mecanico_id_mecanico` INT NOT NULL,
  `OS_id_OS` INT NOT NULL,
  `OS_veiculo_id_veiculo` INT NOT NULL,
  `OS_usuario_id_usuario` INT NOT NULL,
  PRIMARY KEY (`mecanico_id_mecanico`, `OS_id_OS`, `OS_veiculo_id_veiculo`, `OS_usuario_id_usuario`),
  INDEX `fk_mecanico_has_OS_OS1_idx` (`OS_id_OS` ASC, `OS_veiculo_id_veiculo` ASC,`OS_usuario_id_usuario` ASC) ,
  INDEX `fk_mecanico_has_OS_mecanico1_idx` (`mecanico_id_mecanico` ASC) ,
  CONSTRAINT `fk_mecanico_has_OS_mecanico1`
    FOREIGN KEY (`mecanico_id_mecanico`)
    REFERENCES `oficina`.`mecanico` (`id_mecanico`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_mecanico_has_OS_OS1`
    FOREIGN KEY (`OS_id_OS` , `OS_veiculo_id_veiculo` , `OS_usuario_id_usuario`)
    REFERENCES `oficina`.`OS` (`id_OS` , `id_veiculo` , `usuario_id_usuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

select * from `OS`;
