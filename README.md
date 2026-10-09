# Sistema de Gestão de Oficina Mecânica / Car Workshop Management System

> **PROJETO PARA FINS EDUCATIVOS / EDUCATIONAL PROJECT**
> Backend de uma API REST para gerenciar o fluxo de uma oficina mecânica.
> A backend REST API to manage a car repair shop's workflow.

---

## 🇧🇷 Português

### Sobre

API REST desenvolvida em **Node.js + TypeScript** para gerenciar uma oficina mecânica. O foco do projeto é o **aprendizado** de:

- **Arquitetura em camadas** (`routes` → `controller` → `service` → `repository`)
- **CRUD** completo com boas práticas
- **Segurança de dados**: senha com *hash bcrypt*, CPF com *hash SHA-256*
- **Validação de entrada** com Zod
- **Modelagem de banco** relacional (1:N e N:N)

### 🛡️ Segurança de Dados

| Dado | Como é armazenado | Por quê |
|------|-------------------|---------|
| **Senha** | Hash **bcrypt** (`$2b$10$...`) | Senhas nunca ficam legíveis, nem no banco nem na API |
| **CPF** | Hash **SHA-256** (64 caracteres) | Mesmo se o banco vazar, o CPF não é recuperável |

> ⚠️ O arquivo `.env` (com as senhas reais) **não é versionado** no Git. Copie o `.env.example` e preencha localmente.

### 🚀 Como Rodar / How to Run

**Pré-requisitos:** Node.js e MySQL instalados.

```bash
# 1. Clonar o repositório
git clone git@github.com:H-Augusto/Sistema-Oficina.git
cd Sistema-Oficina/oficina/Oficina-backend

# 2. Instalar as dependências
npm install

# 3. Configurar o banco de dados
#    (cria o schema 'oficina' com as 8 tabelas)
mysql -u root -p < ../banco.sql

# 4. Configurar as variáveis de ambiente
cp .env.example .env
#    Edite o .env e coloque a sua senha do MySQL

# 5. Subir o servidor (modo desenvolvimento)
npm run dev
```

O servidor sobe em **http://localhost:3000**

### 📦 Scripts Disponíveis

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Sobe com auto-reload ao salvar |
| `npm run build` | Compila TypeScript → JavaScript (`dist/`) |
| `npm start` | Roda a versão compilada (produção) |
| `npm run typecheck` | Só verifica tipos (sem gerar arquivo) |

### 🗄️ Banco de Dados

O schema `oficina` possui 8 tabelas:

```
cliente (1) ────< (N) veiculo     1 cliente pode ter N veículos
veiculo (1) ────< (N) OS          1 veículo pode ter N ordens de serviço
usuario (1) ────< (N) OS          1 usuário abre N ordens
   OS    (N) >───< (N) servico    junção: OS_has_servico
   OS    (N) >───< (N) mecanico   junção: mecanico_has_OS
```

### 🌐 Endpoints da API

Base URL: `http://localhost:3000/api`

### 🔐 Autenticação (JWT)

A partir desta versão, **todas as rotas de dados exigem um token**. O único endpoint público é o de login.

**Como usar:**

```bash
# 1. Fazer login (rota pública) e pegar o token
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","senha":"suaSenha"}'
# -> devolve { "token": "eyJ...", "usuario": {...} }

# 2. Usar o token em todas as outras requisições
curl http://localhost:3000/api/clientes \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

> ⚠️ Sem token (ou com token inválido/expirado), a API responde **401**.
> O token expira em **8 horas** (configure `JWT_EXPIRA_EM` no `.env`).

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/login` | 🔓 Público | Autentica e devolve o token |

#### CRUD Principal (🔒 requer token)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/clientes` | Lista clientes ativos |
| GET | `/clientes/:id` | Busca 1 cliente |
| POST | `/clientes` | Cria cliente |
| PUT | `/clientes/:id` | Atualiza cliente |
| DELETE | `/clientes/:id` | Desativa cliente (soft delete) |

> O mesmo padrão se aplica a: **`/usuarios`**, **`/veiculos`**, **`/mecanicos`**, **`/servicos`** e **`/os`**

#### Ordens de Serviço (OS) (🔒 requer token)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/os` | Lista ordens (com veículo/usuário via JOIN) |
| POST | `/os` | Cria ordem |
| GET | `/os/:id/servicos` | Lista serviços de uma OS |
| POST | `/os/:id/servicos` | Vincula serviço a uma OS |
| DELETE | `/os/:id/servicos/:idServico` | Desvincula serviço |
| GET | `/os/:id/mecanicos` | Lista mecânicos de uma OS |
| POST | `/os/:id/mecanicos` | Vincula mecânico a uma OS |
| DELETE | `/os/:id/mecanicos/:idMecanico` | Desvincula mecânico |

