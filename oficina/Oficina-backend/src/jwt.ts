// =====================================================================
// jwt.ts — CRIAR e VERIFICAR tokens (a "assinatura digital" da API)
// ---------------------------------------------------------------------
// O que e um JWT? E um "crachá" que a API entrega no login e que o
// cliente devolve em cada requisicao. Ele tem 3 partes:
//
//   eyJhbGci... . eyJpZCI6MX0 . XyzAssinatura
//   [ cabecalho ] [ dados ]     [ assinatura ]
//
// Os dados guardam quem e o usuario (id, nome). A ASSINATURA e feita
// com o JWT_SECRET: se alguem tentar mexer nos dados, a assinatura
// deixa de bater e o token e rejeitado. Por isso ninguem consegue
// se passar por outro usuario fabricando um token.
// =====================================================================
import jwt from 'jsonwebtoken';

// O segredo vem do .env (NAO fica hardcoded aqui). Usamos uma funcao
// porque o TS "nao confia" em estreitamento de tipo feito fora de
// funcao: process.env.X e sempre 'string | undefined' para ele.
// Aqui, dentro da funcao, o 'throw' GARANTE que devolvemos string.
function obterSegredo(): string {
    const segredo = process.env.JWT_SECRET;
    if (!segredo) {
        // Melhor falhar alto (nao sobe) do que rodar sem assinatura.
        throw new Error('JWT_SECRET nao definido. Configure o arquivo .env');
    }
    return segredo;
}

function obterTempoDeVida(): number {
    // 8h padrao se o .env nao definir
    return Number(process.env.JWT_EXPIRA_EM || 28800);
}

// Dados que guardamos DENTRO do token. Note que NAO guardamos a senha.
export interface DadosToken {
    id: number;
    nome: string;
}

// ---------------------------------------------------------------------
// GERAR token: chamado no login, quando a senha bateu.
// ---------------------------------------------------------------------
export function gerarToken(dados: DadosToken): string {
    // jwt.sign(payload, segredo, opcoes) -> devolve o token em string
    return jwt.sign(dados, obterSegredo(), {
        expiresIn: obterTempoDeVida(), // expira em 8h (ou o que .env dizer)
    });
}

// ---------------------------------------------------------------------
// VERIFICAR token: chamado no middleware de autenticacao.
// Devolve os dados se valido, ou lanca erro se expirado/forjado.
// ---------------------------------------------------------------------
export function verificarToken(token: string): DadosToken {
    // jwt.verify confere a ASSINATURA com o segredo. Se alguem mexeu no
    // token, ou se expirou, ele lanca erro (nao devolve dados falsos).
    // O retorno vem como tipo generico (JwtPayload), por isso passamos
    // por 'unknown' antes de afirmar que e DadosToken.
    const payload = jwt.verify(token, obterSegredo()) as unknown as DadosToken;
    return payload;
}
