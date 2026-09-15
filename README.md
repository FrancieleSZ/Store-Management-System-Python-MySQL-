# Sistema de Loja de Vendas
### Aplicação de linha de comando (CLI) para controle de vendas e funcionários, com persistência em MySQL

---

## 1. Sobre o Projeto

- **Nome:** Sistema de Loja de Vendas
- **Tipo:** Aplicação de console (CLI) em Python, integrada a um banco de dados MySQL.
- **Contexto:** Projeto pessoal desenvolvido para gerenciar o dia a dia de uma loja de roupas — registro de vendas, cálculo automático do valor com desconto, cadastro de funcionários e consulta de relatórios.
- **Motivação:** Substituir o controle manual/informal de vendas e funcionários por um sistema simples, com dados centralizados em um banco relacional, evitando erros de cálculo e perda de informações.

---

## 2. Funcionalidades

- RF01. **Cadastrar nova venda**, informando marca da roupa, preço, ID da atendente responsável e desconto aplicado.
- RF02. **Calcular automaticamente o valor total da compra**, com base no preço da roupa e no percentual de desconto informado.
- RF03. **Exibir relatório de vendas**, listando todas as vendas registradas e o lucro total acumulado.
- RF04. **Cadastrar novo funcionário**, com nome completo, data de nascimento, endereço, sexo e telefone.
- RF05. **Pesquisar funcionário por ID**, retornando seus dados cadastrais completos.
- RF06. **Validação de entradas do usuário** (campos obrigatórios não podem ficar em branco; valores numéricos são validados antes de seguir).
- RF07. **Menu interativo**, permitindo ao usuário navegar entre as opções sem precisar reiniciar o programa.

---

## 3. Tecnologias Utilizadas

| Tecnologia | Finalidade |
|---|---|
| **Python 3** | Linguagem principal da aplicação |
| **mysql-connector-python** | Conexão e execução de comandos SQL no banco MySQL |
| **python-dotenv** | Carregamento de variáveis sensíveis (senha do banco) a partir de um arquivo `.env`, fora do código-fonte |
| **MySQL** | Armazenamento persistente de vendas e funcionários |

---

## 4. Estrutura do Banco de Dados

O sistema utiliza um banco de dados chamado `loja_de_vendas`, com duas tabelas principais.

### Tabela: `funcionarios`

| Coluna | Descrição | Observação |
|---|---|---|
| id | Identificador único do funcionário | Gerado automaticamente (auto-incremento), usado como ID da atendente nas vendas |
| nomes | Nome completo do funcionário | Obrigatório |
| nascimento | Data de nascimento | Formato `AAAA-MM-DD` |
| endereco | Endereço do funcionário | — |
| sexo | Sexo do funcionário | — |
| telefone | Telefone de contato | — |

### Tabela: `relatorios`

| Coluna | Descrição | Observação |
|---|---|---|
| id | Identificador único da venda | Gerado automaticamente |
| marca_da_roupa | Marca da peça vendida | Obrigatório |
| preco_da_roupa | Preço original da roupa | Deve ser maior que zero |
| id_do_atendente | ID do funcionário que realizou a venda | Referencia `funcionarios.id` |
| desconto | Percentual de desconto aplicado | Informado em número inteiro (ex.: 10 = 10%) |
| total_da_compra | Valor final da venda | Calculado como `preco_da_roupa * (desconto / 100)` |

> **Sugestão de melhoria:** hoje `id_do_atendente` não é uma foreign key formal — considerar adicionar essa restrição no banco para garantir integridade referencial entre `relatorios` e `funcionarios`.

### Script de criação das tabelas (referência)

```sql
CREATE DATABASE IF NOT EXISTS loja_de_vendas;
USE loja_de_vendas;

CREATE TABLE funcionarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomes VARCHAR(255) NOT NULL,
    nascimento DATE,
    endereco VARCHAR(255),
    sexo VARCHAR(20),
    telefone VARCHAR(20)
);

CREATE TABLE relatorios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    marca_da_roupa VARCHAR(255) NOT NULL,
    preco_da_roupa DECIMAL(10,2) NOT NULL,
    id_do_atendente INT NOT NULL,
    desconto INT NOT NULL,
    total_da_compra DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_do_atendente) REFERENCES funcionarios(id)
);
```

---

## 5. Como Executar

### 5.1 Pré-requisitos

- Python 3.8 ou superior instalado
- MySQL instalado e em execução localmente
- Banco de dados `loja_de_vendas` criado (ver script SQL acima)

### 5.2 Instalação

```bash
# Clonar o repositório
git clone <url-do-seu-repositorio>
cd <pasta-do-projeto>

# Instalar dependências
pip install mysql-connector-python python-dotenv
```

### 5.3 Configuração

Criar um arquivo `.env` na raiz do projeto com a senha do banco de dados:

```
DB_PASSWORD=sua_senha_aqui
```

> O `.env` **não deve ser versionado** no Git — adicione-o ao `.gitignore` para não expor a senha do banco.

### 5.4 Execução

```bash
python nome_do_arquivo.py
```

---

## 6. Uso do Sistema

Ao rodar o programa, o menu principal é exibido com as seguintes opções:

```
SISTEMA DE LOJA
1 - Cadastrar nova venda
2 - Exibir relatório de vendas
3 - Cadastrar novo funcionário
4 - Pesquisar atendente por ID
5 - Sair
```

Basta digitar o número da opção desejada e seguir as instruções exibidas no console.

---

## 7. Melhorias Futuras

- Adicionar autenticação/login para diferenciar acesso de atendentes e administradores.
- Validar o ID da atendente informado na venda contra a tabela `funcionarios` (hoje ele é aceito sem checagem de existência).
- Adicionar opção de editar/excluir vendas e funcionários cadastrados.
- Migrar a interface de console para uma interface gráfica ou web.
- Adicionar testes automatizados para as funções de validação e cálculo.

---

## 8. Autor

- Desenvolvido por: *FrancieleSZ*
- Projeto pessoal, com fins de estudo e aplicação prática de Python + MySQL.
