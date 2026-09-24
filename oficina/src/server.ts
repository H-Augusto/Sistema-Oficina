import http from 'node:http';
import {
  listarClientes,
  criarCliente,
  atualizarCliente,
  removerCliente,
} from './services/clienteService';
import { listarUsuarios, criarUsuario } from './services/usuarioService';

// Lê e junta o corpo (body) da requisição, igual o Express faz por baixo dos panos
function lerCorpo(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function enviarJson(res: http.ServerResponse, status: number, dados: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(dados));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = req.url || '';

    // ---------- CLIENTES ----------
    if (url === '/clientes' && req.method === 'GET') {
      return enviarJson(res, 200, await listarClientes());
    }

    if (url === '/clientes' && req.method === 'POST') {
      const dados = await lerCorpo(req);
      const resultado = await criarCliente(dados);
      return enviarJson(res, 201, resultado);
    }

    const matchClienteId = url.match(/^\/clientes\/(\d+)$/);
    if (matchClienteId && req.method === 'PUT') {
      const dados = await lerCorpo(req);
      await atualizarCliente(Number(matchClienteId[1]), dados);
      return enviarJson(res, 200, { mensagem: 'Cliente atualizado' });
    }

    if (matchClienteId && req.method === 'DELETE') {
      await removerCliente(Number(matchClienteId[1]));
      return enviarJson(res, 200, { mensagem: 'Cliente desativado' });
    }

    // ---------- USUARIOS ----------
    if (url === '/usuarios' && req.method === 'GET') {
      return enviarJson(res, 200, await listarUsuarios());
    }

    if (url === '/usuarios' && req.method === 'POST') {
      const dados = await lerCorpo(req);
      const resultado = await criarUsuario(dados);
      return enviarJson(res, 201, resultado);
    }

    enviarJson(res, 404, { erro: 'Rota não encontrada' });
  } catch (err) {
    console.error(err);
    enviarJson(res, 500, { erro: 'Erro interno no servidor' });
  }
});

server.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
