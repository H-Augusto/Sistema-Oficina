import type { Request, Response } from "express";
import { processCliente, processUsuario, processVeiculo } from "../service/service";
export async function cadastrarUsuario(req: Request, res: Response){
    const resultado = await processUsuario(req.body);
    res.json(resultado);
}

export async function cadastrarCliente(req: Request, res: Response) {

    const resultado = await processCliente(req.body);

    res.json(resultado);
}

export async function cadastrarVeiculo(req: Request, res: Response){
    
    const resultado = await processVeiculo(req.body);
    
    res.json(resultado);
}
