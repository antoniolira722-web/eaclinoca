# Instruções para corrigir a gravação de cadastros no MariaDB

## Objetivo

Corrigir o sistema Node.js da aplicação `lira.lirasystema.com` para que os cadastros feitos pelo formulário sejam gravados no banco MariaDB da Hostinger, em vez de permanecerem apenas em memória ou em arquivos JSON.

A alteração deve ser feita no projeto conectado ao GitHub e depois publicada por um novo deployment.

## Banco de dados existente

Usar o banco já criado. Não criar outro banco e não alterar o banco `u395389377_ninho`.

```text
Banco:   u395389377_liraapp
Usuário: u395389377_lirauser
Host:    127.0.0.1
Porta:   3306
Tabela:  clientes
```

A senha nunca deve ser colocada no código, no GitHub ou neste arquivo. Ela deve ser lida por variável de ambiente.

## Diagnóstico do código atual

O arquivo atual `server.ts`:

- Usa `memoryStore` para manter dados em memória.
- Salva dados em arquivos JSON dentro de `.data`.
- Usa as rotas `/api/sync` para sincronizar os dados da clínica.
- Não possui conexão com `mysql2`.
- Não possui `INSERT INTO clientes`.
- Não possui uma rota `POST /api/clientes`.

Por isso, criar o banco e a tabela não é suficiente. O backend e o formulário precisam ser alterados.

## Arquivos que precisam ser alterados

Alterar estes arquivos no repositório:

```text
server.ts
package.json
package-lock.json
```

Também localizar e alterar o arquivo do formulário dentro de `src/`, `src/pages/` ou `src/components/`.

Para encontrá-lo, pesquisar no GitHub por:

```text
/api/sync
handleSubmit
onSubmit
pacientes
```

O arquivo correto é o que contém o formulário e a função executada ao clicar em cadastrar.

## 1. Dependência do banco

Na raiz do projeto, executar:

```bash
npm install mysql2
```

Isso deve atualizar o `package.json` e o `package-lock.json`.

Não remover as dependências existentes do Vite, React, Express ou Firebase sem confirmar que não são usadas.

## 2. Variáveis de ambiente no Hostinger

Configurar as seguintes variáveis no Node.js da aplicação. Os valores devem ser inseridos no ambiente do deployment, não no GitHub:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=u395389377_liraapp
DB_USER=u395389377_lirauser
DB_PASSWORD=SENHA_REAL_DO_USUARIO_DO_BANCO
NODE_ENV=production
```

`DB_PASSWORD` deve conter a senha atual de `u395389377_lirauser`.

Nunca colocar a senha em:

- `server.ts`
- `package.json`
- arquivos `.env` enviados ao GitHub
- mensagens de log
- respostas da API

## 3. Conexão no `server.ts`

Adicionar o import junto dos outros imports:

```ts
import mysql from 'mysql2/promise';
```

Depois da criação do `app` e do middleware JSON, adicionar:

```ts
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function verificarBanco() {
  try {
    await db.query('SELECT 1');
    console.log('Conexão com o MariaDB estabelecida');
  } catch (erro) {
    console.error('Erro ao conectar ao MariaDB:', erro);
    throw erro;
  }
}

verificarBanco().catch(() => {
  console.error('A aplicação iniciou sem conseguir acessar o banco');
});
```

Não imprimir a senha nos logs.

## 4. Rota para salvar clientes

Adicionar uma rota `POST /api/clientes` antes das rotas finais de inicialização do servidor:

```ts
app.post('/api/clientes', async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;

    if (!nome || !email) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Nome e e-mail são obrigatórios'
      });
    }

    const [resultado] = await db.execute(
      `INSERT INTO clientes (nome, email, telefone)
       VALUES (?, ?, ?)`,
      [nome, email, telefone || null]
    );

    res.status(201).json({
      sucesso: true,
      id: (resultado as any).insertId
    });
  } catch (erro: any) {
    console.error('Erro ao salvar cliente:', erro.message);

    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        sucesso: false,
        erro: 'Este e-mail já está cadastrado'
      });
    }

    res.status(500).json({
      sucesso: false,
      erro: 'Não foi possível salvar o cadastro'
    });
  }
});
```

Usar parâmetros `?` na consulta. Nunca montar SQL concatenando nome, e-mail ou telefone recebidos do formulário.

## 5. Formulário do frontend

No arquivo do formulário, localizar o trecho que atualmente chama `/api/sync`, grava em estado local ou apenas atualiza `memoryStore`.

Substituir o envio do cadastro por:

```ts
const resposta = await fetch('/api/clientes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nome,
    email,
    telefone
  })
});

const resultado = await resposta.json();

if (!resposta.ok) {
  throw new Error(resultado.erro || 'Erro ao realizar cadastro');
}

console.log('Cadastro salvo com ID:', resultado.id);
```

Adaptar os nomes das variáveis ao formulário real. O envio deve acontecer somente depois de validar os campos obrigatórios.

Após sucesso, mostrar uma mensagem ao usuário e limpar o formulário. Em caso de erro, mostrar a mensagem sem perder os dados digitados.

## 6. Compatibilidade com `/api/sync`

O sistema atual usa `/api/sync` para dados completos da clínica, como pacientes, agenda, sessões e financeiro.

Não remover essa rota sem migrar todas as telas que a utilizam.

Para o primeiro objetivo, implementar `/api/clientes` para o cadastro e manter `/api/sync` funcionando. Depois, em uma etapa separada, migrar os dados de `ClinicData` para tabelas próprias ou para uma tabela de documentos JSON no MariaDB.

A tabela `clientes` não deve ser usada automaticamente para representar todos os dados de `ClinicData` sem uma decisão de modelagem.

## 7. Testes locais antes do deployment

Executar:

```bash
npm run build
```

O build deve terminar sem erros.

Se existir um script de testes, executar também:

```bash
npm test
```

Testar a API com um cliente HTTP ou pelo formulário. Exemplo de corpo esperado:

```json
{
  "nome": "Cliente de teste",
  "email": "cliente-teste@example.com",
  "telefone": "11999999999"
}
```

Não usar e-mail real de cliente para testes.

## 8. GitHub e deployment

Depois de validar o código:

```bash
git add package.json package-lock.json server.ts src/
git commit -m "Corrige persistencia de cadastros no MariaDB"
git push origin main
```

Na Hostinger, iniciar um novo deployment da branch usada pelo projeto.

Confirmar nos logs a mensagem:

```text
Conexão com o MariaDB estabelecida
```

Não considerar o deployment concluído apenas porque o build terminou. Também é necessário testar uma requisição real de cadastro.

## 9. Teste final no phpMyAdmin

1. Abrir o banco `u395389377_liraapp`.
2. Abrir a tabela `clientes`.
3. Clicar em **Procurar**.
4. Fazer um cadastro de teste pelo sistema.
5. Atualizar a tela do phpMyAdmin.
6. Confirmar que uma nova linha apareceu.

O registro inserido manualmente anteriormente serve somente para validar a tabela. O teste final precisa ser feito pelo formulário do sistema.

## Critérios de conclusão

A correção só está concluída quando todos estes itens forem verdadeiros:

- O build termina sem erro.
- O app inicia sem erro de conexão.
- A API `POST /api/clientes` responde com HTTP 201 para um cadastro válido.
- O e-mail duplicado retorna HTTP 409.
- Dados inválidos retornam HTTP 400.
- A nova linha aparece em `u395389377_liraapp.clientes`.
- Nenhuma senha ou credencial aparece no código ou nos logs.
- A rota `/api/sync` existente continua funcionando para as outras partes do sistema.