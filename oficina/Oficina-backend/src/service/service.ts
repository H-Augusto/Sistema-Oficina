import { hashCpf, hashSenha } from "../hash";
import { criarCliente, criarUsuario, criarVeiculo, criarMecanico, criarOs, criarServico } from "../repository/repository";

export async function processCliente(dado: {
        nome: string,
        telefone: string,
        endereco: string,
        cpf: string,
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

export async function processVeiculo(dados:{
    marca: string,
    ano: number,
    placa: string,
    modelo: string,
    cor: string,
    created_at: Date,
    update_at: Date,
    active: boolean
}) 

{
    const veiculoTransformado =  ({
        marca: dados.marca,
        ano: dados.ano,
        placa: dados.placa,
        modelo: dados.modelo,
        cor: dados.cor

    });
    const resultado = await criarVeiculo(veiculoTransformado);
    return resultado;
    
}

export async function processMecanico(dados:{

    nome: string,
    telefone: string,
    created_at: Date,
    updated_at: Date,
    active: boolean

}) 


{
    const mecanicoTransformado = ({
        
        nome: dados.nome,
        telefone: dados.telefone
    });

    const resultado = await criarMecanico(mecanicoTransformado);
    return resultado;

}

