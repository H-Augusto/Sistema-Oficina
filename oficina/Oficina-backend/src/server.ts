// =====================================================================
// server.ts — PONTO DE ENTRADA (so "liga" o servidor)
// ---------------------------------------------------------------------
// Este arquivo era o seu "server.ts" gigante, com rotas + SQL + status
// HTTP tudo misturado. Agora ele so faz UMA coisa: importar o app ja
// montado (app.ts) e dizer para o Express escutar na porta.
//
// Toda a logica foi distribuida:
//   schemas.ts               -> valida e tipa os dados
//   repository/repository.ts -> unico lugar com SQL
//   service/service.ts       -> regra de negocio (hash, unicidade)
//   controller/controller.ts -> ponte HTTP (status codes)
//   routes.ts                -> mapa URL -> controller
//   app.ts                   -> monta middlewares + rotas
//   server.ts (este)         -> liga a porta
// =====================================================================
import { app } from './app';

// 'PORT' vem do ambiente (.env) e cai para 3000 se nao existir.
// Isso facilita subir em outra porta (ex: PORT=4000) sem mudar codigo.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor da oficina rodando em http://localhost:${PORT}`);
    console.log(`Rota de teste: http://localhost:${PORT}/`);
});
