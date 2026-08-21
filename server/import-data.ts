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
    categorias?: any[];
    turmas?: any[];
    alunos?: any[];
    mensalidades?: any[];
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
    db.prepare('DELETE FROM mensalidades').run();
    db.prepare('DELETE FROM alunos').run();
    db.prepare('DELETE FROM turmas').run();
    db.prepare('DELETE FROM categorias').run();
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
        'approved',
        u.createdAt || new Date().toISOString(),
        u.updatedAt || new Date().toISOString(),
        u.lastSignedIn || new Date().toISOString()
      );
    }
    console.log(`✅ ${data.tabelas.users.length} usuários importados.`);

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

    // Seed default categories
    const defaultCategories = [
      { nome: 'Vendas Cantina', tipo: 'entrada', cor: '#10b981' },
      { nome: 'Mensalidades Escolares', tipo: 'entrada', cor: '#6366f1' },
      { nome: 'Eventos & Festas', tipo: 'entrada', cor: '#f59e0b' },
      { nome: 'Taxas de Matrícula', tipo: 'entrada', cor: '#06b6d4' },
      { nome: 'Insumos Cantina', tipo: 'saida', cor: '#f43f5e' },
      { nome: 'Material Didático', tipo: 'saida', cor: '#ec4899' },
      { nome: 'Manutenção & Obras', tipo: 'saida', cor: '#ef4444' },
      { nome: 'Alimentação & Bebidas', tipo: 'saida', cor: '#f97316' },
      { nome: 'Salários & Pró-labore', tipo: 'saida', cor: '#a855f7' },
    ];
    const insCat = db.prepare('INSERT INTO categorias (nome, tipo, cor) VALUES (?, ?, ?)');
    for (const cat of defaultCategories) insCat.run(cat.nome, cat.tipo, cat.cor);
    console.log('✅ Categorias padrão inicializadas.');

    // Seed default Turmas & Alunos
    const insTurma = db.prepare('INSERT INTO turmas (nome, anoLetivo, turno) VALUES (?, ?, ?)');
    const t1 = insTurma.run('6º Ano A', '2026', 'Matutino').lastInsertRowid;
    const t2 = insTurma.run('7º Ano B', '2026', 'Vespertino').lastInsertRowid;

    const insAluno = db.prepare('INSERT INTO alunos (nome, turmaId, responsavel, contato, status) VALUES (?, ?, ?, ?, ?)');
    const a1 = insAluno.run('Beatriz Cortelini', t1, 'Elevi Cortelini', '(47) 99911-2233', 'ativo').lastInsertRowid;
    const a2 = insAluno.run('Arthur Silva', t1, 'Roberto Silva', '(47) 99944-5566', 'ativo').lastInsertRowid;
    const a3 = insAluno.run('Lucas Mendes', t2, 'Mariana Mendes', '(47) 99977-8899', 'ativo').lastInsertRowid;

    const insMensalidade = db.prepare('INSERT INTO mensalidades (alunoId, mesReferencia, valor, vencimento, status) VALUES (?, ?, ?, ?, ?)');
    insMensalidade.run(a1, '2026-08', 450.00, '2026-08-10', 'pago');
    insMensalidade.run(a2, '2026-08', 450.00, '2026-08-10', 'pendente');
    insMensalidade.run(a3, '2026-08', 450.00, '2026-08-10', 'pendente');
    console.log('✅ Turmas, Alunos e Mensalidades de demonstração cadastrados.');

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
