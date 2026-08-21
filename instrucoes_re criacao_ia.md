# Instruções Técnicas para Recriação do Sistema de Gestão Financeira Escolar em Outra IA

Este documento contém todas as especificações detalhadas, arquitetura, esquema de banco de dados, regras de negócio e stack tecnológica necessária para recriar o sistema de gestão financeira escolar em outra inteligência artificial.

## 1. Visão Geral do Sistema
O **Sistema de Gestão Financeira Escolar** é uma aplicação web completa voltada para o controle financeiro de instituições de ensino (escolas, cantinas, eventos, etc.). A interface é 100% em **português brasileiro**.

### Stack Tecnológica Sugerida
- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui, Lucide React icons, Recharts (gráficos), TanStack React Query, tRPC / API Client, Wouter (roteamento).
- **Backend**: Node.js, Express, tRPC 11 (ou REST API), Drizzle ORM.
- **Banco de Dados**: MySQL / TiDB.
- **Autenticação**: OAuth / Sessão baseada em cookies JWT.

---

## 2. Arquitetura e Módulos do Sistema

O sistema possui navegação lateral (Dashboard Layout) com os seguintes módulos principais:

1. **Dashboard Principal**:
   - Resumo financeiro em tempo real (saldo total por carteira, entradas do mês, saídas do mês, saldo a receber de fornecedores).
   - Gráficos dinâmicos com Recharts:
     - Fluxo de Caixa (entradas vs. saídas por período).
     - Distribuição de Entradas (por forma de recebimento ou carteira).
     - Evolução do fluxo financeiro.

2. **Módulo de Carteiras**:
   - Gerenciamento de contas financeiras (Caixa, Banco, PIX, etc.).
   - Atributos: `nome`, `tipo` (dinheiro, banco, cartao, outro), `descricao`, `saldoAtual` (atualizado automaticamente pelas movimentações), `ativa`.

3. **Módulo de Entradas (Receitas)**:
   - Registro de receitas e vendas do dia.
   - Atributos: `data` (com suporte a fuso horário local), `categoriaId` (opcional), `carteiraId` (obrigatório), `valor`, `descricao`, `formaRecebimento` (dinheiro, pix, cartao, outro).
   - Ação: Atualiza o saldo da carteira de destino (soma).

4. **Módulo de Saídas (Despesas)**:
   - Registro de despesas e compras.
   - Atributos: `data`, `categoriaId` (opcional), `carteiraId` (obrigatório), `valor`, `descricao`, `formaPagamento` (dinheiro, pix, cartao, boleto, outro).
   - Ação: Atualiza o saldo da carteira de origem (subtrai).

5. **Módulo de Fornecedores**:
   - Cadastro completo com `nome`, `contato`, `endereco`, `observacoes`.
   - **Gestão de Saldo a Receber / Pagamento**:
     - Cada fornecedor pode ter valores a receber/pagar acumulados de compras/produtos.
     - Botão **"Efetuar Pagamento"**: Permite pagar o saldo pendente do fornecedor escolhendo uma carteira de origem (ex: Dinheiro), o que debita automaticamente o saldo da carteira selecionada.

6. **Módulo de Produtos e Estoque**:
   - Cadastro de produtos com `nome`, `descricao`, `fornecedorId`, `quantidade` (estoque), `precoUnitario` (venda), `custoUnitario` (compra).
   - **Cálculo Automático**:
     - Custo Total em Estoque (`quantidade * custoUnitario`).
     - Valor Total de Venda (`quantidade * precoUnitario`).
     - Lucro Bruto (`valorTotalVenda - custoTotalEstoque`).
     - Margem de Lucro (% sobre o custo ou venda).

7. **Módulo de Relatórios**:
   - Filtros por Período / Mês / Ano.
   - Divisão detalhada de Entradas e Saídas por **Carteira**.
   - Exibição de:
     - **Total Bruto** (entradas e saídas brutas).
     - **Total Líquido** (entradas menos saídas).
     - **Pendente a Fornecedores** (valores em aberto).
   - Exportação de dados em formato **CSV**.

---

## 3. Modelo de Banco de Dados (Schema Drizzle / SQL)

### Tabela `users`
- `id` (int, PK, autoincrement)
- `openId` (varchar 64, unique)
- `name` (text)
- `email` (varchar 320)
- `role` (enum: 'user', 'admin')
- `createdAt`, `updatedAt`, `lastSignedIn` (timestamp)

### Tabela `carteiras`
- `id` (int, PK, autoincrement)
- `userId` (int, FK -> users.id)
- `nome` (varchar 100, not null)
- `descricao` (text)
- `saldoAtual` (decimal 12,2, default 0.00)
- `tipo` (varchar 50: 'dinheiro', 'banco', 'cartao', 'outro')
- `ativa` (boolean, default true)
- `criadaEm`, `atualizadaEm` (timestamp)

### Tabela `fornecedores`
- `id` (int, PK, autoincrement)
- `userId` (int, FK -> users.id)
- `nome` (varchar 150, not null)
- `contato` (varchar 100)
- `endereco` (text)
- `observacoes` (text)
- `saldoPendente` (decimal 12,2, default 0.00)
- `criadaEm`, `atualizadaEm` (timestamp)

### Tabela `produtos`
- `id` (int, PK, autoincrement)
- `userId` (int, FK -> users.id)
- `fornecedorId` (int, FK -> fornecedores.id, nullable)
- `nome` (varchar 150, not null)
- `descricao` (text)
- `quantidade` (int, default 0)
- `precoUnitario` (decimal 12,2, not null)
- `custoUnitario` (decimal 12,2, default 0.00)
- `criadaEm`, `atualizadaEm` (timestamp)

### Tabela `entradas`
- `id` (int, PK, autoincrement)
- `userId` (int, FK -> users.id)
- `carteiraId` (int, FK -> carteiras.id, not null)
- `categoriaId` (int, nullable)
- `valor` (decimal 12,2, not null)
- `descricao` (text)
- `data` (timestamp, not null)
- `formaRecebimento` (varchar 50: 'dinheiro', 'pix', 'cartao', 'outro')
- `criadaEm` (timestamp)

### Tabela `saidas`
- `id` (int, PK, autoincrement)
- `userId` (int, FK -> users.id)
- `carteiraId` (int, FK -> carteiras.id, not null)
- `fornecedorId` (int, FK -> fornecedores.id, nullable)
- `categoriaId` (int, nullable)
- `valor` (decimal 12,2, not null)
- `descricao` (text)
- `data` (timestamp, not null)
- `formaPagamento` (varchar 50: 'dinheiro', 'pix', 'cartao', 'boleto', 'outro')
- `criadaEm` (timestamp)

---

## 4. Instruções de Prompt para a Nova IA

Quando for fornecer essas instruções para outra IA, você pode colar o seguinte prompt resumido junto com este arquivo:

> *"Por favor, crie um sistema web completo de gestão financeira escolar seguindo exatamente a arquitetura, o modelo de banco de dados e as regras descritas neste documento. A interface deve ser 100% em português brasileiro, utilizando React, Tailwind CSS, shadcn/ui e gráficos Recharts. O sistema deve incluir: Dashboard com gráficos de fluxo de caixa e distribuição, Módulo de Carteiras com saldo dinâmico, Entradas e Saídas com categorias opcionais e datas locais corretas, Fornecedores com saldo a pagar e botão de pagamento que debita da carteira, Produtos com cálculo de lucro bruto/líquido, e Relatórios divididos por carteira com exportação CSV. Além disso, importarei um arquivo JSON contendo todos os dados cadastrados anteriormente para popular o banco de dados."*
