import { Router } from 'express';
import db from './db.js';
import { importData } from './import-data.js';

const router = Router();

// Re-run import
router.post('/importar', (req, res) => {
  try {
    const success = importData();
    res.json({ success, message: 'Dados reimportados com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Backup Export Endpoint
router.get('/backup/export', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users').all();
    const carteiras = db.prepare('SELECT * FROM carteiras').all();
    const entradas = db.prepare('SELECT * FROM entradas').all();
    const saidas = db.prepare('SELECT * FROM saidas').all();
    const fornecedores = db.prepare('SELECT * FROM fornecedores').all();
    const produtos = db.prepare('SELECT * FROM produtos').all();
    const categorias = db.prepare('SELECT * FROM categorias').all();
    const turmas = db.prepare('SELECT * FROM turmas').all();
    const alunos = db.prepare('SELECT * FROM alunos').all();
    const mensalidades = db.prepare('SELECT * FROM mensalidades').all();

    const backupData = {
      formato: 'sistema-financeiro-escolar-export-v2',
      exportadoEm: new Date().toISOString(),
      tabelas: {
        users,
        carteiras,
        entradas,
        saidas,
        fornecedores,
        produtos,
        categorias,
        turmas,
        alunos,
        mensalidades
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=backup_financeiro_cepr.json');
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Categorias
router.get('/categorias', (req, res) => {
  try {
    const categorias = db.prepare('SELECT * FROM categorias ORDER BY nome ASC').all();
    res.json(categorias);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/categorias', (req, res) => {
  try {
    const { nome, tipo, cor } = req.body;
    const result = db.prepare('INSERT INTO categorias (nome, tipo, cor) VALUES (?, ?, ?)').run(nome, tipo || 'entrada', cor || '#6366f1');
    res.json({ id: result.lastInsertRowid, message: 'Categoria criada com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/categorias/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM categorias WHERE id = ?').run(req.params.id);
    res.json({ message: 'Categoria excluída com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Turmas & Alunos
router.get('/turmas', (req, res) => {
  try {
    const turmas = db.prepare('SELECT * FROM turmas ORDER BY nome ASC').all();
    res.json(turmas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/turmas', (req, res) => {
  try {
    const { nome, anoLetivo, turno } = req.body;
    const result = db.prepare('INSERT INTO turmas (nome, anoLetivo, turno) VALUES (?, ?, ?)').run(nome, anoLetivo || '2026', turno || 'Matutino');
    res.json({ id: result.lastInsertRowid, message: 'Turma cadastrada com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/alunos', (req, res) => {
  try {
    const alunos = db.prepare(`
      SELECT a.*, t.nome as turmaNome
      FROM alunos a
      LEFT JOIN turmas t ON a.turmaId = t.id
      ORDER BY a.nome ASC
    `).all();
    res.json(alunos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/alunos', (req, res) => {
  try {
    const { nome, turmaId, responsavel, contato } = req.body;
    const result = db.prepare('INSERT INTO alunos (nome, turmaId, responsavel, contato, status) VALUES (?, ?, ?, ?, "ativo")')
      .run(nome, turmaId || null, responsavel || '', contato || '');
    res.json({ id: result.lastInsertRowid, message: 'Aluno cadastrado com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mensalidades
router.get('/mensalidades', (req, res) => {
  try {
    const mensalidades = db.prepare(`
      SELECT m.*, a.nome as alunoNome, a.responsavel, t.nome as turmaNome
      FROM mensalidades m
      JOIN alunos a ON m.alunoId = a.id
      LEFT JOIN turmas t ON a.turmaId = t.id
      ORDER BY m.vencimento DESC, m.id DESC
    `).all();
    res.json(mensalidades);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/mensalidades', (req, res) => {
  try {
    const { alunoId, mesReferencia, valor, vencimento } = req.body;
    const result = db.prepare('INSERT INTO mensalidades (alunoId, mesReferencia, valor, vencimento, status) VALUES (?, ?, ?, ?, "pendente")')
      .run(alunoId, mesReferencia, parseFloat(valor), vencimento);
    res.json({ id: result.lastInsertRowid, message: 'Mensalidade gerada com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/mensalidades/:id/pagar', (req, res) => {
  try {
    const { carteiraId, formaRecebimento } = req.body;
    const mensId = parseInt(req.params.id);
    const now = new Date().toISOString();

    const mens = db.prepare('SELECT m.*, a.nome as alunoNome FROM mensalidades m JOIN alunos a ON m.alunoId = a.id WHERE m.id = ?').get(mensId) as any;
    if (!mens) return res.status(404).json({ error: 'Mensalidade não encontrada' });

    const transaction = db.transaction(() => {
      // Registra a entrada na carteira
      const entradaResult = db.prepare(`
        INSERT INTO entradas (userId, carteiraId, valor, descricao, formaRecebimento, data, criadaEm, atualizadaEm)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?)
      `).run(carteiraId, mens.valor, `Mensalidade ${mens.mesReferencia} - Aluno: ${mens.alunoNome}`, formaRecebimento || 'pix', now, now, now);

      // Credita na carteira
      db.prepare('UPDATE carteiras SET saldoAtual = saldoAtual + ? WHERE id = ?').run(mens.valor, carteiraId);

      // Marca mensalidade como paga
      db.prepare('UPDATE mensalidades SET status = "pago", entradaId = ? WHERE id = ?').run(entradaResult.lastInsertRowid, mensId);
    });

    transaction();
    res.json({ message: 'Mensalidade quitada e valor creditado na carteira com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Auth & Login Endpoint
router.post('/auth/login', (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' });

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user) {
      const now = new Date().toISOString();
      const openId = Math.random().toString(36).substring(2, 15);
      const result = db.prepare(`
        INSERT INTO users (openId, name, email, loginMethod, role, status, createdAt, updatedAt, lastSignedIn)
        VALUES (?, ?, ?, 'google', 'user', 'pending', ?, ?, ?)
      `).run(openId, name || email.split('@')[0], email, now, now, now);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    } else {
      const now = new Date().toISOString();
      db.prepare('UPDATE users SET lastSignedIn = ? WHERE id = ?').run(now, user.id);
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Users Management (Admin)
router.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users ORDER BY role DESC, id ASC').all();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id/approve', (req, res) => {
  try {
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET status = "approved", updatedAt = ? WHERE id = ?').run(now, req.params.id);
    res.json({ message: 'Acesso do usuário aprovado com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id/block', (req, res) => {
  try {
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET status = "blocked", updatedAt = ? WHERE id = ?').run(now, req.params.id);
    res.json({ message: 'Acesso do usuário bloqueado com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id/role', (req, res) => {
  try {
    const { role } = req.body;
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET role = ?, updatedAt = ? WHERE id = ?').run(role, now, req.params.id);
    res.json({ message: 'Função do usuário atualizada!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard metrics & charts data
router.get('/dashboard', (req, res) => {
  try {
    const carteiras = db.prepare('SELECT * FROM carteiras WHERE ativa = 1').all() as any[];
    const saldoTotal = carteiras.reduce((acc, c) => acc + (c.saldoAtual || 0), 0);

    const totalEntradas = db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM entradas').get() as any;
    const totalSaidas = db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM saidas').get() as any;
    const pendenteFornecedores = db.prepare('SELECT COALESCE(SUM(saldoPendente), 0) as total FROM fornecedores').get() as any;

    // Monthly cashflow data
    const entradasPorMes = db.prepare(`
      SELECT strftime('%Y-%m', data) as mes, SUM(valor) as entradas
      FROM entradas
      GROUP BY strftime('%Y-%m', data)
    `).all() as any[];

    const saidasPorMes = db.prepare(`
      SELECT strftime('%Y-%m', data) as mes, SUM(valor) as saidas
      FROM saidas
      GROUP BY strftime('%Y-%m', data)
    `).all() as any[];

    const mesesMap = new Map<string, { mes: string; entradas: number; saidas: number; liquido: number }>();

    for (const e of entradasPorMes) {
      if (!e.mes) continue;
      mesesMap.set(e.mes, { mes: e.mes, entradas: e.entradas || 0, saidas: 0, liquido: e.entradas || 0 });
    }

    for (const s of saidasPorMes) {
      if (!s.mes) continue;
      const existing = mesesMap.get(s.mes) || { mes: s.mes, entradas: 0, saidas: 0, liquido: 0 };
      existing.saidas = s.saidas || 0;
      existing.liquido = existing.entradas - existing.saidas;
      mesesMap.set(s.mes, existing);
    }

    const fluxoCaixa = Array.from(mesesMap.values()).sort((a, b) => a.mes.localeCompare(b.mes));

    // Distribution by wallet
    const distribuicaoCarteiras = carteiras.map(c => ({
      id: c.id,
      nome: c.nome,
      saldo: c.saldoAtual,
      tipo: c.tipo
    }));

    // Recent transactions (top 10)
    const entradasRecentes = db.prepare(`
      SELECT e.id, 'entrada' as tipo, e.data, e.valor, e.descricao, e.formaRecebimento as forma, c.nome as carteiraNome
      FROM entradas e
      JOIN carteiras c ON e.carteiraId = c.id
      ORDER BY e.data DESC LIMIT 10
    `).all();

    const saidasRecentes = db.prepare(`
      SELECT s.id, 'saida' as tipo, s.data, s.valor, s.descricao, s.formaPagamento as forma, c.nome as carteiraNome
      FROM saidas s
      JOIN carteiras c ON s.carteiraId = c.id
      ORDER BY s.data DESC LIMIT 10
    `).all();

    const ultimasMovimentacoes = [...entradasRecentes, ...saidasRecentes]
      .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 10);

    // Alerts
    const produtosEstoqueBaixo = db.prepare('SELECT * FROM produtos WHERE quantidade <= 5').all();
    const fornecedoresPendentes = db.prepare('SELECT * FROM fornecedores WHERE saldoPendente > 0').all();

    res.json({
      saldoTotal,
      totalEntradas: totalEntradas.total,
      totalSaidas: totalSaidas.total,
      pendenteFornecedores: pendenteFornecedores.total,
      fluxoCaixa,
      distribuicaoCarteiras,
      ultimasMovimentacoes,
      alertas: {
        produtosEstoqueBaixo,
        fornecedoresPendentes
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Carteiras CRUD
router.get('/carteiras', (req, res) => {
  try {
    const carteiras = db.prepare(`
      SELECT c.*,
        (SELECT COALESCE(SUM(valor), 0) FROM entradas WHERE carteiraId = c.id) as totalEntradas,
        (SELECT COALESCE(SUM(valor), 0) FROM saidas WHERE carteiraId = c.id) as totalSaidas
      FROM carteiras c
      ORDER BY c.nome ASC
    `).all();
    res.json(carteiras);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/carteiras', (req, res) => {
  try {
    const { nome, descricao, tipo, saldoAtual } = req.body;
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO carteiras (userId, nome, descricao, saldoAtual, tipo, ativa, criadaEm, atualizadaEm)
      VALUES (1, ?, ?, ?, ?, 1, ?, ?)
    `).run(nome, descricao || '', parseFloat(saldoAtual || 0), tipo || 'dinheiro', now, now);

    res.json({ id: result.lastInsertRowid, message: 'Carteira criada com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/carteiras/:id', (req, res) => {
  try {
    const { nome, descricao, tipo, ativa } = req.body;
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE carteiras
      SET nome = ?, descricao = ?, tipo = ?, ativa = ?, atualizadaEm = ?
      WHERE id = ?
    `).run(nome, descricao, tipo, ativa ? 1 : 0, now, req.params.id);

    res.json({ message: 'Carteira atualizada com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Entradas CRUD
router.get('/entradas', (req, res) => {
  try {
    const { carteiraId, inicio, fim } = req.query;
    let query = `
      SELECT e.*, c.nome as carteiraNome, cat.nome as categoriaNome, cat.cor as categoriaCor
      FROM entradas e
      JOIN carteiras c ON e.carteiraId = c.id
      LEFT JOIN categorias cat ON e.categoriaId = cat.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (carteiraId) {
      query += ` AND e.carteiraId = ?`;
      params.push(carteiraId);
    }
    if (inicio) {
      query += ` AND e.data >= ?`;
      params.push(inicio);
    }
    if (fim) {
      query += ` AND e.data <= ?`;
      params.push(fim);
    }

    query += ` ORDER BY e.data DESC, e.id DESC`;
    const entradas = db.prepare(query).all(...params);
    res.json(entradas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/entradas', (req, res) => {
  try {
    const { carteiraId, categoriaId, valor, descricao, formaRecebimento, data } = req.body;
    const now = new Date().toISOString();
    const val = parseFloat(valor);

    const transaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO entradas (userId, carteiraId, categoriaId, valor, descricao, formaRecebimento, data, criadaEm, atualizadaEm)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(carteiraId, categoriaId || null, val, descricao || '', formaRecebimento || 'dinheiro', data || now, now, now);

      db.prepare('UPDATE carteiras SET saldoAtual = saldoAtual + ? WHERE id = ?').run(val, carteiraId);
      return result.lastInsertRowid;
    });

    const id = transaction();
    res.json({ id, message: 'Receita registrada com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/entradas/:id', (req, res) => {
  try {
    const entrada = db.prepare('SELECT * FROM entradas WHERE id = ?').get(req.params.id) as any;
    if (!entrada) return res.status(404).json({ error: 'Entrada não encontrada' });

    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM entradas WHERE id = ?').run(req.params.id);
      db.prepare('UPDATE carteiras SET saldoAtual = saldoAtual - ? WHERE id = ?').run(entrada.valor, entrada.carteiraId);
    });

    transaction();
    res.json({ message: 'Entrada removida e saldo da carteira atualizado!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Saidas CRUD
router.get('/saidas', (req, res) => {
  try {
    const { carteiraId, inicio, fim } = req.query;
    let query = `
      SELECT s.*, c.nome as carteiraNome, f.nome as fornecedorNome, cat.nome as categoriaNome, cat.cor as categoriaCor
      FROM saidas s
      JOIN carteiras c ON s.carteiraId = c.id
      LEFT JOIN fornecedores f ON s.fornecedorId = f.id
      LEFT JOIN categorias cat ON s.categoriaId = cat.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (carteiraId) {
      query += ` AND s.carteiraId = ?`;
      params.push(carteiraId);
    }
    if (inicio) {
      query += ` AND s.data >= ?`;
      params.push(inicio);
    }
    if (fim) {
      query += ` AND s.data <= ?`;
      params.push(fim);
    }

    query += ` ORDER BY s.data DESC, s.id DESC`;
    const saidas = db.prepare(query).all(...params);
    res.json(saidas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/saidas', (req, res) => {
  try {
    const { carteiraId, categoriaId, valor, descricao, formaPagamento, fornecedorId, data } = req.body;
    const now = new Date().toISOString();
    const val = parseFloat(valor);

    const transaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO saidas (userId, carteiraId, categoriaId, valor, descricao, formaPagamento, fornecedorId, data, criadaEm, atualizadaEm)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(carteiraId, categoriaId || null, val, descricao || '', formaPagamento || 'dinheiro', fornecedorId || null, data || now, now, now);

      db.prepare('UPDATE carteiras SET saldoAtual = saldoAtual - ? WHERE id = ?').run(val, carteiraId);
      return result.lastInsertRowid;
    });

    const id = transaction();
    res.json({ id, message: 'Despesa registrada com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/saidas/:id', (req, res) => {
  try {
    const saida = db.prepare('SELECT * FROM saidas WHERE id = ?').get(req.params.id) as any;
    if (!saida) return res.status(404).json({ error: 'Saída não encontrada' });

    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM saidas WHERE id = ?').run(req.params.id);
      db.prepare('UPDATE carteiras SET saldoAtual = saldoAtual + ? WHERE id = ?').run(saida.valor, saida.carteiraId);
    });

    transaction();
    res.json({ message: 'Saída removida e saldo estornado para a carteira!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fornecedores
router.get('/fornecedores', (req, res) => {
  try {
    const fornecedores = db.prepare('SELECT * FROM fornecedores ORDER BY nome ASC').all();
    res.json(fornecedores);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/fornecedores', (req, res) => {
  try {
    const { nome, contato, endereco, observacoes, saldoPendente } = req.body;
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO fornecedores (userId, nome, contato, endereco, observacoes, saldoPendente, criadaEm, atualizadaEm)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?)
    `).run(nome, contato || '', endereco || '', observacoes || '', parseFloat(saldoPendente || 0), now, now);

    res.json({ id: result.lastInsertRowid, message: 'Fornecedor cadastrado com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/fornecedores/:id/pagar', (req, res) => {
  try {
    const { carteiraId, valor, formaPagamento } = req.body;
    const fornecedorId = parseInt(req.params.id);
    const val = parseFloat(valor);
    const now = new Date().toISOString();

    const fornecedor = db.prepare('SELECT * FROM fornecedores WHERE id = ?').get(fornecedorId) as any;
    if (!fornecedor) return res.status(404).json({ error: 'Fornecedor não encontrado' });

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO saidas (userId, carteiraId, fornecedorId, valor, descricao, formaPagamento, data, criadaEm, atualizadaEm)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(carteiraId, fornecedorId, val, `Pagamento a Fornecedor: ${fornecedor.nome}`, formaPagamento || 'dinheiro', now, now, now);

      db.prepare('UPDATE carteiras SET saldoAtual = saldoAtual - ? WHERE id = ?').run(val, carteiraId);

      const novoPendente = Math.max(0, (fornecedor.saldoPendente || 0) - val);
      db.prepare('UPDATE fornecedores SET saldoPendente = ?, atualizadaEm = ? WHERE id = ?').run(novoPendente, now, fornecedorId);
    });

    transaction();
    res.json({ message: 'Pagamento efetuado e debitado da carteira com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Produtos & Estoque
router.get('/produtos', (req, res) => {
  try {
    const produtos = db.prepare(`
      SELECT p.*, f.nome as fornecedorNome,
        (p.quantidade * p.custoUnitario) as custoTotalEstoque,
        (p.quantidade * p.precoUnitario) as valorTotalVenda,
        ((p.quantidade * p.precoUnitario) - (p.quantidade * p.custoUnitario)) as lucroBruto
      FROM produtos p
      LEFT JOIN fornecedores f ON p.fornecedorId = f.id
      ORDER BY p.nome ASC
    `).all();
    res.json(produtos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/produtos', (req, res) => {
  try {
    const { nome, descricao, fornecedorId, quantidade, precoUnitario, custoUnitario } = req.body;
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO produtos (userId, fornecedorId, nome, descricao, quantidade, precoUnitario, custoUnitario, criadaEm, atualizadaEm)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fornecedorId || null,
      nome,
      descricao || '',
      parseInt(quantidade || 0),
      parseFloat(precoUnitario || 0),
      parseFloat(custoUnitario || 0),
      now,
      now
    );

    res.json({ id: result.lastInsertRowid, message: 'Produto cadastrado com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export CSV report
router.get('/relatorios/export-csv', (req, res) => {
  try {
    const entradas = db.prepare(`
      SELECT 'Entrada' as tipo, e.id, e.data, c.nome as carteira, e.valor, e.formaRecebimento as forma, e.descricao
      FROM entradas e JOIN carteiras c ON e.carteiraId = c.id
    `).all();

    const saidas = db.prepare(`
      SELECT 'Saida' as tipo, s.id, s.data, c.nome as carteira, s.valor, s.formaPagamento as forma, s.descricao
      FROM saidas s JOIN carteiras c ON s.carteiraId = c.id
    `).all();

    const all = [...entradas, ...saidas].sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime());

    let csv = 'Tipo;ID;Data;Carteira;Valor (R$);Forma;Descrição\n';
    for (const row of all as any[]) {
      const dataFmt = row.data ? new Date(row.data).toLocaleDateString('pt-BR') : '';
      const descClean = (row.descricao || '').replace(/;/g, ',').replace(/\n/g, ' ');
      csv += `${row.tipo};${row.id};${dataFmt};${row.carteira};${row.valor.toFixed(2)};${row.forma};"${descClean}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio_financeiro_cepr.csv');
    res.send('\uFEFF' + csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