### 📊 Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| `200` | Sucesso (busca/atualização) |
| `201` | Recurso criado |
| `400` | Dados inválidos (validação Zod) |
| `404` | Recurso não encontrado |
| `409` | Conflito (duplicidade: CPF/email/placa) |
| `500` | Erro interno no servidor |

### 📁 Estrutura de Pastas

```
Oficina-backend/
├── src/
│   ├── server.ts              # Ponto de entrada (liga o servidor)
│   ├── app.ts                 # Monta middlewares + rotas
│   ├── routes.ts              # Mapa URL → controller
│   ├── schemas.ts             # Validação e tipos (Zod)
│   ├── db.ts                  # Conexão com MySQL (pool)
│   ├── hash.ts                # Hash de senha/CPF
│   ├── jwt.ts                 # Gerar e verificar tokens
│   ├── middleware/
│   │   └── auth.ts            # Protege rotas (token → 401)
│   ├── controller/
│   │   └── controller.ts      # Ponte HTTP (status codes)
│   ├── service/
│   │   └── service.ts         # Regra de negócio
│   └── repository/
│       └── repository.ts      # Acesso a dados (SQL)
├── .env.example               # Modelo de configuração
├── package.json
└── tsconfig.json
```

---

## 🇬🇧 English

### About

A REST API built with **Node.js + TypeScript** for managing a car repair shop. The project focuses on learning:

- **Layered architecture** (`routes` → `controller` → `service` → `repository`)
- Full **CRUD** with best practices
- **Data security**: passwords hashed with *bcrypt*, CPF with *SHA-256*
- **Input validation** with Zod
- Relational **database modeling** (1:N and N:N)

### 🛡️ Data Security

| Data | How it's stored | Why |
|------|-----------------|-----|
| **Password** | **bcrypt** hash (`$2b$10$...`) | Passwords are never readable, neither in DB nor API |
| **CPF** | **SHA-256** hash (64 chars) | Even if the DB leaks, the CPF can't be recovered |

> ⚠️ The `.env` file (with real passwords) is **not versioned** in Git. Copy `.env.example` and fill it locally.

### 🚀 How to Run

**Prerequisites:** Node.js and MySQL installed.

```bash
git clone git@github.com:H-Augusto/Sistema-Oficina.git
cd Sistema-Oficina/oficina/Oficina-backend
npm install
mysql -u root -p < ../banco.sql
cp .env.example .env   # then edit with your MySQL password
npm run dev
```

Server runs at **http://localhost:3000**

### 📦 Available Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Runs with auto-reload on save |
| `npm run build` | Compiles TypeScript → JavaScript |
| `npm start` | Runs compiled version (production) |
| `npm run typecheck` | Type checking only |

### 🌐 API Endpoints

Base URL: `http://localhost:3000/api`

### 🔐 Authentication (JWT)

**All data routes now require a token.** Only the login endpoint is public.

```bash
# 1. Log in (public route) to get a token
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourPass"}'
# -> returns { "token": "eyJ...", "user": {...} }

# 2. Use the token in every other request
curl http://localhost:3000/api/clientes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

> ⚠️ Without a token (or with an invalid/expired one), the API responds **401**.
> Tokens expire in **8 hours** (configure `JWT_EXPIRA_EM` in `.env`).

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/login` | 🔓 Public | Authenticates and returns a token |

#### Main CRUD (🔒 token required)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/clientes` | List active clients |
| GET | `/clientes/:id` | Get one client |
| POST | `/clientes` | Create client |
| PUT | `/clientes/:id` | Update client |
| DELETE | `/clientes/:id` | Soft-delete client |

> Same pattern for: **`/usuarios`**, **`/veiculos`**, **`/mecanicos`**, **`/servicos`**, **`/os`**

#### Service Orders (OS)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/os/:id/servicos` | List services of an order |
| POST | `/os/:id/servicos` | Link a service |
| DELETE | `/os/:id/servicos/:idServico` | Unlink a service |
| GET | `/os/:id/mecanicos` | List mechanics of an order |
| POST | `/os/:id/mecanicos` | Link a mechanic |
| DELETE | `/os/:id/mecanicos/:idMecanico` | Unlink a mechanic |

### 📊 HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Resource created |
| `400` | Invalid data (Zod validation) |
| `404` | Not found |
| `409` | Conflict (duplicate CPF/email/placa) |
| `500` | Internal server error |

---

## 📄 Licença / License

MIT — free to use for study purposes.
