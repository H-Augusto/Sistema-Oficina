// =====================================================================
// app.ts — MONTAGEM do Express (rotas + middlewares)
// ---------------------------------------------------------------------
// Aqui a gente so MONTA a aplicacao e a exporta. NAO ligamos a porta
// aqui (isso fica no server.ts). Por que separar?
//   -> permite testar a API com 'supertest' sem abrir porta de verdade.
//
// ORDEM DOS MIDDLEWARES IMPORTA:
//   express.json()  -> le o body JSON e poe em req.body (antes das rotas)
//   rotas           -> despacha para o controller certo
//   tratarErro      -> coleta erros que escaparam (DEVE ser o ultimo)
// =====================================================================
import express from 'express';
import { rotas } from './routes';
import { tratarErro } from './controller/controller';

export const app = express();

// Leitura do corpo da requisicao em JSON. Sem esta linha, req.body
// chegaria 'undefined' em POST/PUT — uma das pegadinhas mais comuns.
app.use(express.json());

// Raiz da API: avisa que as rotas comecam em /api
app.get('/', (_req, res) => {
    res.json({ mensagem: 'API da oficina rodando. Use /api/clientes, /api/os, ...' });
});

// Todas as rotas ficam sob /api (padrao: versionar/refixar a API no caminho)
app.use('/api', rotas);

// Rota nao encontrada (404). Se a requisicao chegou aqui e porque
// nenhuma rota acima casou. Precisa vir DEPOIS de app.use('/api', rotas).
app.use((_req, res) => {
    res.status(404).json({ mensagem: 'Rota nao encontrada' });
});

// Middleware de erro: o Express o chama automaticamente quando recebe
// 4 argumentos (erro, req, res, next) e alguem chama next(erro).
app.use(tratarErro);
