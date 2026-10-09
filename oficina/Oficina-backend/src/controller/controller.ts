// =====================================================================
// controller.ts — CAMADA HTTP (ponte entre a requisicao e o service)
// ---------------------------------------------------------------------
// Responsabilidade AQUI (e so isto):
//   1. ler os dados do pedido (req.params / req.body)
//   2. chamar o service correspondente
//   3. traduzir o resultado em codigo HTTP (200, 201, 404, 409...)
//
// O controller NAO escreve SQL e NAO tem regra de negocio. Ele tambem
// nao repete try/catch em toda funcao: usamos o 'asyncHandler' abaixo
// para capturar erro de UM lugar so.
// =====================================================================
import { Request, Response, NextFunction } from 'express';
import {
    RegraNegocioErro,
    listarTodosClientes, buscarUmCliente, cadastrarCliente, editarCliente, desativarUmCliente,
    listarTodosUsuarios, buscarUmUsuario, cadastrarUsuario, editarUsuario, desativarUmUsuario,
    listarTodosVeiculos, buscarUmVeiculo, cadastrarVeiculo, editarVeiculo, desativarUmVeiculo,
    listarTodosMecanicos, buscarUmMecanico, cadastrarMecanico, editarMecanico, desativarUmMecanico,
    listarTodosServicos, buscarUmServico, cadastrarServico, editarServico, desativarUmServico,
    listarTodasOs, buscarUmaOs, cadastrarOs, editarOs, desativarUmaOs,
    servicosDeUmaOs, adicionarServicoAos, removerServicoDaOsService,
    mecanicosDeUmaOs, atribuirMecanicoAos, removerMecanicoDaOsService,
} from '../service/service';
import { clienteSchema, usuarioSchema, veiculoSchema, mecanicoSchema, servicoSchema, osSchema, osServicoSchema, osMecanicoSchema } from '../schemas';

// ---------------------------------------------------------------------
// asyncHandler: embrulha um handler async.
// Se o handler lancar um erro (inclusive a Promise rejeitar), em vez de
// o Express "engolir" o erro e a requisicao ficar pendurada para sempre,
// o erro e repassado ao 'next', que aciona o middleware de erro la em
// baixo (app.ts). Evita escrever try/catch em dezenas de funcoes.
// ---------------------------------------------------------------------
type Handler = (req: Request, res: Response, next: NextFunction) => Promise<any>;
const asyncHandler = (funcao: Handler): Handler =>
    (req, res, next) => funcao(req, res, next).catch(next);

// ---------------------------------------------------------------------
// Validador: roda o schema do Zod no req.body.
// Se invalido, ja responde 400 com a lista de problemas e PARA ai.
// Se valido, substitui req.body pela versao "limpa" e tipada que o
// Zod gerou (com defaults e transforms aplicados).
// ---------------------------------------------------------------------
function validar(schema: { parse: (dados: unknown) => any }) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (erro: any) {
            // erro.issues vem do Zod: lista de { path, message }
            // (no Zod v4 a propriedade e 'issues'; no v3 era 'errors')
            res.status(400).json({
                mensagem: 'Dados invalidos',
                detalhes: erro.issues?.map((e: any) => `${e.path.join('.')}: ${e.message}`),
            });
        }
    };
}

// Le um id da URL e garante que e numero positivo.
// req.params SEMPRE chega como string ("/cliente/abc" -> "abc").
function idDaRota(req: Request, res: Response): number | null {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ mensagem: 'Id invalido' });
        return null;
    }
    return id;
}


// =====================================================================
// CLIENTE
// =====================================================================
export const clienteController = {
    listar: asyncHandler(async (req, res) => {
        res.status(200).json(await listarTodosClientes());
    }),

    buscar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await buscarUmCliente(id));
    }),

    criar: asyncHandler(async (req, res) => {
        const resultado = await cadastrarCliente(req.body);
        res.status(201).json(resultado);
    }),

    atualizar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await editarCliente(id, req.body));
    }),

    desativar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await desativarUmCliente(id));
    }),
};

// ---------------------------------------------------------------------
// Exportamos tambem os MIDDLEWARES de validacao para cada entidade.
// Uma funcao 'validar' por rota (padrao do Express: 1o arg = middleware).
// ---------------------------------------------------------------------
export const validarCliente = validar(clienteSchema);
export const validarUsuario = validar(usuarioSchema);
export const validarVeiculo = validar(veiculoSchema);
export const validarMecanico = validar(mecanicoSchema);
export const validarServico = validar(servicoSchema);
export const validarOs = validar(osSchema);
export const validarOsServico = validar(osServicoSchema);
export const validarOsMecanico = validar(osMecanicoSchema);


