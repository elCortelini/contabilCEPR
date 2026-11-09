import assert from 'node:assert/strict';
import { initDb } from '../server/db.js';
import db from '../server/db.js';

console.log('🧪 Iniciando testes de integridade e cálculos do Contábil CEPR...');

// 1. Inicialização do Banco
initDb();
assert.ok(db, 'Instância do banco SQLite deve estar ativa');

// 2. Integridade das Tabelas Principais
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
const tableNames = tables.map(t => t.name);

const requiredTables = [
  'users',
  'carteiras',
  'entradas',
  'saidas',
  'fornecedores',
  'produtos',
  'categorias',
  'turmas',
  'alunos',
  'mensalidades'
];

for (const reqTable of requiredTables) {
  assert.ok(tableNames.includes(reqTable), `Tabela obrigatória '${reqTable}' deve existir no SQLite`);
}
console.log('✅ Estrutura de tabelas verificada com sucesso.');

// 3. Validação dos Registros de Carteiras e Saldos
const carteiras = db.prepare('SELECT * FROM carteiras').all() as any[];
assert.ok(carteiras.length > 0, 'Deve haver ao menos uma carteira cadastrada');

// 4. Verificação de Integridade dos Lançamentos (Entradas vs Saídas)
const totalEntradas = db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM entradas').get() as { total: number };
const totalSaidas = db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM saidas').get() as { total: number };

assert.ok(typeof totalEntradas.total === 'number' && totalEntradas.total >= 0, 'Total de entradas deve ser número positivo');
assert.ok(typeof totalSaidas.total === 'number' && totalSaidas.total >= 0, 'Total de saídas deve ser número positivo');

console.log(`✅ Lançamentos verificados: Entradas (R$ ${totalEntradas.total.toFixed(2)}) | Saídas (R$ ${totalSaidas.total.toFixed(2)})`);

// 5. Teste de Consistência de Turnos nas Entradas
const entradasComTurno = db.prepare("SELECT COUNT(*) as count FROM entradas WHERE turno IS NOT NULL").get() as { count: number };
const totalEntradasCount = db.prepare("SELECT COUNT(*) as count FROM entradas").get() as { count: number };
assert.strictEqual(entradasComTurno.count, totalEntradasCount.count, 'Todas as entradas devem ter campo turno preenchido');

console.log('✅ Verificação de integridade dos turnos validada.');

// 6. Teste de Módulos Escolares (Turmas, Alunos, Mensalidades)
const turmasCount = db.prepare("SELECT COUNT(*) as count FROM turmas").get() as { count: number };
const alunosCount = db.prepare("SELECT COUNT(*) as count FROM alunos").get() as { count: number };
console.log(`✅ Módulo escolar: ${turmasCount.count} turmas e ${alunosCount.count} alunos registrados.`);

// 7. Teste de Requisições HTTP da API Express
process.env.NODE_ENV = 'test';
const { app } = await import('../server/index.js');
const server = app.listen(0);
const port = (server.address() as any).port;

try {
  const dashRes = await fetch(`http://127.0.0.1:${port}/api/dashboard`);
  assert.strictEqual(dashRes.status, 200, 'GET /api/dashboard deve responder 200');
  const dashData = await dashRes.json();
  assert.ok(dashData.saldoTotal !== undefined, 'Dashboard deve conter saldoTotal');
  assert.ok(dashData.totalEntradas !== undefined, 'Dashboard deve conter totalEntradas');
  assert.ok(Array.isArray(dashData.distribuicaoCarteiras), 'Dashboard deve conter distribuicaoCarteiras como array');

  const carteirasRes = await fetch(`http://127.0.0.1:${port}/api/carteiras`);
  assert.strictEqual(carteirasRes.status, 200, 'GET /api/carteiras deve responder 200');

  console.log('✅ Endpoints HTTP (/api/dashboard, /api/carteiras) testados com sucesso.');
} finally {
  server.close();
}

console.log('\n🎉 Todos os testes de integridade do Contábil CEPR passaram com 100% de sucesso!');
