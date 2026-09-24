import { pool } from '../db';
import { hashCpf } from '../hash';

export interface DadosCliente {
  id_cliente: number;
  nome: string;
  telefone: string;
  cpf: string;
}

export async function listarClientes() {
  
  const [rows] = await pool.query(
    'SELECT id_cliente, nome, telefone, cpf, active FROM cliente WHERE active = 1'
  );
  return rows;
}

export async function criarCliente(dados: DadosCliente) {
  const cpfHash = hashCpf(dados.cpf);
  const [result] = await pool.query(
    `INSERT INTO cliente (id_cliente, nome, telefone, cpf, created_at, update_at, active)
     VALUES (?, ?, ?, ?, NOW(), NOW(), 1)`,
    [dados.id_cliente, dados.nome, dados.telefone, cpfHash]
  );
  return result;
}

export async function atualizarCliente(id: number, dados: Partial<DadosCliente>) {
  const cpfHash = dados.cpf ? hashCpf(dados.cpf) : null;
  const [result] = await pool.query(
    `UPDATE cliente
     SET nome = COALESCE(?, nome),
         telefone = COALESCE(?, telefone),
         cpf = COALESCE(?, cpf),
         update_at = NOW()
     WHERE id_cliente = ?`,
    [dados.nome ?? null, dados.telefone ?? null, cpfHash, id]
  );
  return result;
}

export async function removerCliente(id: number) {
  // "active = 0" em vez de DELETE de verdade, seguindo a coluna active do seu schema
  const [result] = await pool.query('UPDATE cliente SET active = 0 WHERE id_cliente = ?', [id]);
  return result;
}
