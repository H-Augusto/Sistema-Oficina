# =====================================================================
# test_integridade.py — O SISTEMA FAZ O QUE PROMETE?
# ---------------------------------------------------------------------
# Testes de INTEGRIDADE verificam:
#   * o CRUD completo funciona (criar -> ler -> atualizar -> apagar)
#   * dados sensiveis NUNCA vazam nas respostas
#   * senha e CPF estao mesmo criptografados no banco
#   * regras de negocio (unicidade, obrigatorio) sao respeitadas
#
# Como usar: cada 'def test_...' e um teste. O pytest roda todos.
# O 'api' que aparece como parametro vem do conftest.py (ja logado).
# =====================================================================
import os
import requests

# Importa a funcao que gera CPF valido/unico (definida no conftest.py).
# O pytest colocou a pasta dos testes no 'caminho', entao conseguimos
# importar direto: from conftest import ...
from conftest import gerar_cpf_valido, conectar_banco

# Acessa o banco DIRETO, para conferir como os dados ficaram guardados.
# Isso e mais forte do que so olhar a API: a API pode esconder algo,
# mas o banco mostra a verdade crua.
import mysql.connector

API = os.environ.get("BASE_URL", "http://localhost:3000") + "/api"


# ---------------------------------------------------------------------
# GRUPO 1: O CRUD FUNCIONA?
# ---------------------------------------------------------------------
def test_criar_cliente(api):
    """POST deve criar e devolver 201 (criado)."""
    r = api.post("/clientes", json={
        "nome": "Maria CRUD", "telefone": "11912345678",
        "endereco": "Rua A, 10", "cpf": gerar_cpf_valido(),
    })
    assert r.status_code == 201, f"Esperava 201, veio {r.status_code}: {r.text}"
    # limpeza: desativa o que criamos
    id_ = max(c["id_cliente"] for c in api.get("/clientes").json())
    api.delete(f"/clientes/{id_}")


def test_listar_clientes(api):
    """GET deve devolver uma LISTA (mesmo que vazia), nunca um erro."""
    r = api.get("/clientes")
    assert r.status_code == 200
    assert isinstance(r.json(), list), "A listagem deveria ser uma lista []"


def test_atualizar_cliente(api, cliente_teste):
    """PUT deve mudar o nome e devolver 200."""
    r = api.put(f"/clientes/{cliente_teste}", json={
        "nome": "Nome Alterado", "telefone": "11999999999",
        "endereco": "Rua B, 20", "cpf": gerar_cpf_valido(),
    })
    assert r.status_code == 200
    # confere se a mudanca apareceu na leitura
    nome_lido = api.get(f"/clientes/{cliente_teste}").json()["nome"]
    assert nome_lido == "Nome Alterado"


def test_buscar_cliente_inexistente_404(api):
    """Buscar id que nao existe deve dar 404, nao 500 (erro feio)."""
    r = api.get("/clientes/999999")
    assert r.status_code == 404


# ---------------------------------------------------------------------
# GRUPO 2: DADOS SENSIVEIS VAZAM?
# Estes sao os testes mais importantes para SEGURANCA.
# ---------------------------------------------------------------------
def test_api_nunca_devolve_senha(api):
    """A listagem de usuarios NUNCA pode conter o campo 'senha'."""
    usuarios = api.get("/usuarios").json()
    for u in usuarios:
        assert "senha" not in u, f"VAZAMENTO: usuario {u} tem o campo senha!"


def test_api_nunca_devolve_senha_no_get_por_id(api):
    """Nem mesmo buscando UM usuario por id a senha pode aparecer."""
    usuarios = api.get("/usuarios").json()
    if usuarios:
        id_ = usuarios[0]["id_usuario"]
        corpo = api.get(f"/usuarios/{id_}").json()
        assert "senha" not in corpo, "VAZAMENTO: senha no GET por id!"


def test_cpf_e_hash_nao_texto_puro(api, cliente_teste):
    """O CPF devolvido deve ser um HASH (64 caracteres), nao '123.456.789-09'."""
    cpf_lido = api.get(f"/clientes/{cliente_teste}").json()["cpf"]
    # CPF limpo tem 11 digitos; hash sha256 tem 64 caracteres hexadecimais
    assert len(cpf_lido) == 64, f"CPF nao parece hash (tamanho {len(cpf_lido)}): {cpf_lido}"
    assert "123.456.789-09" not in cpf_lido, "VAZAMENTO: CPF em texto puro!"


