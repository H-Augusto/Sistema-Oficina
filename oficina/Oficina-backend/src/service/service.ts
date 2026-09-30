import { addUncaughtExceptionCaptureCallback } from "node:process";
import { hashCpf, hashSenha } from "../hash";
import { criarCliente, criarUsuario } from "../repository/repository";

export async function processCliente(dado: {
        nome: string,
        telefone: string,
        endereco: string,
        cpf: string
        created_at: Date,
        updated_at: Date,
        active: boolean
    })
        {

        const cpfHash = hashCpf(dado.cpf);
        const clienteTransformado = ({
        nome: dado.nome,
        telefone: dado.telefone,
        endereco: dado.endereco,
        hashCpf: cpfHash
    });

    const resultado = await criarCliente(clienteTransformado);
    return resultado;
}

export async function processUsuario(dado:{

    nome: string,
    email: string,
    senha: string,
    created_at: Date,
    updated_at: Date,
    active: boolean
})
    {
        const senhaHash = await hashSenha(dado.senha);
        const usuarioTransformado = ({
            nome: dado.nome,
            email: dado.email,
            senhaHash : senhaHash
        });
    const resultado = await criarUsuario(usuarioTransformado);
    return resultado;
}

