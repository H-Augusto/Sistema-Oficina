# =====================================================================
# test_seguranca.py — UM ATACANTE CONSEGUE BURLAR AS REGRAS?
# ---------------------------------------------------------------------
# Enquanto a integridade pergunta "o sistema funciona?", a SEGURANCA
# pergunta "um invasor consegue atravessar?". Aqui testamos os vetores
# de ataque mais comuns de uma API REST:
#
#   1. AUTENTICACAO  -> burlar login, forjar/alterar token
#   2. INJECAO SQL   -> mandar comando SQL escondido em campo comum
#   3. VAZAMENTO    -> API vaza senha, hash, ou erro tecnico
#   4. VALIDACAO     -> mandar dados absurdos (tipos, tamanhos)
#   5. AUTORIZACAO   -> acessar recurso sem estar logado
#
# Cada teste simula um ATAQUE REAL que um pentest procuraria.
# =====================================================================
import os
import jwt as pyjwt  # biblioteca 'jwt' para FABRICAR tokens falsos
import requests

from conftest import gerar_cpf_valido

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
API = f"{BASE_URL}/api"
SEGREDO_FALSO = "segredo-de-atacante-bem-longo-1234567890"


# ---------------------------------------------------------------------
# GRUPO 1: ATAQUES DE AUTENTICACAO
# ---------------------------------------------------------------------
def test_acesso_sem_token_401():
    """Sem token, NENHUMA rota de dados pode abrir."""
    r = requests.get(f"{API}/clientes", timeout=10)
    assert r.status_code == 401, (
        f"FALHA DE SEGURANCA: /clientes abriu sem token! Status {r.status_code}"
    )


def test_acesso_token_falso_401():
    """Token FABRICADO com segredo errado deve ser rejeitado."""
    # Um atacante cria um token que 'parece' legitimo...
    token_falso = pyjwt.encode(
        {"id": 1, "nome": "Admin"}, SEGREDO_FALSO, algorithm="HS256"
    )
    # ...mas a assinatura nao bate com o segredo do servidor.
    r = requests.get(
        f"{API}/clientes",
        headers={"Authorization": f"Bearer {token_falso}"},
        timeout=10,
    )
    assert r.status_code == 401, (
        f"FALHA: token fabricado com segredo errado foi aceito! {r.status_code}"
    )


def test_acesso_token_alterado_401():
    """Mexer nos dados de um token valido invalida a assinatura."""
    # pega um token real e troca os dados por dentro
    login = requests.post(
        f"{API}/login",
        json={"email": os.environ.get("EMAIL_LOGIN", "carlos@oficina.com"),
              "senha": os.environ.get("SENHA_LOGIN", "senha123")},
        timeout=10,
    ).json()["token"]

    # decodifica SEM verificar, mexe no id, e re-monta (assinatura fica velha)
    dados = pyjwt.decode(login, options={"verify_signature": False})
    dados["id"] = 9999  # atacante quer se passar por outro usuario
    token_alterado = pyjwt.encode(dados, SEGREDO_FALSO, algorithm="HS256")

    r = requests.get(
        f"{API}/clientes",
        headers={"Authorization": f"Bearer {token_alterado}"},
        timeout=10,
    )
    assert r.status_code == 401, "FALHA: token alterado foi aceito!"


def test_login_resposta_generica_nao_revela_email():
    """Email inexistente e senha errada devolvem a MESMA mensagem.
    Se fossem diferentes, um atacante descobriria quais emails tem conta
    (isso se chama ataque de ENUMERACAO)."""
    r_email_ruim = requests.post(
        f"{API}/login",
        json={"email": "naoexiste@z.com", "senha": "qualquer"},
        timeout=10,
    )
    r_senha_ruim = requests.post(
        f"{API}/login",
        json={"email": os.environ.get("EMAIL_LOGIN", "carlos@oficina.com"),
              "senha": "senhaerrada"},
        timeout=10,
    )
    # os STATUS devem ser iguais
    assert r_email_ruim.status_code == r_senha_ruim.status_code, (
        "FALHA: status diferente para email vs senha (vazou informacao)"
    )
    # e as MENSAGENS tambem
    assert r_email_ruim.json() == r_senha_ruim.json(), (
        "FALHA: mensagem diferente para email vs senha (vazou informacao)"
    )


# ---------------------------------------------------------------------
# GRUPO 2: INJECAO SQL
# ---------------------------------------------------------------------
def test_sql_injection_no_login():
    """Mandar SQL escondido no email NAO pode logar nem dar erro 500.

    O ataque classico: email = "' OR '1'='1" faz o banco pensar que a
    condicao e sempre verdadeira. Se a API fosse vulneravel, logaria
    SEM saber a senha.

    NOTA: o que prova que NAO e vulneravel e que NAO devolve 200 (token).
    Pode ser 400 (Zod rejeitou o formato) ou 401 (senha errada) — ambos
    significam "nao logou". O erro grave seria 200.
    """
    payload = "' OR '1'='1' --"
    r = requests.post(
        f"{API}/login",
        json={"email": payload, "senha": "qualquer"},
        timeout=10,
    )
    # o certo: NAO loga. Se desse 200, seria furadao de seguranca.
    assert r.status_code != 200, (
        f"FALHA DE SEGURANCA GRAVE: SQL Injection no login LOGOU! Status {r.status_code}"
    )
    # e nao pode dar erro feio (500 = vazou detalhe tecnico)
    assert r.status_code != 500, (
        f"FALHA: SQL Injection causou erro 500 (vazou tecnico): {r.text[:200]}"
    )


