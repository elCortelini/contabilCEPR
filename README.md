# 🏫 Contábil CEPR - Sistema de Gestão Financeira Escolar

Aplicação web completa para controle financeiro, gestão de caixas/bancos, entradas (receitas), saídas (despesas), fornecedores, produtos/estoque e relatórios consolidados para instituições de ensino.

Developed with ❤️ & precision by **Antigravity AI**.

---

## 🚀 Funcionalidades

- **Dashboard Principal**:
  - Resumo de Saldo Total, Entradas, Saídas e Pendências a Fornecedores.
  - Gráfico de Evolução do Fluxo de Caixa (Entradas vs. Saídas) com **Recharts**.
  - Gráfico de Distribuição do patrimônio por carteira.
  - Timeline com últimas movimentações financeiras em tempo real.

- **Módulo de Carteiras**:
  - Gestão de Caixas Físicos (Dinheiro) e Contas Bancárias (Banco BB, Conta APP, etc.).
  - Saldos dinâmicos recalculados automaticamente a cada lançamento.

- **Módulo de Receitas & Despesas**:
  - Registro de Entradas (vendas da cantina, mensalidades, eventos) e Saídas (insumos, despesas operacionais).
  - Filtros inteligentes por carteira, período e busca por palavra-chave.
  - Suporte a múltiplas formas de pagamento (Dinheiro, PIX, Cartão, Boleto).
  - Estorno e ajuste automático de saldo ao remover ou editar lançamentos.

- **Módulo de Fornecedores**:
  - Cadastro de parceiros comerciais e controle de saldos a pagar.
  - Botão **"Efetuar Pagamento"**: realiza o débito direto na carteira escolhida e abate do saldo pendente do fornecedor.

- **Módulo de Produtos & Estoque**:
  - Cadastro de itens da cantina e uniformes.
  - Cálculos automáticos de **Custo Total em Estoque**, **Valor Total de Venda**, **Lucro Bruto** e **Margem %**.

- **Relatórios & Exportação**:
  - Demonstrativo por carteira e resumo consolidado (DRE).
  - Exportação instantânea dos lançamentos em formato **CSV (UTF-8 com BOM para Excel)**.

---

## 📊 Base de Dados Migrada (100% Preservada)

A aplicação inclui um script de importação automatizado que popula o banco SQLite com a base inteira:

| Entidade | Registros Migrados | Status |
| :--- | :---: | :---: |
| **Usuários** | `3` | ✅ OK |
| **Carteiras** | `4` | ✅ OK |
| **Entradas (Receitas)** | `99` | ✅ OK |
| **Saídas (Despesas)** | `55` | ✅ OK |
| **Integridade de Saldos** | R$ 401,53 (Caixa Físico) / R$ 2.767,97 (Banco BB) | ✅ 100% Batido |

---

## 🛠️ Stack Tecnológica

- **Backend**: Node.js, Express, TypeScript, SQLite (`better-sqlite3`).
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React Icons, Recharts.
- **Automação**: Script de auto-seeding e importação JSON (`server/import-data.ts`).

---

## ⚙️ Como Executar Localmente

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Iniciar em modo de desenvolvimento** (Backend + Frontend em paralelo):
   ```bash
   npm run dev
   ```

3. **Reimportar base de dados manualmente** (se necessário):
   ```bash
   npm run import
   ```

4. **Gerar versão de produção**:
   ```bash
   npm run build
   npm start
   ```

Acesse em seu navegador: `http://localhost:3000` (desenvolvimento) ou `http://localhost:5000` (produção).