// =====================================================================
// USUARIO
// =====================================================================
export const usuarioController = {
    listar: asyncHandler(async (req, res) => {
        res.status(200).json(await listarTodosUsuarios());
    }),

    buscar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await buscarUmUsuario(id));
    }),

    criar: asyncHandler(async (req, res) => {
        res.status(201).json(await cadastrarUsuario(req.body));
    }),

    atualizar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await editarUsuario(id, req.body));
    }),

    desativar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await desativarUmUsuario(id));
    }),
};


// =====================================================================
// VEICULO
// =====================================================================
export const veiculoController = {
    listar: asyncHandler(async (req, res) => {
        res.status(200).json(await listarTodosVeiculos());
    }),

    buscar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await buscarUmVeiculo(id));
    }),

    criar: asyncHandler(async (req, res) => {
        res.status(201).json(await cadastrarVeiculo(req.body));
    }),

    atualizar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await editarVeiculo(id, req.body));
    }),

    desativar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await desativarUmVeiculo(id));
    }),
};


// =====================================================================
// MECANICO
// =====================================================================
export const mecanicoController = {
    listar: asyncHandler(async (req, res) => {
        res.status(200).json(await listarTodosMecanicos());
    }),

    buscar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await buscarUmMecanico(id));
    }),

    criar: asyncHandler(async (req, res) => {
        res.status(201).json(await cadastrarMecanico(req.body));
    }),

    atualizar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await editarMecanico(id, req.body));
    }),

    desativar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await desativarUmMecanico(id));
    }),
};


// =====================================================================
// SERVICO
// =====================================================================
export const servicoController = {
    listar: asyncHandler(async (req, res) => {
        res.status(200).json(await listarTodosServicos());
    }),

    buscar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await buscarUmServico(id));
    }),

    criar: asyncHandler(async (req, res) => {
        res.status(201).json(await cadastrarServico(req.body));
    }),

    atualizar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await editarServico(id, req.body));
    }),

    desativar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await desativarUmServico(id));
    }),
};


// =====================================================================
// OS (Ordem de Servico) + suas relacoes
// =====================================================================
export const osController = {
    listar: asyncHandler(async (req, res) => {
        res.status(200).json(await listarTodasOs());
    }),

    buscar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await buscarUmaOs(id));
    }),

    criar: asyncHandler(async (req, res) => {
        res.status(201).json(await cadastrarOs(req.body));
    }),

    atualizar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await editarOs(id, req.body));
    }),

    desativar: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await desativarUmaOs(id));
    }),

    // ---- relacao OS x servico ----
    listarServicos: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await servicosDeUmaOs(id));
    }),

    adicionarServico: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(201).json(await adicionarServicoAos(id, req.body.idServico));
    }),

    removerServico: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        const idServico = Number(req.params.idServico);
        if (!Number.isInteger(idServico) || idServico <= 0) {
            return res.status(400).json({ mensagem: 'Id de servico invalido' });
        }
        res.status(200).json(await removerServicoDaOsService(id, idServico));
    }),

    // ---- relacao OS x mecanico ----
    listarMecanicos: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(200).json(await mecanicosDeUmaOs(id));
    }),

    adicionarMecanico: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        res.status(201).json(await atribuirMecanicoAos(id, req.body.idMecanico));
    }),

    removerMecanico: asyncHandler(async (req, res) => {
        const id = idDaRota(req, res);
        if (id === null) return;
        const idMecanico = Number(req.params.idMecanico);
        if (!Number.isInteger(idMecanico) || idMecanico <= 0) {
            return res.status(400).json({ mensagem: 'Id de mecanico invalido' });
        }
        res.status(200).json(await removerMecanicoDaOsService(id, idMecanico));
    }),
};


// ---------------------------------------------------------------------
// MIDDLEWARE DE ERRO (o "coletor" final).
// Qualquer erro que escape de um handler (via asyncHandler/next) chega
// AQUI. Traduzimos o codigo de dominio para status HTTP:
//   NAO_ENCONTRADO -> 404
//   JA_CADASTRADO  -> 409
//   qualquer outro -> 500 (e logamos, porque 500 inesperado e bug nosso)
// Este middleware so e chamado pelo Express porque e o ULTIMO da fila
// e recebe 4 argumentos (erro, req, res, next) — assinatura que
// identifica um middleware de erro.
// ---------------------------------------------------------------------
export function tratarErro(erro: any, req: Request, res: Response, _next: NextFunction) {
    if (erro instanceof RegraNegocioErro) {
        const status = erro.codigo === 'NAO_ENCONTRADO' ? 404 : 409;
        return res.status(status).json({ mensagem: erro.message });
    }
    console.error(erro); // erro inesperado: registrar para investigar
    return res.status(500).json({ mensagem: 'Erro interno no servidor' });
}
