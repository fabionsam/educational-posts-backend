# Educational Posts Backend

Este é o repositório do back-end para a aplicação de blogging voltada a postagens educacionais. O projeto foi desenvolvido em **Node.js** utilizando o framework **Express** e persistência em banco de dados **PostgreSQL** em desenvolvimento/produção (e **SQLite** em ambiente de testes), gerenciado pelo ORM **Sequelize**.

---

## 🛠️ Tecnologias Utilizadas

- **Node.js** (Ambiente de execução)
- **Express** (Framework web para roteamento de APIs)
- **Sequelize** (ORM para persistência e modelagem dos dados)
- **PostgreSQL** (Banco de dados relacional em desenvolvimento e produção)
- **SQLite** (Banco de dados relacional em memória para a suíte de testes)
- **JWT (JSON Web Token)** (Autenticação baseada em Bearer tokens)
- **Bcrypt.js** (Hasteamento e segurança de senhas)
- **Docker & Docker Compose** (Containerização e orquestração do ambiente)
- **Jest & Supertest** (Testes unitários e de integração com cobertura)

---

## 📐 Arquitetura do Projeto

O projeto segue um padrão MVC modificado para APIs RESTful, estruturando as responsabilidades de forma clara e isolada:

```
educational-posts-backend/
├── src/
│   ├── config/
│   │   └── database.js      # Configuração do banco de dados (PostgreSQL/SQLite)
│   ├── controllers/
│   │   ├── authController.js # Lógica de registro e login (JWT)
│   │   └── postController.js # Lógica de postagens (com controle de propriedade)
│   ├── middlewares/
│   │   ├── auth.js          # Validador de token JWT Bearer
│   │   └── role.js          # Validador de nível de acesso (RBAC)
│   ├── models/
│   │   ├── user.js          # Modelo do Usuário (Nome, Email, Senha, Role)
│   │   └── post.js          # Modelo do Post (Título, Conteúdo, Autor, userId)
│   ├── routes/
│   │   ├── authRoutes.js     # Rotas de Autenticação (/auth/register, /auth/login)
│   │   └── postRoutes.js     # Rotas de Postagens protegidas por autenticação
│   ├── app.js               # Configurações do app Express (middlewares, tratamentos de erro)
│   └── server.js            # Inicializador do servidor (sincronização do DB e porta)
├── tests/
│   └── post.test.js         # Testes automatizados de todas as rotas e permissões
├── Dockerfile               # Configuração do container Node da aplicação
├── docker-compose.yml       # Orquestração do Express e PostgreSQL
├── jest.config.js           # Configurações do framework de testes Jest
├── package.json             # Dependências e scripts do projeto
└── README.md                # Documentação do projeto
```

---

## 🔐 Níveis de Acesso (RBAC)

A aplicação conta com três níveis de acesso para garantir a segurança e a integridade do conteúdo educacional:

1. **Administrador (`administrador`)**:
   - Total acesso a todas as rotas e postagens.
   - Pode visualizar, criar, editar e excluir qualquer postagem de qualquer autor.
2. **Professor (`professor`)**:
   - Pode visualizar e buscar todas as postagens.
   - Pode criar novas postagens.
   - Pode editar e deletar **apenas as suas próprias postagens** (validação de propriedade).
3. **Aluno (`aluno`)**:
   - Pode visualizar e buscar postagens.
   - Não tem permissão para criar, editar ou excluir nenhuma postagem.

---

## 🐳 Executando com Docker (Recomendado)

A forma mais simples de rodar a aplicação com todas as dependências (Banco PostgreSQL + API Express) configuradas e prontas é utilizando o Docker Compose:

### 1. Iniciar os Containers (Desenvolvimento)
Execute o comando a seguir na pasta raiz do projeto:
```bash
docker-compose up --build
```
Isso iniciará o banco PostgreSQL na porta `5432` e o servidor Node.js na porta `3000` com suporte a **hot-reloading** (as alterações feitas localmente no seu código são atualizadas automaticamente dentro do contêiner).

### 2. Parar os Containers (Mantendo o Banco de Dados salvo)
```bash
docker-compose down
```

### 3. Reiniciar os Containers apagando o Banco de Dados (Reset total)
```bash
docker-compose down -v
```

---

## ⚙️ Instalação Local (Sem Docker)

Se preferir rodar a aplicação diretamente no seu ambiente local:

### 1. Pré-requisitos
- Node.js instalado (v18+)
- npm instalado (gerenciador de pacotes)
- Banco PostgreSQL instalado e rodando localmente

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
```bash
cp .env.example .env
```
Preencha os valores de conexão do seu PostgreSQL local e defina um segredo forte em `JWT_SECRET`.

### 3. Instalar Dependências
```bash
npm install
```

### 4. Executar em Desenvolvimento (Nodemon)
```bash
npm run dev
```
O servidor estará rodando em: `http://localhost:3000`

### 5. Executar em Produção
```bash
npm start
```

### 6. Executar Testes Automatizados (Jest)
A suíte de testes utiliza o SQLite em memória (`:memory:`) por padrão, o que significa que não é necessária nenhuma configuração de banco adicional para rodá-los:
```bash
npm run test
```
Para ver o relatório de cobertura de código (100% de cobertura nos fluxos principais):
```bash
npm run test:coverage
```

---

## 📖 Guia de Uso das APIs

> **Nota**: Todos os endpoints de postagens (`/posts/*`) requerem o cabeçalho HTTP:
> `Authorization: Bearer <seu_token_jwt>`

### 1. Rotas de Autenticação (`/auth`)

