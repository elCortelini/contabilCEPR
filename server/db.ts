import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      openId TEXT UNIQUE,
      name TEXT,
      email TEXT,
      loginMethod TEXT,
      role TEXT DEFAULT 'user',
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
  `);
}

export default db;
