// =====================================================================
// routes.ts — INDICE DE ENDERECOS (URL -> controller)
// ---------------------------------------------------------------------
// Esta camada so DECIDE qual controller cuida de qual endereco.
// Nao tem logica, nao tem SQL, nao tem regra de negocio.
//
// CONVENCAO REST usada aqui (plural = colecao de recursos):
//   GET    /clientes         -> lista todos
//   GET    /clientes/:id     -> busca 1 pelo id
//   POST   /clienteS         -> cria 1 novo
//   PUT    /clientes/:id     -> substitui/atualiza 1
//   DELETE /clientes/:id     -> desativa 1 (soft delete)
// Repete para as 6 entidades.
// =====================================================================
import { Router } from 'express';
import {
    clienteController, validarCliente,
    usuarioController, validarUsuario,
    veiculoController, validarVeiculo,
    mecanicoController, validarMecanico,
    servicoController, validarServico,
    osController, validarOs, validarOsServico, validarOsMecanico,
} from './controller/controller';

export const rotas = Router();

// ---------------------------------------------------------------------
// CLIENTE
// validarCliente = middleware que roda o Zod no body ANTES do controller
// ---------------------------------------------------------------------
rotas.get('/clientes', clienteController.listar);
rotas.get('/clientes/:id', clienteController.buscar);
rotas.post('/clientes', validarCliente, clienteController.criar);
rotas.put('/clientes/:id', validarCliente, clienteController.atualizar);
rotas.delete('/clientes/:id', clienteController.desativar);

// ---------------------------------------------------------------------
// USUARIO
// ---------------------------------------------------------------------
rotas.get('/usuarios', usuarioController.listar);
rotas.get('/usuarios/:id', usuarioController.buscar);
rotas.post('/usuarios', validarUsuario, usuarioController.criar);
rotas.put('/usuarios/:id', validarUsuario, usuarioController.atualizar);
rotas.delete('/usuarios/:id', usuarioController.desativar);

// ---------------------------------------------------------------------
// VEICULO
// ---------------------------------------------------------------------
rotas.get('/veiculos', veiculoController.listar);
rotas.get('/veiculos/:id', veiculoController.buscar);
rotas.post('/veiculos', validarVeiculo, veiculoController.criar);
rotas.put('/veiculos/:id', validarVeiculo, veiculoController.atualizar);
rotas.delete('/veiculos/:id', veiculoController.desativar);

// ---------------------------------------------------------------------
// MECANICO
// ---------------------------------------------------------------------
rotas.get('/mecanicos', mecanicoController.listar);
rotas.get('/mecanicos/:id', mecanicoController.buscar);
rotas.post('/mecanicos', validarMecanico, mecanicoController.criar);
rotas.put('/mecanicos/:id', validarMecanico, mecanicoController.atualizar);
rotas.delete('/mecanicos/:id', mecanicoController.desativar);

// ---------------------------------------------------------------------
// SERVICO
// ---------------------------------------------------------------------
rotas.get('/servicos', servicoController.listar);
rotas.get('/servicos/:id', servicoController.buscar);
rotas.post('/servicos', validarServico, servicoController.criar);
rotas.put('/servicos/:id', validarServico, servicoController.atualizar);
rotas.delete('/servicos/:id', servicoController.desativar);

// ---------------------------------------------------------------------
// OS (Ordem de Servico)
// ---------------------------------------------------------------------
rotas.get('/os', osController.listar);
rotas.get('/os/:id', osController.buscar);
rotas.post('/os', validarOs, osController.criar);
rotas.put('/os/:id', validarOs, osController.atualizar);
rotas.delete('/os/:id', osController.desativar);

// ---------------------------------------------------------------------
// RELACOES da OS (sub-recursos aninhados)
// /os/5/servicos = "os servicos da OS de id 5"
// ---------------------------------------------------------------------
rotas.get('/os/:id/servicos', osController.listarServicos);
rotas.post('/os/:id/servicos', validarOsServico, osController.adicionarServico);
rotas.delete('/os/:id/servicos/:idServico', osController.removerServico);

rotas.get('/os/:id/mecanicos', osController.listarMecanicos);
rotas.post('/os/:id/mecanicos', validarOsMecanico, osController.adicionarMecanico);
rotas.delete('/os/:id/mecanicos/:idMecanico', osController.removerMecanico);
