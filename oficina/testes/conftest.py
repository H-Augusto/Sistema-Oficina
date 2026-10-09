# =====================================================================
# conftest.py — BASTIDORES COMPARTILHADOS DOS TESTES
# ---------------------------------------------------------------------
# Este arquivo e especial para o pytest. Qualquer funcao marcada com
# @pytest.fixture pode ser USADA pelos testes so por escrever o nome
# dela como parametro. Ex:
#
#     def test_algo(cliente):
#         ...  <- 'cliente' ja e um cliente criado de verdade
#
# Aqui a gente prepara o "cenario" que todos os testes precisam:
# saber a URL da API, ter um token de login, ter dados de teste.
# =====================================================================
import os
import random
import pytest
import requests

# Biblioteca para falar com o MySQL DIRETO (sem passar pela API).
# Usada pelos testes que conferem como o dado ficou guardado no banco.
import mysql.connector

# ---------------------------------------------------------------------
# CONFIGURACAO
# ---------------------------------------------------------------------
# URL onde a API esta rodando. Se um dia mudar a porta, muda so aqui.
BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
API = f"{BASE_URL}/api"

# Credenciais de um usuario REAL que ja existe no banco.
EMAIL_LOGIN = os.environ.get("EMAIL_LOGIN", "carlos@oficina.com")
SENHA_LOGIN = os.environ.get("SENHA_LOGIN", "senha123")


# ---------------------------------------------------------------------
# GERADOR DE CPF VALIDO (com digitos verificadores corretos)
# ---------------------------------------------------------------------
# Por que gerar? Porque testes devem ser INDEPENDENTES: se usarmos um
# CPF fixo, a segunda execucao falha (o CPF ja foi "gasto" pelo banco).
# Gerando um novo a cada rodada, o teste nunca colide.
#
# O algoritmo dos digitos verificadores e o oficial da Receita:
#   - 9 primeiros digitos aleatorios
#   - calcula 2 digitos verificadores a partir deles (regra do modulo 11)
# ---------------------------------------------------------------------
def gerar_cpf_valido() -> str:
    """Devolve um CPF novo, com digitos verificadores CORRETOS."""
    base = [random.randint(0, 9) for _ in range(9)]

    # --- primeiro digito verificador ---
    soma = sum(d * (10 - i) for i, d in enumerate(base))
    resto = soma % 11
    d1 = 0 if resto < 2 else 11 - resto

    # --- segundo digito verificador (inclui o d1 na conta) ---
    base_com_d1 = base + [d1]
    soma = sum(d * (11 - i) for i, d in enumerate(base_com_d1))
    resto = soma % 11
    d2 = 0 if resto < 2 else 11 - resto

    # junta tudo e formata "000.000.000-00"
    numeros = base + [d1, d2]
    return f"{''.join(map(str, numeros[:3]))}.{''.join(map(str, numeros[3:6]))}.{''.join(map(str, numeros[6:9]))}-{numeros[9]}{numeros[10]}"


# ---------------------------------------------------------------------
# CONEXAO DIRETA COM O BANCO
# ---------------------------------------------------------------------
def conectar_banco():
    """Abre uma conexao direta com o MySQL (mesmos dados do .env).

    Por que direto? Alguns testes precisam conferir a VERDADE CRUA do
    banco (ex: a senha esta mesmo em hash?). A API pode esconder algo,
    mas o banco mostra como o dado realmente ficou guardado.
    """
    return mysql.connector.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", ""),
        database=os.environ.get("DB_NAME", "oficina"),
    )


# ---------------------------------------------------------------------
# FIXTURE: 'token' — faz login e devolve o token
# ---------------------------------------------------------------------
@pytest.fixture(scope="session")
def token():
    """Faz login UMA vez e devolve o token. 'session' = compartilhado
    por todos os testes (mais rapido, nao loga 50 vezes)."""
    resposta = requests.post(
        f"{API}/login",
        json={"email": EMAIL_LOGIN, "senha": SENHA_LOGIN},
        timeout=10,
    )
    # Se o login falhar, os testes nao tem como continuar. Melhor parar
    # tudo com uma mensagem clara do que deixar dezenas de erro confuso.
    assert resposta.status_code == 200, (
        f"Login falhou ({resposta.status_code}). A API esta rodando em {BASE_URL}? "
        f"Usuario {EMAIL_LOGIN} existe no banco? Resposta: {resposta.text}"
    )
    return resposta.json()["token"]


class ClienteApi:
    """Embrulho fino em volta da Session que gruda a URL base.

    A Session do requests nao sabe a URL base: se o teste fizer
    api.get('/clientes'), ela nao vai para http://localhost:3000/api/clientes.
    Por isso embrulhamos, para os testes escreverem caminhos curtos.
    """

    def __init__(self, sessao):
        self._sessao = sessao
        self._base = API

    def get(self, caminho, **kwargs):
        return self._sessao.get(self._base + caminho, timeout=10, **kwargs)

    def post(self, caminho, **kwargs):
        return self._sessao.post(self._base + caminho, timeout=10, **kwargs)

    def put(self, caminho, **kwargs):
        return self._sessao.put(self._base + caminho, timeout=10, **kwargs)

    def delete(self, caminho, **kwargs):
        return self._sessao.delete(self._base + caminho, timeout=10, **kwargs)


@pytest.fixture(scope="session")
def api(token):
    """Cria uma sessao do requests COM o token e a URL base ja montados.

    'scope=session' significa que TODOS os testes reusam a MESMA sessao
    (e o MESMO token), em vez de logar de novo a cada teste.
    """
    sessao = requests.Session()
    # Adiciona o cabecalho Authorization em TODA requisicao desta sessao.
    # Este e o formato que a API espera: "Bearer <token>"
    sessao.headers.update({
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    })
    return ClienteApi(sessao)


# ---------------------------------------------------------------------
# FIXTURE: 'cliente_teste' — cria um cliente UNICO e APAGA no final
# ---------------------------------------------------------------------
@pytest.fixture
def cliente_teste(api):
    """Cria um cliente real via API (com CPF novo e unico), entrega para
    o teste usar, e GARANTE que sera desativado no fim (mesmo se falhar).

    Isso se chama 'setup' (antes) e 'teardown' (depois). O 'yield'
    separa os dois lados: tudo antes do yield roda ANTES do teste,
    tudo depois roda DEPOIS, mesmo se o teste deu erro.
    """
    cpf_novo = gerar_cpf_valido()

    # --- SETUP: criar ---
    resposta = api.post("/clientes", json={
        "nome": "Cliente de Teste",
        "telefone": "11900000000",
        "endereco": "Rua dos Testes, 1",
        "cpf": cpf_novo,  # CPF novo e unico a cada execucao
    })
    assert resposta.status_code == 201, (
        f"Nao consegui criar o cliente de teste: {resposta.status_code} {resposta.text}"
    )

    # Busca o id real que o banco gerou (o maior = o que acabamos de criar)
    clientes = api.get("/clientes").json()
    id_ = max(c["id_cliente"] for c in clientes)

    # --- entregar para o teste ---
    yield id_

    # --- TEARDOWN: limpar (roda MESMO se o teste falhou) ---
    api.delete(f"/clientes/{id_}")