def test_senha_no_banco_e_hash_bcrypt(api):
    """Olhando o BANCO CRU, a senha deve ser hash bcrypt ($2b$...)."""
    conexao = conectar_banco()
    try:
        cursor = conexao.cursor()
        cursor.execute("SELECT senha FROM usuario LIMIT 1")
        resultado = cursor.fetchone()
        assert resultado is not None, "Nenhum usuario no banco para conferir"
        senha_guardada = resultado[0]
        # bcrypt sempre comeca com $2b$ (ou $2a$) e tem 60 caracteres
        assert senha_guardada.startswith("$2"), (
            f"SENHA NAO CRIPTOGRAFADA: comeca com '{senha_guardada[:5]}' em vez de '$2'"
        )
        assert len(senha_guardada) == 60, "Hash bcrypt deveria ter 60 caracteres"
    finally:
        conexao.close()


def test_cpf_no_banco_e_hash_nao_limpo():
    """No banco CRU, o CPF deve ser hash de 64 caracteres, nao os 11 digitos."""
    conexao = conectar_banco()
    try:
        cursor = conexao.cursor()
        cursor.execute("SELECT cpf FROM cliente LIMIT 1")
        resultado = cursor.fetchone()
        if resultado:
            cpf_guardado = resultado[0]
            assert len(cpf_guardado) == 64, (
                f"CPF guardado nao e hash (tamanho {len(cpf_guardado)})"
            )
    finally:
        conexao.close()


# ---------------------------------------------------------------------
# GRUPO 3: REGRAS DE NEGOCIO SAO RESPEITADAS?
# ---------------------------------------------------------------------
def test_cpf_duplicado_rejeitado_409(api):
    """Dois clientes com o MESMO cpf devem dar 409 (conflito)."""
    cpf = gerar_cpf_valido()  # um CPF novo, usado 2x de proposito
    api.post("/clientes", json={
        "nome": "Original", "telefone": "11911111111",
        "endereco": "Rua X, 1", "cpf": cpf,
    })
    r = api.post("/clientes", json={
        "nome": "Duplicado", "telefone": "11922222222",
        "endereco": "Rua Y, 2", "cpf": cpf,  # MESMO cpf
    })
    assert r.status_code == 409, f"Esperava 409 (conflito), veio {r.status_code}"
    # limpeza
    id_ = max(c["id_cliente"] for c in api.get("/clientes").json())
    api.delete(f"/clientes/{id_}")


def test_cpf_invalido_rejeitado_400(api):
    """CPF com digitos verificadores errados deve dar 400 (invalido)."""
    r = api.post("/clientes", json={
        "nome": "Cpf Ruim", "telefone": "11933333333",
        "endereco": "Rua Z, 3", "cpf": "111.111.111-11",  # invalido
    })
    assert r.status_code == 400


def test_veiculo_sem_dono_rejeitado(api):
    """Criar veiculo para cliente INEXISTENTE deve falhar (regra: todo
    veiculo tem dono). Nao pode criar veiculo orfao."""
    r = api.post("/veiculos", json={
        "marca": "Fiat", "modelo": "Mobi", "ano": 2020,
        "placa": "SEMCLIE", "cor": "Branco", "clienteId": 999999,
    })
    assert r.status_code in (400, 404), (
        f"Esperava 400/404 (dono inexistente), veio {r.status_code}"
    )


def test_soft_delete_nao_apaga_linha(api):
    """O DELETE deve DESATIVAR (active=0), nao apagar a linha do banco.

    Autocontido: cria o SEU proprio cliente, entao nao depende de
    existir dado pronto no banco (isso deixaria o teste fragil).
    """
    # --- cria um cliente proprio para este teste ---
    cpf = gerar_cpf_valido()
    r = api.post("/clientes", json={
        "nome": "Vai Ser Apagado", "telefone": "11955555555",
        "endereco": "Rua Delete, 9", "cpf": cpf,
    })
    assert r.status_code == 201
    id_ = max(c["id_cliente"] for c in api.get("/clientes").json())

    conexao = conectar_banco()
    try:
        cursor = conexao.cursor(dictionary=True)

        # apaga pela API (soft delete) — usa a sessao 'api' (autenticada)
        api.delete(f"/clientes/{id_}")

        # a linha deve CONTINUAR no banco, com active=0
        cursor.execute("SELECT active FROM cliente WHERE id_cliente=%s", (id_,))
        depois = cursor.fetchone()
        assert depois is not None, "LINHA SUMIU DO BANCO! O delete apagou de verdade"
        assert depois["active"] == 0, "active deveria ser 0 (desativado)"

        # restaura para nao quebrar outros testes
        cursor.execute("UPDATE cliente SET active=1 WHERE id_cliente=%s", (id_,))
        conexao.commit()
    finally:
        conexao.close()
