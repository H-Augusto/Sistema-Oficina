import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

// Senha: hash com salt (nunca é revertido, só comparado)
export async function hashSenha(senha: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(senha, salt);
}

export async function verificarSenha(senha: string, hashArmazenado: string): Promise<boolean> {
  return bcrypt.compare(senha, hashArmazenado);
}

// CPF: hash determinístico (mesmo CPF sempre gera o mesmo hash),
// necessário para poder buscar/comparar CPFs já cadastrados
export function hashCpf(cpf: string): string {
  const cpfLimpo = cpf.replace(/\D/g, ''); // remove pontos e traço
  return crypto.createHash('sha256').update(cpfLimpo).digest('hex');
}
