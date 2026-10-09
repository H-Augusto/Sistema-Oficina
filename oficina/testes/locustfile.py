# =====================================================================
# locustfile.py — TESTES DE ESTRESSE (quantos acessos antes de quebrar?)
# ---------------------------------------------------------------------
# O Locust simula MUITOS usuarios ao mesmo tempo. A ideia:
#   * voce descreve COMO um usuario se comporta (a 'tarefa' abaixo)
#   * o Locust MULTIPLICA esse usuario (10, 50, 200... simultaneos)
#   * e mede: tempo de resposta, quantos deram erro, quantos por segundo
#
# COMO RODAR (nao e 'pytest', e o proprio locust):
#   1. suba a API antes (npm run dev)
#   2. rode:  locust -f locustfile.py --host=http://localhost:3000
#   3. abra  http://localhost:8089 no navegador e aperte "Start"
#
# O Locust gera uma TELA (interface web) com graficos de desempenho.
# =====================================================================
import os
from locust import HttpUser, task, between

# Credenciais de um usuario real (as mesmas dos outros testes)
EMAIL = os.environ.get("EMAIL_LOGIN", "carlos@oficina.com")
SENHA = os.environ.get("SENHA_LOGIN", "senha123")


class UsuarioDaOficina(HttpUser):
    """Representa UM usuario real usando a API.

    A classe inteira = um usuario. O Locust faz 'N' destas rodando ao
    mesmo tempo, cada uma executando as funcoes marcadas com @task.
    """

    # 'between' = espera entre 1 e 3 segundos entre as acoes.
    # Sem essa pausa, o usuario virtual requisitaria sem parar, o que
    # nao e realista (pessoas nao clicam 100x por segundo).
    wait_time = between(1, 3)

    def on_start(self):
        """Roda QUANDO o usuario virtual 'entra' (comeca a simular).
        Aqui ele faz login e guarda o token, como uma pessoa real faria.
        """
        resposta = self.client.post(
            "/api/login",
            json={"email": EMAIL, "senha": SENHA},
        )
        if resposta.status_code == 200:
            token = resposta.json()["token"]
            # Guarda o token para usar nas proximas requisicoes.
            # 'self' = este usuario virtual especifico.
            self.headers = {"Authorization": f"Bearer {token}"}
        else:
            # Se o login falhar, o usuario nao consegue fazer nada.
            self.headers = {}

    @task(3)  # o '3' = este task roda 3x MAIS que os de peso 1
    def ver_clientes(self):
        """Acao mais comum: listar clientes (peso alto, 3)."""
        self.client.get("/api/clientes", headers=self.headers)

    @task(2)
    def ver_os(self):
        """Ver ordens de servico (peso medio, 2)."""
        self.client.get("/api/os", headers=self.headers)

    @task(1)
    def ver_veiculos(self):
        """Ver veiculos (peso baixo, 1)."""
        self.client.get("/api/veiculos", headers=self.headers)

    @task(1)
    def ver_servicos(self):
        """Ver catalogo de servicos (peso baixo, 1)."""
        self.client.get("/api/servicos", headers=self.headers)
