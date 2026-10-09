# 🧪 Testes Automatizados / Automated Tests

> Suíte de testes em **Python** para a API REST da oficina.
> Python test suite for the car workshop REST API.

---

## 🇧🇷 Português

### O que são estes testes?

Três tipos de teste, cada um respondendo uma pergunta diferente:

| Tipo | Pergunta | Arquivo |
|------|----------|---------|
| **Integridade** | O sistema faz o que promete e protege os dados? | `test_integridade.py` |
| **Segurança** | Um atacante consegue burlar as regras? | `test_seguranca.py` |
| **Estresse** | Quantos acessos simultâneos antes de quebrar? | `locustfile.py` |

### 🚀 Como rodar

**1. Suba a API primeiro** (os testes batem nela):
```bash
cd ../Oficina-backend
npm run dev
```

**2. Entre na pasta de testes e ative o ambiente virtual:**
```bash
cd ../testes
source .venv/bin/activate   # ativa o "ambiente virtual" isolado
```

**3. Rode os testes:**

```bash
# Testes de integridade (13 testes)
pytest test_integridade.py -v

# Testes de segurança (13 testes)
pytest test_seguranca.py -v

# TODOS de uma vez
pytest -v
```

**4. Teste de estresse (Locust):**
```bash
# Modo linha de comando (headless) — 10 usuarios por 20 segundos
locust -f locustfile.py --host=http://localhost:3000 --headless -u 10 -r 5 -t 20s

# OU com interface web (abra http://localhost:8089 no navegador)
locust -f locustfile.py --host=http://localhost:3000
```

### 📁 Estrutura

```
testes/
├── .venv/                 # Ambiente virtual (bibliotecas isoladas)
├── conftest.py            # Bastidores: URL, login, gerador de CPF
├── test_integridade.py    # CRUD, vazamento de dados, regras
├── test_seguranca.py      # SQL Injection, forjar token, validação
├── locustfile.py          # Simulação de carga (estresse)
└── requirements.txt       # Lista de bibliotecas necessárias
```

### 🔐 O que os testes de segurança cobrem?

- **Autenticação**: acesso sem token, token forjado, token alterado
- **SQL Injection**: no login, na URL, nos campos de texto
- **Vazamento**: senha nunca aparece, CPF sempre como hash, erros 500 não vazam detalhes técnicos
- **Validação**: entrada gigante, tipos errados, Mass Assignment (`active: 0` forjado)

### 📊 Como ler o resultado do Locust

```
# reqs  # fails |  Avg  Min  Max  Med |  req/s
  111   0(0%)   |  41   4    447   7  |  5.64
```

- **# fails 0%** = a API aguentou a carga
- **Med (mediana)** = metade das requisições foi mais rápida que isso
- **Percentis (p95, p99)** = o pior caso — mais importante que a média

> ⚠️ O **login é propositalmente lento** (~270ms) porque o bcrypt é desenhado para ser lento (proteção contra força bruta). Isso é **segurança funcionando**, não bug.

---

## 🇬🇧 English

### What are these tests?

Three test types, each answering a different question:

| Type | Question | File |
|------|----------|------|
| **Integrity** | Does the system keep its promises and protect data? | `test_integridade.py` |
| **Security** | Can an attacker bypass the rules? | `test_seguranca.py` |
| **Stress** | How many simultaneous users before it breaks? | `locustfile.py` |

### 🚀 How to run

```bash
# 1. Start the API first
cd ../Oficina-backend && npm run dev

# 2. Activate the virtual environment
cd ../testes && source .venv/bin/activate

# 3. Run tests
pytest test_integridade.py -v      # integrity
pytest test_seguranca.py -v        # security
pytest -v                          # all

# 4. Stress test
locust -f locustfile.py --host=http://localhost:3000 --headless -u 10 -r 5 -t 20s
```

### 🔐 Security coverage

- **Authentication**: no token, forged token, altered token
- **SQL Injection**: in login, URL, and text fields
- **Data leakage**: password never exposed, CPF always hashed, no technical errors
- **Validation**: huge input, wrong types, Mass Assignment

---

## 📄 Licença / License

MIT — free to use for study purposes.
