import db, { initDb } from './db.js';
import fs from 'fs';
import path from 'path';

interface ExportData {
  formato: string;
  exportadoEm: string;
  tabelas: {
    users: any[];
    carteiras: any[];
    entradas: any[];
    saidas: any[];
    fornecedores?: any[];
    produtos?: any[];
  };
}

export function importData() {
  initDb();

  const jsonPath = path.resolve(process.cwd(), 'dados_financeiros_completos.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Arquivo dados_financeiros_completos.json não encontrado!');
    return false;
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data: ExportData = JSON.parse(raw);

  console.log('🔄 Iniciando importação de dados para o SQLite...');

  const transaction = db.transaction(() => {
    // Clear old data
    db.prepare('DELETE FROM saidas').run();
    db.prepare('DELETE FROM entradas').run();
    db.prepare('DELETE FROM carteiras').run();
    db.prepare('DELETE FROM users').run();
    db.prepare('DELETE FROM fornecedores').run();
    db.prepare('DELETE FROM produtos').run();

    // Insert Users
    const insertUser = db.prepare(`
      INSERT INTO users (id, openId, name, email, loginMethod, role, status, createdAt, updatedAt, lastSignedIn)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const u of data.tabelas.users || []) {
      insertUser.run(
        u.id,
        u.openId || null,
        u.name || null,
        u.email || null,
        u.loginMethod || 'google',
        u.role || 'user',
        'approved', // existing imported users are approved by default
        u.createdAt || new Date().toISOString(),
        u.updatedAt || new Date().toISOString(),
        u.lastSignedIn || new Date().toISOString()
      );
    }
    console.log(`✅ ${data.tabelas.users.length} usuários importados (Admin & Usuários Aprovados).`);

    // Map existing carteiras
    const carteiraIdsSet = new Set<number>();
    const insertCarteira = db.prepare(`
      INSERT INTO carteiras (id, userId, nome, descricao, saldoAtual, tipo, ativa, criadaEm, atualizadaEm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const c of data.tabelas.carteiras || []) {
      carteiraIdsSet.add(c.id);
      insertCarteira.run(
        c.id,
        c.userId || 1,
        c.nome,
        c.descricao || '',
        parseFloat(c.saldoAtual || '0'),
        c.tipo || 'dinheiro',
        c.ativa ? 1 : 0,
        c.criadaEm || new Date().toISOString(),
        c.atualizadaEm || new Date().toISOString()
      );
    }

    // Ensure all referenced carteiraIds in entradas/saidas exist
    const referencedCarteiraIds = new Set<number>();
    for (const e of data.tabelas.entradas || []) referencedCarteiraIds.add(e.carteiraId);
    for (const s of data.tabelas.saidas || []) referencedCarteiraIds.add(s.carteiraId);

    for (const cid of referencedCarteiraIds) {
      if (!carteiraIdsSet.has(cid)) {
        console.log(`ℹ️ Criando carteira histórica de suporte para ID #${cid}`);
        insertCarteira.run(
          cid,
          1,
          `Conta PIX / Caixa #${cid}`,
          'Carteira histórica vinculada aos lançamentos',
          0.00,
          'pix',
          1,
          new Date().toISOString(),
          new Date().toISOString()
        );
        carteiraIdsSet.add(cid);
      }
    }

    console.log(`✅ ${carteiraIdsSet.size} carteiras ativas preparadas.`);

    // Insert Entradas
    const insertEntrada = db.prepare(`
      INSERT INTO entradas (id, userId, carteiraId, categoriaId, valor, descricao, formaRecebimento, fornecedorId, produtoId, comprovante, data, criadaEm, atualizadaEm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const e of data.tabelas.entradas || []) {
      insertEntrada.run(
        e.id,
        e.userId || 1,
        e.carteiraId,
        e.categoriaId || null,
        parseFloat(e.valor),
        e.descricao || '',
        e.formaRecebimento || 'dinheiro',
        e.fornecedorId || null,
        e.produtoId || null,
        e.comprovante || null,
        e.data,
        e.criadaEm || new Date().toISOString(),
        e.atualizadaEm || new Date().toISOString()
      );
    }
    console.log(`✅ ${data.tabelas.entradas.length} entradas importadas.`);

    // Insert Saidas
    const insertSaida = db.prepare(`
      INSERT INTO saidas (id, userId, carteiraId, categoriaId, valor, descricao, formaPagamento, fornecedorId, produtoId, data, criadaEm, atualizadaEm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const s of data.tabelas.saidas || []) {
      insertSaida.run(
        s.id,
        s.userId || 1,
        s.carteiraId,
        s.categoriaId || null,
        parseFloat(s.valor),
        s.descricao || '',
        s.formaPagamento || 'dinheiro',
        s.fornecedorId || null,
        s.produtoId || null,
        s.data,
        s.criadaEm || new Date().toISOString(),
        s.atualizadaEm || new Date().toISOString()
      );
    }
    console.log(`✅ ${data.tabelas.saidas.length} saídas importadas.`);

    // Recalculate dynamic balances for all wallets
    const carteiras = db.prepare('SELECT id, nome, saldoAtual FROM carteiras').all() as any[];
    for (const cart of carteiras) {
      const sumEntradas = db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM entradas WHERE carteiraId = ?').get(cart.id) as any;
      const sumSaidas = db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM saidas WHERE carteiraId = ?').get(cart.id) as any;
      const saldoCalculado = (sumEntradas.total || 0) - (sumSaidas.total || 0);

      db.prepare('UPDATE carteiras SET saldoAtual = ? WHERE id = ?').run(saldoCalculado, cart.id);
      console.log(`💰 Carteira "${cart.nome}" (ID: ${cart.id}) -> Saldo recalculado: R$ ${saldoCalculado.toFixed(2)}`);
    }
  });

  transaction();
  console.log('🎉 Importação concluída com 100% de sucesso e integridade!');
  return true;
}

// Run directly if called as a script
importData();
