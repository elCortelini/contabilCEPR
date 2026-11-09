import db, { initDb } from './db.js';
import { MOCK_COMANDAS_NATAL } from '../src/data/mockComandasNatal.js';

initDb();

console.log('🎅 Populando tabela comandas_natal com 20 comandas fictícias...');

const insert = db.prepare(`
  INSERT INTO comandas_natal (
    id, estudante, turma, professor, responsavel, telefone, itensJson, total, formaPagamento, ticketEntregue, criadaEm, atualizadaEm
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
  )
`);

const tx = db.transaction(() => {
  db.prepare('DELETE FROM comandas_natal').run();

  for (const c of MOCK_COMANDAS_NATAL) {
    insert.run(
      c.id,
      c.estudante,
      c.turma,
      c.professor,
      c.responsavel,
      c.telefone,
      JSON.stringify(c.itens),
      c.total,
      c.formaPagamento,
      c.ticketEntregue ? 1 : 0,
      c.criadaEm,
      c.criadaEm
    );
  }
});

tx();

const count = db.prepare('SELECT COUNT(*) as total FROM comandas_natal').get() as { total: number };
console.log(`✅ Sucesso! Total de comandas no banco SQLite: ${count.total}`);
