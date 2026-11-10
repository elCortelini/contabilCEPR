import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');

let db: any;

try {
  const { default: Database } = await import('better-sqlite3');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = OFF');
} catch (betterSqliteErr) {
  // Fallback nativo: Node 22/24 built-in node:sqlite
  const { DatabaseSync } = await import('node:sqlite');
  db = new DatabaseSync(dbPath);
  db.pragma = function (sql: string) {
    db.exec(`PRAGMA ${sql}`);
  };
  db.transaction = function (fn: (...args: any[]) => any) {
    return function (...args: any[]) {
      db.exec('BEGIN');
      try {
        const result = fn(...args);
        db.exec('COMMIT');
        return result;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    };
  };
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = OFF');
}

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      openId TEXT UNIQUE,
      name TEXT,
      email TEXT,
      loginMethod TEXT DEFAULT 'google',
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'approved',
      createdAt TEXT,
      updatedAt TEXT,
      lastSignedIn TEXT
    );

    CREATE TABLE IF NOT EXISTS carteiras (
      id INTEGER PRIMARY KEY,
      userId INTEGER,
      nome TEXT NOT NULL,
      descricao TEXT,
      saldoAtual REAL DEFAULT 0.00,
      tipo TEXT DEFAULT 'dinheiro',
      ativa INTEGER DEFAULT 1,
      criadaEm TEXT,
      atualizadaEm TEXT
    );

    CREATE TABLE IF NOT EXISTS entradas (
      id INTEGER PRIMARY KEY,
      userId INTEGER,
      carteiraId INTEGER NOT NULL,
      categoriaId INTEGER,
      valor REAL NOT NULL,
      descricao TEXT,
      formaRecebimento TEXT DEFAULT 'dinheiro',
      turno TEXT DEFAULT 'Matutino',
      fornecedorId INTEGER,
      produtoId INTEGER,
      comprovante TEXT,
      data TEXT NOT NULL,
      criadaEm TEXT,
      atualizadaEm TEXT
    );

    CREATE TABLE IF NOT EXISTS saidas (
      id INTEGER PRIMARY KEY,
      userId INTEGER,
      carteiraId INTEGER NOT NULL,
      categoriaId INTEGER,
      valor REAL NOT NULL,
      descricao TEXT,
      formaPagamento TEXT DEFAULT 'dinheiro',
      fornecedorId INTEGER,
      produtoId INTEGER,
      data TEXT NOT NULL,
      criadaEm TEXT,
      atualizadaEm TEXT
    );

    CREATE TABLE IF NOT EXISTS fornecedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      nome TEXT NOT NULL,
      contato TEXT,
      endereco TEXT,
      observacoes TEXT,
      saldoPendente REAL DEFAULT 0.00,
      criadaEm TEXT,
      atualizadaEm TEXT
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      fornecedorId INTEGER,
      nome TEXT NOT NULL,
      descricao TEXT,
      quantidade INTEGER DEFAULT 0,
      precoUnitario REAL NOT NULL,
      custoUnitario REAL DEFAULT 0.00,
      criadaEm TEXT,
      atualizadaEm TEXT
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      tipo TEXT CHECK(tipo IN ('entrada', 'saida')),
      cor TEXT DEFAULT '#6366f1'
    );

    CREATE TABLE IF NOT EXISTS turmas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      anoLetivo TEXT DEFAULT '2026',
      turno TEXT DEFAULT 'Matutino'
    );

    CREATE TABLE IF NOT EXISTS alunos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      turmaId INTEGER,
      responsavel TEXT,
      contato TEXT,
      status TEXT DEFAULT 'ativo',
      FOREIGN KEY (turmaId) REFERENCES turmas (id)
    );

    CREATE TABLE IF NOT EXISTS mensalidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alunoId INTEGER NOT NULL,
      mesReferencia TEXT NOT NULL,
      valor REAL NOT NULL,
      vencimento TEXT,
      status TEXT DEFAULT 'pendente',
      entradaId INTEGER,
      FOREIGN KEY (alunoId) REFERENCES alunos (id)
    );

    CREATE TABLE IF NOT EXISTS comandas_natal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigoPedido TEXT,
      estudante TEXT NOT NULL,
      turma TEXT,
      professor TEXT,
      responsavel TEXT NOT NULL,
      telefone TEXT NOT NULL,
      itensJson TEXT NOT NULL,
      total REAL NOT NULL,
      formaPagamento TEXT NOT NULL DEFAULT 'pix',
      status TEXT DEFAULT 'aguardando_comprovante',
      ticketEntregue INTEGER DEFAULT 0,
      comprovante TEXT,
      motivoRecusa TEXT,
      pixPayload TEXT,
      criadaEm TEXT,
      atualizadaEm TEXT
    );
  `);

  // Safely add turno column if missing in existing database
  try {
    const tableInfo = db.prepare("PRAGMA table_info(entradas)").all() as any[];
    const hasTurno = tableInfo.some(c => c.name === 'turno');
    if (!hasTurno) {
      db.exec("ALTER TABLE entradas ADD COLUMN turno TEXT DEFAULT 'Matutino'");
      console.log("✅ Coluna 'turno' adicionada à tabela entradas.");
    }
  } catch (e) {
    console.error("Erro ao verificar coluna turno:", e);
  }

  // Safely add status column to users if missing in existing database
  try {
    const userInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
    const hasStatus = userInfo.some(c => c.name === 'status');
    if (!hasStatus) {
      db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'approved'");
      console.log("✅ Coluna 'status' adicionada à tabela users.");
    }
  } catch (e) {
    console.error("Erro ao verificar coluna status na tabela users:", e);
  }

  // Safely add columns to comandas_natal if missing in existing database
  try {
    const comandasInfo = db.prepare("PRAGMA table_info(comandas_natal)").all() as any[];
    const colNames = comandasInfo.map(c => c.name);

    if (!colNames.includes('codigoPedido')) {
      db.exec("ALTER TABLE comandas_natal ADD COLUMN codigoPedido TEXT");
      // Preencher códigos para comandas legadas
      db.exec("UPDATE comandas_natal SET codigoPedido = 'NL-' || printf('%04d', id) WHERE codigoPedido IS NULL");
      console.log("✅ Coluna 'codigoPedido' adicionada à tabela comandas_natal.");
    }
    if (!colNames.includes('status')) {
      db.exec("ALTER TABLE comandas_natal ADD COLUMN status TEXT DEFAULT 'pago'");
      db.exec("UPDATE comandas_natal SET status = CASE WHEN ticketEntregue = 1 THEN 'entregue' ELSE 'pago' END WHERE status IS NULL");
      console.log("✅ Coluna 'status' adicionada à tabela comandas_natal.");
    }
    if (!colNames.includes('comprovante')) {
      db.exec("ALTER TABLE comandas_natal ADD COLUMN comprovante TEXT");
      console.log("✅ Coluna 'comprovante' adicionada à tabela comandas_natal.");
    }
    if (!colNames.includes('motivoRecusa')) {
      db.exec("ALTER TABLE comandas_natal ADD COLUMN motivoRecusa TEXT");
      console.log("✅ Coluna 'motivoRecusa' adicionada à tabela comandas_natal.");
    }
  } catch (e) {
    console.error("Erro ao verificar colunas da tabela comandas_natal:", e);
  }
}

export default db;
