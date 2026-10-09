// =====================================================================
// service.ts — CAMADA DE REGRA DE NEGOCIO
// ---------------------------------------------------------------------
// Responsabilidade AQUI: decidir o QUE fazer com os dados.
//   * transformar senha em hash (bcrypt) e CPF em hash (sha256)
//   * checar unicidade (email/placa/cpf ja cadastrados?)
//   * lancar ERRO de dominio quando algo impede a operacao
//
// PERCEBA que este arquivo NAO conhece Express, NAO escreve SQL e NAO
// manda resposta HTTP. Ele apenas executa regras e, quando algo esta
// errado, lanca um 'RegraNegocioErro' com um codigo. Quem traduz esse
// codigo para status HTTP (404, 409...) e o controller.
// =====================================================================
import { hashCpf, hashSenha } from '../hash';
import {
    criarCliente, buscarClientePorId, listarClientes, atualizarCliente,
    desativarCliente, cpfClienteExiste,
    criarUsuario, buscarUsuarioPorId, listarUsuarios, atualizarUsuario,
    desativarUsuario, emailUsuarioExiste,
    criarVeiculo, buscarVeiculoPorId, listarVeiculos, atualizarVeiculo,
    desativarVeiculo, placaVeiculoExiste,
    criarMecanico, buscarMecanicoPorId, listarMecanicos, atualizarMecanico,
    desativarMecanico, cpfMecanicoExiste,
    criarServico, buscarServicoPorId, listarServicos, atualizarServico,
    desativarServico,
    criarOs, buscarOsPorId, listarOs, atualizarOs, desativarOs, osExiste,
    listarServicosDaOs, adicionarServicoNaOs, removerServicoDaOs,
    listarMecanicosDaOs, atribuirMecanicoNaOs, removerMecanicoDaOs,
} from '../repository/repository';
import { ClienteInput, UsuarioInput, VeiculoInput, MecanicoInput, ServicoInput, OsInput } from '../schemas';

// ---------------------------------------------------------------------
// Erro de regra de negocio.
// 'novo' e um metodo estatico: cria a instancia sem 'new' do lado de
// fora (facil de lembrar e de tipar).
// ---------------------------------------------------------------------
export class RegraNegocioErro extends Error {
    constructor(
        public readonly codigo: 'NAO_ENCONTRADO' | 'JA_CADASTRADO' | 'CONFLITO_RELACAO',
        message: string
    ) {
        super(message); // 'super' passa a mensagem para a classe 'Error'
        this.name = 'RegraNegocioErro';
    }
    static naoEncontrado(mensagem: string) {
        return new RegraNegocioErro('NAO_ENCONTRADO', mensagem);
    }
    static jaCadastrado(mensagem: string) {
        return new RegraNegocioErro('JA_CADASTRADO', mensagem);
    }
}


// =====================================================================
// CLIENTE
// =====================================================================
export async function listarTodosClientes() {
    return listarClientes(); // sem regra extra: direto ao repository
}

export async function buscarUmCliente(id: number) {
    const cliente = await buscarClientePorId(id);
    if (!cliente) throw RegraNegocioErro.naoEncontrado('Cliente nao encontrado');
    return cliente;
}

export async function cadastrarCliente(dados: ClienteInput) {
    const hash = hashCpf(dados.cpf); // CPF vira hash antes de ir ao banco
    if (await cpfClienteExiste(hash)) {
        throw RegraNegocioErro.jaCadastrado('CPF ja cadastrado');
    }
    await criarCliente({
        nome: dados.nome, telefone: dados.telefone,
        endereco: dados.endereco, hashCpf: hash,
    });
    return { mensagem: 'Cliente criado com sucesso' };
}

