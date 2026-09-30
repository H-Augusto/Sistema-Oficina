import { pool } from "../db";

export async function criarUsuario(dados: {
    nome: string,
    email: string,
    senhaHash: string
})
{
    const [result] = await pool.query(
        `insert into usuario (nome, email, senha, created_at, updated_at, active)
        values (?,?,?, NOW(), NOW(), 1)`,
        [dados.nome, dados.email, dados.senhaHash]

    );
    return result;
}

export async function criarCliente(dados: {
    nome: string,
    telefone: string,
    endereco: string,
    hashCpf: string,
    created_at: Date,
    update_at: Date,
    active: boolean
})
{
    const [result] = await pool.query(
        `insert into cliente (id_cliente, nome, telefone, endereco, cpf, created_at, update_at, active)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW(), 1)`,
        [dados.nome, dados.telefone, dados.endereco, dados.hashCpf]
    );
    return result;
}


export async function criarVeiculo(dados: {
        
        id_veiculo: number,
        marca: string,
        ano: string,
        placa: string,
        modelo: string,
        cor: string,
        created_at: Date,
        update_at: Date,
        active: boolean
    })

{
    const [result] = await pool.query(
        `insert into veiculo (id_veiculo, marca, ano, placa, modelo, cor, created_at, updated_at, active)
        Values (?, ?, ?, ?, ?, ?, NOW(), NOW(), 1)`,
        [dados.id_veiculo, dados.marca, dados.ano, dados.placa, dados.modelo, dados.cor]
    );
    return result;
}

export async function criarOs(dados: {
    nome: string,
    valor: number,
    created_at: Date,
    update_at: Date,
    status: string,
    id_veiculo: number,
    usuario_id_usuario: number
})

{
    const [result] = await pool.query(
        `insert into OS (nome, valor, created_at, updated_at, status, id_veiculo, usuario_id_usuario)
        values (?,?, NOW(), NOW(), ?)`,
        [dados.nome, dados.valor, dados.created_at, dados.update_at, dados.status, dados.id_veiculo, dados.usuario_id_usuario]
    );
    return result;
}

export async function criarMecanico(dados: {

        id_mecanico: number,
        nome: string,
        telefone: string
        created_at: Date,
        update_at: Date,
        active: boolean
    
    })
{
    const [result] = await pool.query(
        `insert into mecanico (id_mecanico, nome, telefone, created_at, updated_at, active)
        values (?, ?, ?, NOW(), NOW(), 1)`,
        [dados.id_mecanico, dados.nome, dados.telefone]

    );
    return result;
}

export async function criarServico(dados:{
    servico: string,
    preco: number,
    created_at: Date,
    update_at: Date,
    active: boolean

})

{
    const [result] = await pool.query(
        `insert into servico (servico, preco, created_at, updated_at, active)
        values (?, ?, NOW(), NOW(), 1)`,
        [dados.servico, dados.preco, dados.created_at, dados.update_at, dados.active]
    );
    return result;

}