// =====================================================================
// repository.ts — CAMADA DE ACESSO A DADOS (a unica que fala SQL)
// ---------------------------------------------------------------------
// Responsabilidade AQUI: apenas buscar/escrever dados no MySQL.
// Nao existe regra de negocio, nem hash, nem Request/Response.
//
// REGRA DE OURO DESTA CAMADA:
//  * Query params ( ? ) sempre, NUNCA concatenar string na query.
//    Se eu fizesse `"...WHERE id = " + id`, um atacante poderia mandar
//    id = "1 OR 1=1" e listar tudo (SQL Injection). Com '?', o banco
//    trata o valor como DADO, nao como pedaco de comando.
//  * O numero de '?' e o de valores andam juntos: eu monto as duas
//    listas (colunas e valores) e uso espalhamento ( ...valores ).
// =====================================================================
import { pool } from '../db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// ---------------------------------------------------------------------
// CLIENTE
// ---------------------------------------------------------------------
export async function listarClientes(): Promise<RowDataPacket[]> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT id_cliente, nome, telefone, endereco, cpf
         FROM cliente WHERE active = 1`
    );
    return linhas;
}

export async function buscarClientePorId(id: number): Promise<RowDataPacket | null> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT id_cliente, nome, telefone, endereco, cpf
         FROM cliente WHERE id_cliente = ? AND active = 1`,
        [id]
    );
    return linhas[0] ?? null; // ?? null: se nao achar, devolve null e nao undefined
}

export async function criarCliente(dados: {
    nome: string; telefone: string; endereco: string; hashCpf: string;
}): Promise<ResultSetHeader> {
    // Note que NAO passo id_cliente: o banco gera (AUTO_INCREMENT).
    const [resultado] = await pool.query<ResultSetHeader>(
        `INSERT INTO cliente (nome, telefone, endereco, cpf, created_at, update_at, active)
         VALUES (?, ?, ?, ?, NOW(), NOW(), 1)`,
        [dados.nome, dados.telefone, dados.endereco, dados.hashCpf]
    );
    return resultado;
}

export async function atualizarCliente(id: number, dados: {
    nome: string; telefone: string; endereco: string; hashCpf: string;
}): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `UPDATE cliente
         SET nome = ?, telefone = ?, endereco = ?, cpf = ?, update_at = NOW()
         WHERE id_cliente = ? AND active = 1`,
        [dados.nome, dados.telefone, dados.endereco, dados.hashCpf, id]
    );
    return resultado; // caller checa affectedRows para saber se achou
}

export async function desativarCliente(id: number): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `UPDATE cliente SET active = 0, update_at = NOW()
         WHERE id_cliente = ? AND active = 1`,
        [id]
    );
    return resultado;
}

export async function cpfClienteExiste(hashCpf: string, idIgnorar?: number): Promise<boolean> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM cliente WHERE cpf = ?${idIgnorar ? ' AND id_cliente != ?' : ''} LIMIT 1`,
        idIgnorar ? [hashCpf, idIgnorar] : [hashCpf]
    );
    return linhas.length > 0;
}


// ---------------------------------------------------------------------
// USUARIO
// ---------------------------------------------------------------------
export async function listarUsuarios(): Promise<RowDataPacket[]> {
    // PERCEBA: a coluna 'senha' NAO esta no SELECT. O hash da senha
    // nunca deve sair da API — nem listando, nem num get por id.
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT id_usuario, nome, email FROM usuario WHERE active = 1`
    );
    return linhas;
}

export async function buscarUsuarioPorId(id: number): Promise<RowDataPacket | null> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT id_usuario, nome, email FROM usuario WHERE id_usuario = ? AND active = 1`,
        [id]
    );
    return linhas[0] ?? null;
}

// Busca usuario pelo email INCLUSIVE a senha (hash).
// Uso EXCLUSIVO do login: aqui precisamos do hash para comparar com a
// senha digitada. Fora do login, a senha jamais deve ser selecionada.
export async function buscarUsuarioParaLogin(email: string): Promise<RowDataPacket | null> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT id_usuario, nome, email, senha FROM usuario WHERE email = ? AND active = 1 LIMIT 1`,
        [email]
    );
    return linhas[0] ?? null;
}

export async function criarUsuario(dados: {
    nome: string; email: string; senhaHash: string;
}): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `INSERT INTO usuario (nome, email, senha, created_at, update_at, active)
         VALUES (?, ?, ?, NOW(), NOW(), 1)`,
        [dados.nome, dados.email, dados.senhaHash]
    );
    return resultado;
}

export async function atualizarUsuario(id: number, dados: {
    nome: string; email: string; senhaHash?: string; // senha opcional
}): Promise<ResultSetHeader> {
    // Se 'senhaHash' veio, atualiza a senha; senao, mantem a atual.
    const [resultado] = await pool.query<ResultSetHeader>(
        `UPDATE usuario
         SET nome = ?, email = ?, senha = COALESCE(?, senha), update_at = NOW()
         WHERE id_usuario = ? AND active = 1`,
        [dados.nome, dados.email, dados.senhaHash ?? null, id]
    );
    return resultado;
}