export async function editarCliente(id: number, dados: ClienteInput) {
    // ORDEM IMPORTANTE: primeiro checo se o cliente existe (404),
    // so DEPOIS a unicidade do CPF (409). Se inverter, um PUT para um
    // id inexistente poderia responder 409 em vez do 404 correto.
    if (!(await buscarClientePorId(id))) {
        throw RegraNegocioErro.naoEncontrado('Cliente nao encontrado');
    }
    const hash = hashCpf(dados.cpf);
    if (await cpfClienteExiste(hash, id)) {
        throw RegraNegocioErro.jaCadastrado('CPF ja pertence a outro cliente');
    }
    await atualizarCliente(id, {
        nome: dados.nome, telefone: dados.telefone,
        endereco: dados.endereco, hashCpf: hash,
    });
    return { mensagem: 'Cliente atualizado com sucesso' };
}

export async function desativarUmCliente(id: number) {
    const resultado = await desativarCliente(id);
    if (resultado.affectedRows === 0) {
        throw RegraNegocioErro.naoEncontrado('Cliente nao encontrado');
    }
    return { mensagem: 'Cliente desativado com sucesso' };
}


// =====================================================================
// USUARIO
// =====================================================================
export async function listarTodosUsuarios() {
    return listarUsuarios();
}

export async function buscarUmUsuario(id: number) {
    const usuario = await buscarUsuarioPorId(id);
    if (!usuario) throw RegraNegocioErro.naoEncontrado('Usuario nao encontrado');
    return usuario;
}

export async function cadastrarUsuario(dados: UsuarioInput) {
    if (await emailUsuarioExiste(dados.email)) {
        throw RegraNegocioErro.jaCadastrado('Email ja cadastrado');
    }
    const senhaHash = await hashSenha(dados.senha); // senha NUNCA vai limpa
    await criarUsuario({ nome: dados.nome, email: dados.email, senhaHash });
    return { mensagem: 'Usuario criado com sucesso' };
}

export async function editarUsuario(id: number, dados: UsuarioInput & { senha?: string }) {
    // 404 (existe?) antes de 409 (unicidade) — mesma ordem do cliente
    if (!(await buscarUsuarioPorId(id))) {
        throw RegraNegocioErro.naoEncontrado('Usuario nao encontrado');
    }
    if (await emailUsuarioExiste(dados.email, id)) {
        throw RegraNegocioErro.jaCadastrado('Email ja pertence a outro usuario');
    }
    const senhaHash = dados.senha ? await hashSenha(dados.senha) : undefined;
    await atualizarUsuario(id, {
        nome: dados.nome, email: dados.email, senhaHash,
    });
    return { mensagem: 'Usuario atualizado com sucesso' };
}

export async function desativarUmUsuario(id: number) {
    const resultado = await desativarUsuario(id);
    if (resultado.affectedRows === 0) {
        throw RegraNegocioErro.naoEncontrado('Usuario nao encontrado');
    }
    return { mensagem: 'Usuario desativado com sucesso' };
}


// =====================================================================
// VEICULO
// =====================================================================
export async function listarTodosVeiculos() {
    return listarVeiculos();
}

export async function buscarUmVeiculo(id: number) {
    const veiculo = await buscarVeiculoPorId(id);
    if (!veiculo) throw RegraNegocioErro.naoEncontrado('Veiculo nao encontrado');
    return veiculo;
}

export async function cadastrarVeiculo(dados: VeiculoInput) {
    // REGRA: o dono do veiculo precisa existir e estar ativo.
    // Sem isso, o banco devolveria erro de FK feio (ER_NO_REFERENCED_ROW).
    const dono = await buscarClientePorId(dados.clienteId);
    if (!dono) throw RegraNegocioErro.naoEncontrado('Cliente dono do veiculo nao encontrado');
    if (await placaVeiculoExiste(dados.placa)) {
        throw RegraNegocioErro.jaCadastrado('Placa ja cadastrada');
    }
    await criarVeiculo(dados);
    return { mensagem: 'Veiculo criado com sucesso' };
}

