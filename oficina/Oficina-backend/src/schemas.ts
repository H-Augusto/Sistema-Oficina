// =====================================================================
// schemas.ts — VALIDAÇÃO e TIPOS dos dados que entram na API
// ---------------------------------------------------------------------
// O 'req.body' vem da internet: qualquer pessoa pode mandar um JSON
// com campo faltando, tipo errado ou script malicioso. O Zod serve de
// PORTÃO: valida o formato ANTES de qualquer coisa chegar no banco.
//
// A grande vantagem: cada schema do Zod gera um TIPO do TypeScript.
// Em vez de eu escrever 'interface Cliente { ... }' à mão (e correr o
// risco de desatualizar), eu extraio o tipo do schema com
// z.infer<typeof schema>. Assim validação e tipo andam juntos e nunca
// saem de sincronia.
// =====================================================================
import { z } from 'zod';

// ---------------------------------------------------------------------
// Rotina de validação de CPF (sem depender de biblioteca externa).
// Retorna true/false. É a mesma regra dos dígitos verificadores oficiais.
// ---------------------------------------------------------------------
export function cpfValido(valor: string): boolean {
    const cpf = valor.replace(/\D/g, ''); // remove pontos e hifen -> "12345678909"
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false; // "11111111111" nao e valido

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
    let d1 = (soma * 10) % 11;
    if (d1 === 10) d1 = 0;
    if (d1 !== Number(cpf[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
    let d2 = (soma * 10) % 11;
    if (d2 === 10) d2 = 0;
    return d2 === Number(cpf[10]);
}

// ---------------------------------------------------------------------
// CLIENTE
// Campos aceitos no corpo da requisição (POST/PUT).
// ---------------------------------------------------------------------
export const clienteSchema = z.object({
    nome: z.string().min(3, 'Nome precisa de pelo menos 3 caracteres').max(150),
    telefone: z.string().min(8, 'Telefone invalido').max(14),
    endereco: z.string().min(5, 'Endereco muito curto').max(70),
    cpf: z.string().refine(cpfValido, 'CPF invalido'),
});
// Tipo gerado automaticamente a partir do schema acima.
export type ClienteInput = z.infer<typeof clienteSchema>;

// ---------------------------------------------------------------------
// USUARIO (funcionario que usa o sistema)
// ---------------------------------------------------------------------
export const usuarioSchema = z.object({
    nome: z.string().min(3, 'Nome precisa de pelo menos 3 caracteres').max(150),
    email: z.string().email('Email invalido').max(85),
    senha: z.string().min(6, 'Senha precisa de pelo menos 6 caracteres').max(72),
});
export type UsuarioInput = z.infer<typeof usuarioSchema>;

// ---------------------------------------------------------------------
// VEICULO
// 'ano' agora e numero (o banco guarda SMALLINT), nao data.
// 'clienteId' e OBRIGATORIO porque todo veiculo tem dono (FK NOT NULL).
// ---------------------------------------------------------------------
export const veiculoSchema = z.object({
    marca: z.string().min(2, 'Marca invalida').max(35),
    modelo: z.string().min(1, 'Modelo invalido').max(40),
    ano: z.number().int('Ano deve ser numero inteiro').min(1950).max(2100),
    placa: z.string().min(7, 'Placa deve ter 7 caracteres').max(7),
    cor: z.string().min(3, 'Cor invalida').max(10),
    clienteId: z.number().int('clienteId deve ser numero inteiro'),
});
export type VeiculoInput = z.infer<typeof veiculoSchema>;

// ---------------------------------------------------------------------
// MECANICO
// 'cpf' e obrigatorio (NOT NULL no banco) e precisa ser valido.
// ---------------------------------------------------------------------
export const mecanicoSchema = z.object({
    nome: z.string().min(3, 'Nome precisa de pelo menos 3 caracteres').max(90),
    telefone: z.string().min(8, 'Telefone invalido').max(14),
    cpf: z.string().refine(cpfValido, 'CPF invalido'),
});
export type MecanicoInput = z.infer<typeof mecanicoSchema>;

// ---------------------------------------------------------------------
// SERVICO (item do catalogo da oficina)
// Nao tem 'id' aqui: o banco gera sozinho (AUTO_INCREMENT).
// ---------------------------------------------------------------------
export const servicoSchema = z.object({
    servico: z.string().min(3, 'Nome do servico muito curto').max(25),
    preco: z.number().nonnegative('Preco nao pode ser negativo'),
});
export type ServicoInput = z.infer<typeof servicoSchema>;

// ---------------------------------------------------------------------
// OS (Ordem de Servico)
// Precisa dizer em QUAL veiculo (idVeiculo) e QUEM abriu (idUsuario).
// ---------------------------------------------------------------------
export const osSchema = z.object({
    nome: z.string().min(3, 'Nome da OS muito curto').max(25),
    valor: z.number().nonnegative('Valor nao pode ser negativo'),
    status: z.string().min(2, 'Status invalido').max(45),
    idVeiculo: z.number().int('idVeiculo deve ser numero inteiro'),
    idUsuario: z.number().int('idUsuario deve ser numero inteiro'),
});
export type OsInput = z.infer<typeof osSchema>;

// ---------------------------------------------------------------------
// Corpo para ADICIONAR um servico a uma OS (rota POST /os/:id/servicos)
// ---------------------------------------------------------------------
export const osServicoSchema = z.object({
    idServico: z.number().int('idServico deve ser numero inteiro'),
});
export type OsServicoInput = z.infer<typeof osServicoSchema>;

// ---------------------------------------------------------------------
// Corpo para ATRIBUIR um mecanico a uma OS (rota POST /os/:id/mecanicos)
// ---------------------------------------------------------------------
export const osMecanicoSchema = z.object({
    idMecanico: z.number().int('idMecanico deve ser numero inteiro'),
});
export type OsMecanicoInput = z.infer<typeof osMecanicoSchema>;
