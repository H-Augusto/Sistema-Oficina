-- =====================================================================
-- Banco de dados: oficina
-- ---------------------------------------------------------------------
-- ARQUITETURA DO BANCO (desenho das tabelas)
--
--   cliente (1) ──────< (N) veiculo        1 cliente pode ter N veiculos
--   veiculo (1) ──────< (N) OS             1 veiculo pode ter N ordens de servico
--   usuario (1) ──────< (N) OS             1 usuario (mecanico/admin) abre N OS
--    OS     (N) >──────< (N) servico       tabela de juncao: OS_has_servico
--    OS     (N) >──────< (N) mecanico      tabela de juncao: mecanico_has_OS
--
-- PADRÕES USADOS:
--   * created_at / update_at  -> data de criacao e da ultima alteracao
--   * active (TINYINT 1/0)    -> soft delete. DELETE na API so seta active=0,
--                                nunca apaga a linha de verdade.
-- =====================================================================

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- Apaga o schema se ja existir, para poder rodar o script de novo do zero
DROP SCHEMA IF EXISTS `oficina` ;
CREATE SCHEMA IF NOT EXISTS `oficina` DEFAULT CHARACTER SET utf8 ;
USE `oficina` ;

-- =====================================================================
-- TABELA: cliente
-- Guarda os dados de quem leva o carro na oficina.
-- O CPF e guardado COMO HASH (sha256), nunca o CPF limpo, por seguranca.
-- Por isso a coluna cpf e VARCHAR(64): o hash sha256 gera 64 caracteres.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `oficina`.`cliente` (
  `id_cliente` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(150) NOT NULL,
  `telefone` VARCHAR(14) NOT NULL,
  `endereco` VARCHAR(70) NOT NULL,
  `cpf` VARCHAR(64) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `update_at` DATETIME NOT NULL,
  `active` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_cliente`),
  UNIQUE INDEX `cpf_UNIQUE` (`cpf` ASC) )
ENGINE = InnoDB;


-- =====================================================================
-- TABELA: veiculo
-- Cada veiculo pertence a EXATAMENTE 1 cliente (por isso o FK NOT NULL
-- cliente_id_cliente). A placa e unica: nao da pra ter 2 veiculos iguais.
-- O 'ano' e SMALLINT (numero de ano, ex: 2020), nao data.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `oficina`.`veiculo` (
  `id_veiculo` INT NOT NULL AUTO_INCREMENT,
  `marca` VARCHAR(35) NOT NULL,
  `ano` SMALLINT NOT NULL,
  `placa` VARCHAR(7) NOT NULL,
  `modelo` VARCHAR(40) NOT NULL,
  `cor` VARCHAR(10) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `update_at` DATETIME NOT NULL,
  `active` TINYINT NOT NULL DEFAULT 1,
  `cliente_id_cliente` INT NOT NULL,
  PRIMARY KEY (`id_veiculo`),
  UNIQUE INDEX `placa_UNIQUE` (`placa` ASC),
  INDEX `fk_veiculo_cliente1_idx` (`cliente_id_cliente` ASC),
  CONSTRAINT `fk_veiculo_cliente1`
    FOREIGN KEY (`cliente_id_cliente`)
    REFERENCES `oficina`.`cliente` (`id_cliente`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- =====================================================================
-- TABELA: usuario
-- Sao os funcionarios que usam o sistema (quem abre/gerencia as OS).
-- A senha e guardada COMO HASH (bcrypt), nunca a senha limpo.
-- O email e unico: nao da pra cadastrar 2 usuarios com o mesmo email.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `oficina`.`usuario` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(150) NOT NULL,
  `senha` VARCHAR(255) NOT NULL,
  `email` VARCHAR(85) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `update_at` DATETIME NOT NULL,
  `active` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) )
ENGINE = InnoDB;


-- =====================================================================
-- TABELA: OS  (Ordem de Servico)
-- E o "documento" do trabalho: reune o que foi feito, quanto custou,
-- em qual status esta, em c QUAL veiculo, e QUEM abriu (usuario).
-- PK apenas id_OS (unica), como decidido.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `oficina`.`OS` (
  `id_OS` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(25) NOT NULL,
  `valor` DECIMAL(10,2) NOT NULL,
  `status` VARCHAR(45) NOT NULL,
  `id_veiculo` INT NOT NULL,
  `usuario_id_usuario` INT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `update_at` DATETIME NOT NULL,
  `active` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_OS`),
  INDEX `fk_OS_veiculo1_idx` (`id_veiculo` ASC),
  INDEX `fk_OS_usuario1_idx` (`usuario_id_usuario` ASC),
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


-- =====================================================================
-- TABELA: mecanico
-- Quem executa o trabalho. O CPF e unico e NOT NULL.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `oficina`.`mecanico` (
  `id_mecanico` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(90) NOT NULL,
  `telefone` VARCHAR(14) NOT NULL,
  `cpf` VARCHAR(14) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `update_at` DATETIME NOT NULL,
  `active` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_mecanico`),
  UNIQUE INDEX `cpf_UNIQUE` (`cpf` ASC) )
ENGINE = InnoDB;


-- =====================================================================
-- TABELA: servico
-- Catalogo de servicos que a oficina oferece (ex: "Troca de oleo", 150.00).
-- id_servico AUTO_INCREMENT: a API nao precisa informar o id, o banco gera.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `oficina`.`servico` (
  `id_servico` INT NOT NULL AUTO_INCREMENT,
  `servico` VARCHAR(25) NOT NULL,
  `preco` DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `update_at` DATETIME NOT NULL,
  `active` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_servico`))
ENGINE = InnoDB;


-- =====================================================================
-- TABELA DE JUNCAO: OS_has_servico
-- Relacao N:N: uma OS pode ter VARIOS servicos, e um servico pode
-- aparecer em VARIAS OS. Cada linha = "esta OS contem este servico".
-- PK dupla porque a combinacao (OS, servico) e que precisa ser unica.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `oficina`.`OS_has_servico` (
  `OS_id_OS` INT NOT NULL,
  `servico_id_servico` INT NOT NULL,
  PRIMARY KEY (`OS_id_OS`, `servico_id_servico`),
  INDEX `fk_OS_has_servico_servico1_idx` (`servico_id_servico` ASC),
  INDEX `fk_OS_has_servico_OS1_idx` (`OS_id_OS` ASC),
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


-- =====================================================================
-- TABELA DE JUNCAO: mecanico_has_OS
-- Relacao N:N: um mecanico trabalha em varias OS, e uma OS pode ter
-- varios mecanicos. Como a OS agora tem PK unica (id_OS), a juncao
-- so precisa de 2 colunas.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `oficina`.`mecanico_has_OS` (
  `mecanico_id_mecanico` INT NOT NULL,
  `OS_id_OS` INT NOT NULL,
  PRIMARY KEY (`mecanico_id_mecanico`, `OS_id_OS`),
  INDEX `fk_mecanico_has_OS_OS1_idx` (`OS_id_OS` ASC),
  INDEX `fk_mecanico_has_OS_mecanico1_idx` (`mecanico_id_mecanico` ASC),
  CONSTRAINT `fk_mecanico_has_OS_mecanico1`
    FOREIGN KEY (`mecanico_id_mecanico`)
    REFERENCES `oficina`.`mecanico` (`id_mecanico`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_mecanico_has_OS_OS1`
    FOREIGN KEY (`OS_id_OS`)
    REFERENCES `oficina`.`OS` (`id_OS`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