#### A. Registrar Usuário
Cria uma nova conta. Se o campo `role` não for enviado, o padrão assumido será `aluno`. Roles válidas: `administrador`, `professor`, `aluno`.

- **Método**: `POST`
- **Endpoint**: `/auth/register`
- **Corpo da Requisição (JSON)**:
```json
{
  "name": "Prof. Ana Paula",
  "email": "anapaula@escola.com",
  "password": "senhaSegura123",
  "role": "professor"
}
```
- **Resposta de Sucesso (`210 Created`)**:
```json
{
  "id": "e2a39281-7994-4d8e-9087-c0e86bfa3f80",
  "name": "Prof. Ana Paula",
  "email": "anapaula@escola.com",
  "role": "professor",
  "createdAt": "2026-07-07T04:29:40.000Z",
  "updatedAt": "2026-07-07T04:29:40.000Z"
}
```

#### B. Efetuar Login
Autentica o usuário e retorna o Token JWT.

- **Método**: `POST`
- **Endpoint**: `/auth/login`
- **Corpo da Requisição (JSON)**:
```json
{
  "email": "anapaula@escola.com",
  "password": "senhaSegura123"
}
```
- **Resposta de Sucesso (`200 OK`)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "e2a39281-7994-4d8e-9087-c0e86bfa3f80",
    "name": "Prof. Ana Paula",
    "email": "anapaula@escola.com",
    "role": "professor"
  }
}
```

---

### 2. Rotas de Postagens (`/posts`)

#### A. Listar Postagens (Todos os Perfis)
Retorna todas as postagens ordenadas por ordem de criação (mais recentes primeiro).

- **Método**: `GET`
- **Endpoint**: `/posts`
- **Cabeçalho**: `Authorization: Bearer <JWT_TOKEN>`
- **Resposta de Sucesso (`200 OK`)**:
```json
[
  {
    "id": "fa292723-cd8d-4a11-b75d-38bbd4ee713e",
    "title": "Introdução ao Express",
    "content": "Aprenda a estruturar rotas com Express no Node.js",
    "author": "Prof. Ana Paula",
    "userId": "e2a39281-7994-4d8e-9087-c0e86bfa3f80",
    "createdAt": "2026-07-07T04:29:40.000Z",
    "updatedAt": "2026-07-07T04:29:40.000Z"
  }
]
```

#### B. Buscar Postagens (Todos os Perfis)
Busca postagens por palavra-chave no título ou conteúdo de forma case-insensitive.

- **Método**: `GET`
- **Endpoint**: `/posts/search`
- **Cabeçalho**: `Authorization: Bearer <JWT_TOKEN>`
- **Parâmetros da Query**: `q` (Exemplo: `/posts/search?q=express`)

#### C. Criar Postagem (Apenas Professores e Administradores)
Permite criar uma postagem. O campo `author` é opcional (se omitido, o nome do usuário autenticado no JWT será assumido).

- **Método**: `POST`
- **Endpoint**: `/posts`
- **Cabeçalho**: `Authorization: Bearer <JWT_TOKEN>`
- **Corpo da Requisição (JSON)**:
```json
{
  "title": "Configuração do Sequelize",
  "content": "Aprenda a mapear tabelas no banco de dados."
}
```
- **Resposta de Sucesso (`201 Created`)**

#### D. Editar Postagem (Proprietário ou Administrador)
Permite atualizar dados de um post. Retorna `403 Forbidden` se outro professor tentar editar o post.

- **Método**: `PUT`
- **Endpoint**: `/posts/:id`
- **Cabeçalho**: `Authorization: Bearer <JWT_TOKEN>`

#### E. Excluir Postagem (Proprietário ou Administrador)
Exclui um post. Retorna `403 Forbidden` se outro professor tentar deletar o post.

- **Método**: `DELETE`
- **Endpoint**: `/posts/:id`
- **Cabeçalho**: `Authorization: Bearer <JWT_TOKEN>`

---

## 🚀 Integração Contínua e Entrega Contínua (CI/CD)

O repositório possui uma esteira automatizada configurada via **GitHub Actions** em [.github/workflows/ci-cd.yml](file:///.github/workflows/ci-cd.yml) para garantir a qualidade do código e entrega rápida.

### Estágios do Pipeline

1. **Estágio de Integração Contínua (CI - Testes)**:
   - Executa automaticamente a cada commit ou abertura de Pull Request voltados às branches `main` e `master`.
   - Inicializa uma máquina limpa Linux (Ubuntu), instala as dependências utilizando `npm ci` para maior consistência e roda toda a suíte de testes (`npm test`).
   - Se qualquer teste falhar, o pipeline avisa o desenvolvedor e impede o build/deploy automático.

2. **Estágio de Implantação Contínua (CD - Build & Publish)**:
   - Disparado automaticamente **apenas se a etapa de testes for concluída com sucesso** e se o gatilho for um commit direto (ou merge) nas branches `main` ou `master`.
   - Autentica-se de forma segura no registro de contêineres do GitHub (GitHub Container Registry - GHCR) via `ghcr.io` utilizando o token do próprio repositório (`secrets.GITHUB_TOKEN`).
   - Constrói a imagem Docker otimizada a partir do `Dockerfile`.
   - Publica a imagem no repositório de pacotes do GitHub com as tags correspondentes ao hash curto do commit (`sha-<hash>`) e `latest`.

### Acessando a imagem gerada pelo GitHub Actions
Você pode baixar a última versão gerada pela esteira de CI/CD executando:
```bash
docker pull ghcr.io/<seu-usuario-ou-organizacao>/educational-posts-backend:latest
```