export async function desativarUsuario(id: number): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `UPDATE usuario SET active = 0, update_at = NOW()
         WHERE id_usuario = ? AND active = 1`,
        [id]
    );
    return resultado;
}

export async function emailUsuarioExiste(email: string, idIgnorar?: number): Promise<boolean> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM usuario WHERE email = ?${idIgnorar ? ' AND id_usuario != ?' : ''} LIMIT 1`,
        idIgnorar ? [email, idIgnorar] : [email]
    );
    return linhas.length > 0;
}


// ---------------------------------------------------------------------
// VEICULO
// ---------------------------------------------------------------------
export async function listarVeiculos(): Promise<RowDataPacket[]> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT id_veiculo, marca, modelo, ano, placa, cor, cliente_id_cliente
         FROM veiculo WHERE active = 1`
    );
    return linhas;
}

export async function buscarVeiculoPorId(id: number): Promise<RowDataPacket | null> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT id_veiculo, marca, modelo, ano, placa, cor, cliente_id_cliente
         FROM veiculo WHERE id_veiculo = ? AND active = 1`,
        [id]
    );
    return linhas[0] ?? null;
}

export async function criarVeiculo(dados: {
    marca: string; modelo: string; ano: number; placa: string; cor: string; clienteId: number;
}): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `INSERT INTO veiculo (marca, modelo, ano, placa, cor, cliente_id_cliente, created_at, update_at, active)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), 1)`,
        [dados.marca, dados.modelo, dados.ano, dados.placa, dados.cor, dados.clienteId]
    );
    return resultado;
}

export async function atualizarVeiculo(id: number, dados: {
    marca: string; modelo: string; ano: number; placa: string; cor: string; clienteId: number;
}): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `UPDATE veiculo
         SET marca = ?, modelo = ?, ano = ?, placa = ?, cor = ?, cliente_id_cliente = ?, update_at = NOW()
         WHERE id_veiculo = ? AND active = 1`,
        [dados.marca, dados.modelo, dados.ano, dados.placa, dados.cor, dados.clienteId, id]
    );
    return resultado;
}

export async function desativarVeiculo(id: number): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `UPDATE veiculo SET active = 0, update_at = NOW()
         WHERE id_veiculo = ? AND active = 1`,
        [id]
    );
    return resultado;
}

export async function placaVeiculoExiste(placa: string, idIgnorar?: number): Promise<boolean> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM veiculo WHERE placa = ?${idIgnorar ? ' AND id_veiculo != ?' : ''} LIMIT 1`,
        idIgnorar ? [placa, idIgnorar] : [placa]
    );
    return linhas.length > 0;
}


// ---------------------------------------------------------------------
// MECANICO
// ---------------------------------------------------------------------
export async function listarMecanicos(): Promise<RowDataPacket[]> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT id_mecanico, nome, telefone FROM mecanico WHERE active = 1`
    );
    return linhas;
}

export async function buscarMecanicoPorId(id: number): Promise<RowDataPacket | null> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT id_mecanico, nome, telefone FROM mecanico WHERE id_mecanico = ? AND active = 1`,
        [id]
    );
    return linhas[0] ?? null;
}

export async function criarMecanico(dados: { nome: string; telefone: string; cpf: string; }): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `INSERT INTO mecanico (nome, telefone, cpf, created_at, update_at, active)
         VALUES (?, ?, ?, NOW(), NOW(), 1)`,
        [dados.nome, dados.telefone, dados.cpf]
    );
    return resultado;
}

export async function atualizarMecanico(id: number, dados: { nome: string; telefone: string; cpf: string; }): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `UPDATE mecanico
         SET nome = ?, telefone = ?, cpf = ?, update_at = NOW()
         WHERE id_mecanico = ? AND active = 1`,
        [dados.nome, dados.telefone, dados.cpf, id]
    );
    return resultado;
}

export async function desativarMecanico(id: number): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `UPDATE mecanico SET active = 0, update_at = NOW()
         WHERE id_mecanico = ? AND active = 1`,
        [id]
    );
    return resultado;
}

export async function cpfMecanicoExiste(cpf: string, idIgnorar?: number): Promise<boolean> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM mecanico WHERE cpf = ?${idIgnorar ? ' AND id_mecanico != ?' : ''} LIMIT 1`,
        idIgnorar ? [cpf, idIgnorar] : [cpf]
    );
    return linhas.length > 0;
}


// ---------------------------------------------------------------------
// SERVICO
// ---------------------------------------------------------------------
export async function listarServicos(): Promise<RowDataPacket[]> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT id_servico, servico, preco FROM servico WHERE active = 1`
    );
    return linhas;
}

