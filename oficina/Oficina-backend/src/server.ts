// importacao do express
import express from 'express';
import { pool } from './db';
import { hashCpf } from './hash';
import { Request, Response} from 'express';
import { hashSenha } from './hash';

// const app= express() Isso cria o servidor.


const app = express()
app.use(express.json());
//---------------------
//roda toda vez que uma req (requisicao) chega, e apos isso ele envia a res (resposta)



// GET cliente, lista todos eles

app.get('/cliente', async (req: Request, res: Response) =>{
    try {
        const [rows] = await pool.query(
            `SELECT id_cliente, nome, telefone, endereco, cpf FROM cliente where active = 1`
        );
        res.status(200).json(rows);
    } 
    catch (erro){
    res.status(500).json({mensagem: 'Erro ao buscar os clientes'});
    }

});


// GET id do cliente - busca 1 cliente apenas
app.get('/cliente/:id', async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query(
            `SELECT id_cliente, nome, telefone, endereco, cpf FROM cliente where id_cliente = ? AND active = 1`,
            [req.params.id]
        );
        const cliente = (rows as any []) [0];

        if (!cliente){
            return res.status(404).json({mensagem: 'Cliente nao encontrado'});
        }
        res.status(200).json(cliente);

    } catch(erro){
        res.status(500).json({mensagem: 'Erro ao buscar cliente'});
    }
});


//POST /clientes - cria
app.post('/cliente', async (req: Request, res: Response) => {
try{
    const { id_cliente, nome, telefone, endereco, cpf} = req.body;
    const cpfHash = hashCpf(cpf);

    await pool.query(
        `Insert into cliente (id_cliente, nome, telefone, endereco, cpf, created_at, update_at, active) 
        VALUES (?, ?, ?, ?, ?, NOW(), NOW(), 1)`,
        [id_cliente, nome, telefone, endereco, cpfHash]
    );
    res.status(201).json({id_cliente, nome, telefone, endereco});

} catch (erro: any) {
    console.log(erro);
    if (erro.code === 'ER_DUP_ENTRY'){
        return res.status(409).json({mensagem: 'CPF ja foi cadastrado amigao'});
    }
    res.status(500).json({mensagem: 'Erro ao criar o cliente'});
}
});


// PUT /cliente - atualiza
app.put('/cliente/:id', async (req: Request, res: Response) => {
    try{
        const { nome, telefone, endereco, cpf } = req.body;
        const cpfHash = cpf ? hashCpf(cpf) : null;

        await pool.query(
            `UPDATE cliente
            SET nome = COALESCE (?, nome), telefone = COALESCE (?, telefone), endereco = COALESCE (?, endereco),
            cpf = COALESCE (?, cpf), update_at = NOW()
            WHERE id_cliente = ?`,
            [nome ?? null, telefone ?? null, endereco ?? null, cpfHash, req.params.id ]
        );
        res.status(200).json({mensagem: 'Cliente atualizado com sucesso patrao!'});
    } catch (erro) {
        res.status(500).json({mensagem: 'Erro ao atualizar o cliente'});
    }

});


// DELETE /cliente fica desativado = 0
app.delete('/cliente/:id', async (req: Request, res: Response)=>{
    try{
        await pool.query('UPDATE cliente SET active = 0 WHERE id_cliente = ?', [req.params.id]);
        res.status(200).json({mensagem: 'Cliente desativado com sucesso'});

    } catch(erro){
        res.status(500).json({mensagem: 'Erro ao desativar cliente'});
    }

});

// GET usuario, lista todos eles
app.get('/usuario', async (req: Request, res: Response) => {
    try{
        const [rows] = await pool.query(
            `SELECT id_usuario, nome, email, senha FROM usuario WHERE active = 1`);
        res.status(200).json(rows);

    } catch (erro){
        res.status(500).json({mensagem: 'Erro ao buscar usuarios!'});
    }

});
// GET id usuario - busca 1 usuario
app.get('/usuario/:id', async (req: Request, res: Response) => {
    try{
        const [rows] = await pool.query(
            `SELECT id_usuario, nome, email from usuario WHERE id_usuario = ? AND active = 1`,
            [req.params.id]
        );
        const usuario = (rows as any []) [0];
        if (!usuario){
            return res.status(404).json({mensagem: 'Usuario nao encontrado'});

        }
        res.status(200).json(usuario);

    } catch (erro) {
        res.status(500).json({mensagem: 'Erro ao buscar usuario'});
    }

});

// POST usuario - cria
app.post('/usuario', async (req: Request, res: Response)=> {
    try{
    const {id_usuario, nome, email, senha} = req.body;
    const senhaHash = hashSenha(senha);

    await pool.query(`Insert into usuario (id_usuario, nome, email, senha, created_at, update_at, active) 
        VALUES (?, ?, ?, ?, NOW(), NOW(), 1)`,
        [id_usuario, nome, email, senhaHash]
    );
    res.status(201).json({nome, email});
    } catch(erro: any){
        if (erro.code === 'ER_DUP_ENTRY'){
            return res.status(409).json({mensagem: 'Email ja cadastrado!'});
        }
        res.status(500).json({mensagem: 'Erro ao cadastrar usuario'});
        }
});
// PUT usuario - atualiza
app.put('/usuario/:id', async (req: Request, res: Response)=> {
    try {
        const {nome, email, senha} = req.body;
        const senhaHash = senha ? hashSenha(senha) : null;

        await pool.query(`UPDATE usuario
                SET nome = COALESCE (?, nome), email = COALESCE (?, email), 
                senha = COALESCE (?, senha), update_at = NOW()
                WHERE id_usuario = ?`,
                [nome ?? null, email ?? null, senhaHash ?? null, req.params.id]
            );
            res.status(200).json({mensagem: 'Usuario atualizado'});
            
    } catch(erro){
        res.status(500).json({ mensagem: 'Erro ao atualizar usuario' });
    }
});


// DELETE usuario fica desativado (active = 0)
app.delete('/usuario/:id', async (req: Request, res: Response)=> {
    try{
        await pool.query('UPDATE usuario SET active = 0 WHERE id_usuario = ?', [req.params.id]);
        res.status(200).json({mensagem: 'Usuario desativado com sucesso'});

    } catch(erro){
        res.status(500).json({mensagem: 'Erro ao desativar usuario'});
    }

});

app.listen(3000, () => console.log('rodando na porta 3000'));