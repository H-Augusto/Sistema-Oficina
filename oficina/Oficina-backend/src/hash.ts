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