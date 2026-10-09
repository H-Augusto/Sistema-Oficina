// =====================================================================
// middleware/auth.ts — O "SEGURANCA DA PORTA"
// ---------------------------------------------------------------------
// Middleware no Express e uma funcao que roda NO MEIO DO CAMINHO da
// requisicao, antes do controller. O de autenticacao funciona assim:
//
//   1. le o cabecalho 'Authorization' do pedido
//   2. confere se o token e valido (assinatura bate? nao expirou?)
//   3a. valido   -> poe o usuario em req.usuario e deixa passar (next)
//   3b. invalido -> responde 401 e BLOQUEIA (nunca chega no controller)
//
// Sem este middleware, qualquer pessoa que descubra a API poderia
// deletar seus clientes. Com ele, precisa estar LOGADA.
// =====================================================================
import { Request, Response, NextFunction } from 'express';
import { verificarToken, DadosToken } from '../jwt';

// "Estendemos" o tipo Request do Express para poder guardar o usuario
// autenticado. Isso e seguro porque TS e so compilacao: em tempo de
// execucao continua sendo o mesmo objeto req de sempre.
declare module 'express-serve-static-core' {
    interface Request {
        usuario?: DadosToken;
    }
}

// Extrai o token do cabecalho Authorization.
// Esperamos o formato: "Authorization: Bearer SEU_TOKEN"
// O 'Bearer' e um prefixo padrao do HTTP que diz "este token valida o portador".
function extrairToken(req: Request): string | null {
    const cabecalho = req.headers.authorization;
    if (!cabecalho) return null;

    // split(' ') separa em ['Bearer', 'eyJhbG...'] e pegamos so a 2a parte
    const [esquema, token] = cabecalho.split(' ');
    if (esquema !== 'Bearer' || !token) return null;

    return token;
}

// ---------------------------------------------------------------------
// O middleware em si. Uso nas rotas: app.get('/rota', autenticar, ...)
// ---------------------------------------------------------------------
export function autenticar(req: Request, res: Response, next: NextFunction) {
    const token = extrairToken(req);

    if (!token) {
        return res.status(401).json({ mensagem: 'Token ausente. Faca login primeiro' });
    }

    try {
        // verificarToken lanca erro se a assinatura nao bater ou se expirou
        const dados = verificarToken(token);

        // Guarda o usuario autenticado em req.usuario. Assim qualquer
        // controller pode saber QUEM pediu (req.usuario.id, .nome).
        req.usuario = dados;

        next(); // token ok: deixa a requisicao seguir para o controller
    } catch {
        // Erro aqui significa token forjado, alterado ou expirado.
        // Nao detalhamos o erro para nao dar pista a um atacante.
        return res.status(401).json({ mensagem: 'Token invalido ou expirado' });
    }
}
