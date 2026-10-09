import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export async function hashSenha(senha: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(senha, salt);
}

export function hashCpf(cpf: string): string{
    const cpfLimpo = cpf.replace(/\D/g, '');
    return crypto.createHash('sha256').update(cpfLimpo).digest('hex');
}

// Compara a senha DIGITADA com o hash GUARDADO no banco.
// O bcrypt guarda o "sal" dentro do proprio hash, entao a funcao
// consegue conferir sem precisar guardar a senha limpo em lugar nenhum.
// E desenhada para ser propositalmente lenta, o que dificulta
// ataque de forca bruta.
export async function conferirSenha(senhaDigitada: string, senhaHash: string): Promise<boolean> {
    return bcrypt.compare(senhaDigitada, senhaHash);
}