import type { Request, Response } from "express";
import { processCliente, processUsuario } from "../service/service";

export async function cadastrarCliente(req: Request, res: Response) {

    const resultado = await processCliente(req.body);

    res.json(resultado);
}

export async function cadastrarUsuario(req: Request, res: Response){
    const resultado = await processUsuario(req.body);
    res.json(resultado);
}