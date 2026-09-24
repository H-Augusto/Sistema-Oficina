import { pool } from '../db';
import { hashSenha } from '../hash';

export interface DadosUsuario {
  nome: string;
  senha: string; // texto puro recebido do formulário
  email: string;
}

export async function listarUsuarios() {
  const [rows] = await pool.query(
    'SELECT id_usuario, nome, email, active FROM usuario WHERE active = 1'
  );
  return rows;
}

export async function criarUsuario(dados: DadosUsuario) {
  const senhaHash = await hashSenha(dados.senha);
  const [result] = await pool.query(
    `INSERT INTO usuario (nome, senha_hash, email, created_at, update__at, active)
     VALUES (?, ?, ?, NOW(), NOW(), 1)`,
    [dados.nome, senhaHash, dados.email]
  );
  return result;
}