export async function editarVeiculo(id: number, dados: VeiculoInput) {
    // 404 (existe?) antes de 409 (unicidade) — mesma ordem dos demais
    if (!(await buscarVeiculoPorId(id))) {
        throw RegraNegocioErro.naoEncontrado('Veiculo nao encontrado');
    }
    const dono = await buscarClientePorId(dados.clienteId);
    if (!dono) throw RegraNegocioErro.naoEncontrado('Cliente dono do veiculo nao encontrado');
    if (await placaVeiculoExiste(dados.placa, id)) {
        throw RegraNegocioErro.jaCadastrado('Placa ja pertence a outro veiculo');
    }
    await atualizarVeiculo(id, dados);
    return { mensagem: 'Veiculo atualizado com sucesso' };
}

export async function desativarUmVeiculo(id: number) {
    const resultado = await desativarVeiculo(id);
    if (resultado.affectedRows === 0) {
        throw RegraNegocioErro.naoEncontrado('Veiculo nao encontrado');
    }
    return { mensagem: 'Veiculo desativado com sucesso' };
}


// =====================================================================
// MECANICO
// =====================================================================
export async function listarTodosMecanicos() {
    return listarMecanicos();
}

export async function buscarUmMecanico(id: number) {
    const mecanico = await buscarMecanicoPorId(id);
    if (!mecanico) throw RegraNegocioErro.naoEncontrado('Mecanico nao encontrado');
    return mecanico;
}

export async function cadastrarMecanico(dados: MecanicoInput) {
    if (await cpfMecanicoExiste(dados.cpf)) {
        throw RegraNegocioErro.jaCadastrado('CPF ja cadastrado');
    }
    await criarMecanico(dados);
    return { mensagem: 'Mecanico criado com sucesso' };
}

export async function editarMecanico(id: number, dados: MecanicoInput) {
    // 404 (existe?) antes de 409 (unicidade) — mesma ordem dos demais
    if (!(await buscarMecanicoPorId(id))) {
        throw RegraNegocioErro.naoEncontrado('Mecanico nao encontrado');
    }
    if (await cpfMecanicoExiste(dados.cpf, id)) {
        throw RegraNegocioErro.jaCadastrado('CPF ja pertence a outro mecanico');
    }
    await atualizarMecanico(id, dados);
    return { mensagem: 'Mecanico atualizado com sucesso' };
}

export async function desativarUmMecanico(id: number) {
    const resultado = await desativarMecanico(id);
    if (resultado.affectedRows === 0) {
        throw RegraNegocioErro.naoEncontrado('Mecanico nao encontrado');
    }
    return { mensagem: 'Mecanico desativado com sucesso' };
}


// =====================================================================
// SERVICO
// =====================================================================
export async function listarTodosServicos() {
    return listarServicos();
}

export async function buscarUmServico(id: number) {
    const servico = await buscarServicoPorId(id);
    if (!servico) throw RegraNegocioErro.naoEncontrado('Servico nao encontrado');
    return servico;
}

export async function cadastrarServico(dados: ServicoInput) {
    await criarServico(dados);
    return { mensagem: 'Servico criado com sucesso' };
}

export async function editarServico(id: number, dados: ServicoInput) {
    const resultado = await atualizarServico(id, dados);
    if (resultado.affectedRows === 0) {
        throw RegraNegocioErro.naoEncontrado('Servico nao encontrado');
    }
    return { mensagem: 'Servico atualizado com sucesso' };
}

export async function desativarUmServico(id: number) {
    const resultado = await desativarServico(id);
    if (resultado.affectedRows === 0) {
        throw RegraNegocioErro.naoEncontrado('Servico nao encontrado');
    }
    return { mensagem: 'Servico desativado com sucesso' };
}


// =====================================================================
// OS (Ordem de Servico)
// =====================================================================
export async function listarTodasOs() {
    return listarOs();
}

export async function buscarUmaOs(id: number) {
    const os = await buscarOsPorId(id);
    if (!os) throw RegraNegocioErro.naoEncontrado('OS nao encontrada');
    return os;
}