export async function buscarServicoPorId(id: number): Promise<RowDataPacket | null> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT id_servico, servico, preco FROM servico WHERE id_servico = ? AND active = 1`,
        [id]
    );
    return linhas[0] ?? null;
}

export async function criarServico(dados: { servico: string; preco: number; }): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `INSERT INTO servico (servico, preco, created_at, update_at, active)
         VALUES (?, ?, NOW(), NOW(), 1)`,
        [dados.servico, dados.preco]
    );
    return resultado;
}

export async function atualizarServico(id: number, dados: { servico: string; preco: number; }): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `UPDATE servico SET servico = ?, preco = ?, update_at = NOW()
         WHERE id_servico = ? AND active = 1`,
        [dados.servico, dados.preco, id]
    );
    return resultado;
}

export async function desativarServico(id: number): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `UPDATE servico SET active = 0, update_at = NOW()
         WHERE id_servico = ? AND active = 1`,
        [id]
    );
    return resultado;
}


// ---------------------------------------------------------------------
// OS (Ordem de Servico)
// O SELECT usa JOIN para trazer junto o nome do veiculo e do usuario que
// abriu a OS — assim o front nao precisa fazer varias chamadas.
// ---------------------------------------------------------------------
export async function listarOs(): Promise<RowDataPacket[]> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT o.id_OS, o.nome, o.valor, o.status,
                o.id_veiculo, v.placa AS veiculo_placa,
                o.usuario_id_usuario, u.nome AS usuario_nome
         FROM OS o
         JOIN veiculo v ON v.id_veiculo = o.id_veiculo
         JOIN usuario u ON u.id_usuario = o.usuario_id_usuario
         WHERE o.active = 1`
    );
    return linhas;
}

export async function buscarOsPorId(id: number): Promise<RowDataPacket | null> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT o.id_OS, o.nome, o.valor, o.status,
                o.id_veiculo, v.placa AS veiculo_placa,
                o.usuario_id_usuario, u.nome AS usuario_nome
         FROM OS o
         JOIN veiculo v ON v.id_veiculo = o.id_veiculo
         JOIN usuario u ON u.id_usuario = o.usuario_id_usuario
         WHERE o.id_OS = ? AND o.active = 1`,
        [id]
    );
    return linhas[0] ?? null;
}

export async function criarOs(dados: {
    nome: string; valor: number; status: string; idVeiculo: number; idUsuario: number;
}): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `INSERT INTO OS (nome, valor, status, id_veiculo, usuario_id_usuario, created_at, update_at, active)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW(), 1)`,
        [dados.nome, dados.valor, dados.status, dados.idVeiculo, dados.idUsuario]
    );
    return resultado;
}

export async function atualizarOs(id: number, dados: {
    nome: string; valor: number; status: string; idVeiculo: number; idUsuario: number;
}): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `UPDATE OS
         SET nome = ?, valor = ?, status = ?, id_veiculo = ?, usuario_id_usuario = ?, update_at = NOW()
         WHERE id_OS = ? AND active = 1`,
        [dados.nome, dados.valor, dados.status, dados.idVeiculo, dados.idUsuario, id]
    );
    return resultado;
}

export async function desativarOs(id: number): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `UPDATE OS SET active = 0, update_at = NOW() WHERE id_OS = ? AND active = 1`,
        [id]
    );
    return resultado;
}

export async function osExiste(id: number): Promise<boolean> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM OS WHERE id_OS = ? AND active = 1 LIMIT 1`, [id]
    );
    return linhas.length > 0;
}


// ---------------------------------------------------------------------
// TABELAS DE JUNCAO (relacoes N:N)
// ---------------------------------------------------------------------
// Quais servicos pertencem a uma OS especifica
export async function listarServicosDaOs(idOs: number): Promise<RowDataPacket[]> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT s.id_servico, s.servico, s.preco
         FROM servico s
         JOIN OS_has_servico os ON os.servico_id_servico = s.id_servico
         WHERE os.OS_id_OS = ? AND s.active = 1`,
        [idOs]
    );
    return linhas;
}

export async function adicionarServicoNaOs(idOs: number, idServico: number): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `INSERT INTO OS_has_servico (OS_id_OS, servico_id_servico) VALUES (?, ?)`,
        [idOs, idServico]
    );
    return resultado;
}

export async function removerServicoDaOs(idOs: number, idServico: number): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `DELETE FROM OS_has_servico WHERE OS_id_OS = ? AND servico_id_servico = ?`,
        [idOs, idServico]
    );
    return resultado;
}

// Quais mecanicos estao atribuidos a uma OS
export async function listarMecanicosDaOs(idOs: number): Promise<RowDataPacket[]> {
    const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT m.id_mecanico, m.nome, m.telefone
         FROM mecanico m
         JOIN mecanico_has_OS mo ON mo.mecanico_id_mecanico = m.id_mecanico
         WHERE mo.OS_id_OS = ? AND m.active = 1`,
        [idOs]
    );
    return linhas;
}

export async function atribuirMecanicoNaOs(idOs: number, idMecanico: number): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `INSERT INTO mecanico_has_OS (mecanico_id_mecanico, OS_id_OS) VALUES (?, ?)`,
        [idMecanico, idOs]
    );
    return resultado;
}

export async function removerMecanicoDaOs(idOs: number, idMecanico: number): Promise<ResultSetHeader> {
    const [resultado] = await pool.query<ResultSetHeader>(
        `DELETE FROM mecanico_has_OS WHERE OS_id_OS = ? AND mecanico_id_mecanico = ?`,
        [idOs, idMecanico]
    );
    return resultado;
}