def test_sql_injection_no_id_da_url(api):
    """SQL no id da URL nao pode listar tudo nem dar erro 500.

    Usa 'api' (autenticado) de proposito: sem token, o middleware daria
    401 antes de a validacao do id ser testada, e o teste nao provaria
    nada sobre SQL Injection.
    """
    payload = "1 OR 1=1"
    r = api.get(f"/clientes/{payload}")
    # o certo: o id nao e numero -> 400 (validacao), nunca 200 com tudo
    assert r.status_code in (400, 404), (
        f"FALHA: SQL Injection na URL! Status {r.status_code}"
    )


def test_sql_injection_no_nome_do_cliente(api):
    """SQL no campo 'nome' deve ser guardado como TEXTO, nao executado."""
    sql_malicioso = "'; DROP TABLE cliente; --"
    r = api.post("/clientes", json={
        "nome": sql_malicioso, "telefone": "11966666666",
        "endereco": "Rua Injection, 1", "cpf": gerar_cpf_valido(),
    })
    # deve criar normalmente (201) guardando o texto, NAO executar o DROP
    assert r.status_code == 201, f"Criacao falhou com texto SQL: {r.status_code}"

    # limpeza
    id_ = max(c["id_cliente"] for c in api.get("/clientes").json())
    api.delete(f"/clientes/{id_}")

    # PROVA de que a tabela CONTINUA existindo (o DROP nao rodou)
    lista = api.get("/clientes")
    assert lista.status_code == 200, "FALHA: tabela cliente sumiu! DROP executou"


def test_tabela_cliente_ainda_existe():
    """Verificacao extra: a tabela cliente nao foi droppada por um ataque."""
    from conftest import conectar_banco
    conexao = conectar_banco()
    try:
        cursor = conexao.cursor()
        cursor.execute("SHOW TABLES LIKE 'cliente'")
        assert cursor.fetchone() is not None, (
            "FALHA GRAVE: a tabela cliente foi APAGADA (DROP TABLE funcionou!)"
        )
    finally:
        conexao.close()


# ---------------------------------------------------------------------
# GRUPO 3: VAZAMENTO DE INFORMACAO
# ---------------------------------------------------------------------
def test_erro_500_nao_vaza_detalhe_tecnico(api):
    """Erro interno nao pode revelar SQL, stack trace ou caminho de arquivo."""
    # força um erro mandando tipo errado onde o banco espera numero
    r = api.post("/veiculos", json={
        "marca": "Fiat", "modelo": "Mobi", "ano": "NAO_E_ANO",
        "placa": "ABC1234", "cor": "Branco", "clienteId": 1,
    })
    corpo = r.text.lower()
    # mesmo que de erro, nao pode vazar pedaco de tecnico
    for palavra in ["select", "mysql", "stack", "trace", "/home/", "sqlstate"]:
        assert palavra not in corpo, (
            f"FALHA: resposta vazou detalhe tecnico '{palavra}': {r.text[:200]}"
        )


def test_respostas_nao_tem_headers_perigosos(api):
    """Cabecalhos nao devem expor tecnologia (recomendacao OWASP)."""
    r = api.get("/clientes")
    # 'X-Powered-By' revela que usa Express (ajuda o atacante a achar
    # vulnerabilidades conhecidas). Idealmente deveria estar desligado.
    powered_by = r.headers.get("X-Powered-By")
    if powered_by:
        # nao falha o teste, mas AVISA (e voce pode desligar no Express)
        print(f"\n[AVISO] Header X-Powered-By expoe tecnologia: {powered_by}")
        print("        Desligue com: app.disable('X-Powered-By')")


# ---------------------------------------------------------------------
# GRUPO 4: VALIDACAO DE ENTRADA (dados absurdos)
# ---------------------------------------------------------------------
def test_entrada_massiva_nao_quebra(api):
    """Mandar um campo gigante nao pode derrubar o servidor (500)."""
    r = api.post("/clientes", json={
        "nome": "A" * 100000,  # 100 mil caracteres no nome
        "telefone": "11977777777",
        "endereco": "Rua Grande, 1",
        "cpf": gerar_cpf_valido(),
    })
    # deve REJEITAR com 400 (validacao Zod), nao cair com 500
    assert r.status_code == 400, (
        f"FALHA: entrada gigante nao foi rejeitada! Status {r.status_code}"
    )


def test_tipo_errado_nao_quebra(api):
    """Mandar numero onde espera texto (e vice-versa) deve dar 400."""
    r = api.post("/clientes", json={
        "nome": 12345,          # numero onde espera texto
        "telefone": {"x": 1},   # objeto onde espera texto
        "endereco": "Rua Tipo, 1",
        "cpf": gerar_cpf_valido(),
    })
    assert r.status_code == 400, (
        f"FALHA: tipos errados nao rejeitados! Status {r.status_code}"
    )


def test_campo_oculto_active_ignorado(api):
    """Tentar mandar 'active: 0' ou 'id_cliente' no cadastro deve ser
    IGNORADO (o Zod descarta campos desconhecidos). E um ataque chamado
    MASS ASSIGNMENT: o atacante tenta controlar colunas internas."""
    r = api.post("/clientes", json={
        "nome": "Hacker", "telefone": "11988888888",
        "endereco": "Rua Mass, 1", "cpf": gerar_cpf_valido(),
        "active": 0,            # tenta criar ja desativado
        "id_cliente": 9999,     # tenta escolher o id
    })
    assert r.status_code == 201, f"Criacao falhou: {r.status_code}"

    id_ = max(c["id_cliente"] for c in api.get("/clientes").json())
    cliente = api.get(f"/clientes/{id_}").json()

    # se o active:0 tivesse sido aceito, o cliente nem apareceria aqui
    assert cliente["id_cliente"] != 9999, (
        "FALHA: atacante escolheu o id do proprio cliente!"
    )
    # limpeza
    api.delete(f"/clientes/{id_}")