export async function cadastrarOs(dados: OsInput) {
    // REGRA: veiculo e usuario da OS precisam existir (senao o banco
    // reclamaria do FK com um erro tecnico que o usuario nao entenderia)
    const veiculo = await buscarVeiculoPorId(dados.idVeiculo);
    if (!veiculo) throw RegraNegocioErro.naoEncontrado('Veiculo nao encontrado');
    const usuario = await buscarUsuarioPorId(dados.idUsuario);
    if (!usuario) throw RegraNegocioErro.naoEncontrado('Usuario nao encontrado');
    await criarOs(dados);
    return { mensagem: 'OS criada com sucesso' };
}

export async function editarOs(id: number, dados: OsInput) {
    const veiculo = await buscarVeiculoPorId(dados.idVeiculo);
    if (!veiculo) throw RegraNegocioErro.naoEncontrado('Veiculo nao encontrado');
    const usuario = await buscarUsuarioPorId(dados.idUsuario);
    if (!usuario) throw RegraNegocioErro.naoEncontrado('Usuario nao encontrado');
    const resultado = await atualizarOs(id, dados);
    if (resultado.affectedRows === 0) {
        throw RegraNegocioErro.naoEncontrado('OS nao encontrada');
    }
    return { mensagem: 'OS atualizada com sucesso' };
}

export async function desativarUmaOs(id: number) {
    const resultado = await desativarOs(id);
    if (resultado.affectedRows === 0) {
        throw RegraNegocioErro.naoEncontrado('OS nao encontrada');
    }
    return { mensagem: 'OS desativada com sucesso' };
}


// =====================================================================
// RELACOES DA OS (servicos e mecanicos vinculados)
// =====================================================================
export async function servicosDeUmaOs(idOs: number) {
    if (!(await osExiste(idOs))) throw RegraNegocioErro.naoEncontrado('OS nao encontrada');
    return listarServicosDaOs(idOs);
}

export async function adicionarServicoAos(idOs: number, idServico: number) {
    if (!(await osExiste(idOs))) throw RegraNegocioErro.naoEncontrado('OS nao encontrada');
    if (!(await buscarServicoPorId(idServico))) {
        throw RegraNegocioErro.naoEncontrado('Servico nao encontrado');
    }
    try {
        await adicionarServicoNaOs(idOs, idServico);
    } catch (erro: any) {
        // ER_DUP_ENTRY = ja existe esse par (OS, servico) na juncao
        if (erro.code === 'ER_DUP_ENTRY') {
            throw RegraNegocioErro.jaCadastrado('Servico ja vinculado a esta OS');
        }
        throw erro;
    }
    return { mensagem: 'Servico vinculado a OS' };
}

export async function removerServicoDaOsService(idOs: number, idServico: number) {
    const resultado = await removerServicoDaOs(idOs, idServico);
    if (resultado.affectedRows === 0) {
        throw RegraNegocioErro.naoEncontrado('Vinculo OS x servico nao encontrado');
    }
    return { mensagem: 'Servico removido da OS' };
}

export async function mecanicosDeUmaOs(idOs: number) {
    if (!(await osExiste(idOs))) throw RegraNegocioErro.naoEncontrado('OS nao encontrada');
    return listarMecanicosDaOs(idOs);
}

export async function atribuirMecanicoAos(idOs: number, idMecanico: number) {
    if (!(await osExiste(idOs))) throw RegraNegocioErro.naoEncontrado('OS nao encontrada');
    if (!(await buscarMecanicoPorId(idMecanico))) {
        throw RegraNegocioErro.naoEncontrado('Mecanico nao encontrado');
    }
    try {
        await atribuirMecanicoNaOs(idOs, idMecanico);
    } catch (erro: any) {
        if (erro.code === 'ER_DUP_ENTRY') {
            throw RegraNegocioErro.jaCadastrado('Mecanico ja vinculado a esta OS');
        }
        throw erro;
    }
    return { mensagem: 'Mecanico vinculado a OS' };
}

export async function removerMecanicoDaOsService(idOs: number, idMecanico: number) {
    const resultado = await removerMecanicoDaOs(idOs, idMecanico);
    if (resultado.affectedRows === 0) {
        throw RegraNegocioErro.naoEncontrado('Vinculo OS x mecanico nao encontrado');
    }
    return { mensagem: 'Mecanico removido da OS' };
}
