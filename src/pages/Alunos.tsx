import React, { useEffect, useState } from 'react';
import { GraduationCap, Plus, DollarSign, CheckCircle2, Clock, Users, School } from 'lucide-react';
import { api } from '../services/api';

export const Alunos: React.FC = () => {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [mensalidades, setMensalidades] = useState<any[]>([]);
  const [carteiras, setCarteiras] = useState<any[]>([]);

  const [modalAlunoOpen, setModalAlunoOpen] = useState(false);
  const [modalTurmaOpen, setModalTurmaOpen] = useState(false);
  const [modalMensOpen, setModalMensOpen] = useState(false);
  const [modalPayOpen, setModalPayOpen] = useState(false);
  const [selectedMensalidade, setSelectedMensalidade] = useState<any>(null);

  const [alunoForm, setAlunoForm] = useState({ nome: '', turmaId: '', responsavel: '', contato: '' });
  const [turmaForm, setTurmaForm] = useState({ nome: '', anoLetivo: '2026', turno: 'Matutino' });
  const [mensForm, setMensForm] = useState({ alunoId: '', mesReferencia: '2026-08', valor: '450.00', vencimento: '2026-08-10' });
  const [payForm, setPayForm] = useState({ carteiraId: '', formaRecebimento: 'pix' });

  const loadData = async () => {
    const aList = await api.getAlunos();
    setAlunos(aList);

    const tList = await api.getTurmas();
    setTurmas(tList);
    if (tList.length > 0 && !alunoForm.turmaId) {
      setAlunoForm((prev) => ({ ...prev, turmaId: tList[0].id.toString() }));
    }

    const mList = await api.getMensalidades();
    setMensalidades(mList);

    const cList = await api.getCarteiras();
    setCarteiras(cList);
    if (cList.length > 0 && !payForm.carteiraId) {
      setPayForm((prev) => ({ ...prev, carteiraId: cList[0].id.toString() }));
    }

    if (aList.length > 0 && !mensForm.alunoId) {
      setMensForm((prev) => ({ ...prev, alunoId: aList[0].id.toString() }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createAluno(alunoForm);
    setModalAlunoOpen(false);
    setAlunoForm({ nome: '', turmaId: turmas[0]?.id?.toString() || '', responsavel: '', contato: '' });
    loadData();
  };

  const handleCreateTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createTurma(turmaForm);
    setModalTurmaOpen(false);
    setTurmaForm({ nome: '', anoLetivo: '2026', turno: 'Matutino' });
    loadData();
  };

  const handleCreateMensalidade = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createMensalidade(mensForm);
    setModalMensOpen(false);
    loadData();
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMensalidade) return;

    await api.payMensalidade(selectedMensalidade.id, parseInt(payForm.carteiraId), payForm.formaRecebimento);
    setModalPayOpen(false);
    setSelectedMensalidade(null);
    loadData();
  };

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const totalMensalidadesArrecadadas = mensalidades.filter((m) => m.status === 'pago').reduce((acc, m) => acc + (parseFloat(m.valor) || 0), 0);
  const totalMensalidadesPendentes = mensalidades.filter((m) => m.status !== 'pago').reduce((acc, m) => acc + (parseFloat(m.valor) || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            Alunos, Turmas & Controle de Mensalidades
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Gestão de alunos por turma e quitação de mensalidades com débito/crédito na carteira</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalTurmaOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            + Turma
          </button>
          <button
            onClick={() => setModalAlunoOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            + Aluno
          </button>
          <button
            onClick={() => setModalMensOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition"
          >
            + Mensalidade
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-indigo-500">
          <span className="text-xs font-semibold text-slate-400 uppercase">Alunos Cadastrados</span>
          <h3 className="text-2xl font-black text-white mt-1">{alunos.length} Alunos</h3>
          <p className="text-[10px] text-slate-400 mt-1">{turmas.length} turmas ativas</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-slate-400 uppercase">Mensalidades Recebidas</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatBrl(totalMensalidadesArrecadadas)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Valores creditados na carteira</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-slate-400 uppercase">Mensalidades a Receber</span>
          <h3 className="text-2xl font-black text-amber-400 mt-1">{formatBrl(totalMensalidadesPendentes)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Valores pendentes dos responsáveis</p>
        </div>
      </div>

      {/* Mensalidades Table */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          Controle de Mensalidades
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Aluno</th>
                <th className="py-3.5 px-4">Responsável</th>
                <th className="py-3.5 px-4">Turma</th>
                <th className="py-3.5 px-4">Mês Mês/Ano</th>
                <th className="py-3.5 px-4 text-right">Valor</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {mensalidades.map((m) => (
                <tr key={m.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3.5 px-4 font-bold text-white">{m.alunoNome}</td>
                  <td className="py-3.5 px-4 text-slate-300">{m.responsavel || '—'}</td>
                  <td className="py-3.5 px-4 text-slate-400 font-medium">{m.turmaNome || '—'}</td>
                  <td className="py-3.5 px-4 font-semibold text-indigo-300">{m.mesReferencia}</td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-400">{formatBrl(m.valor)}</td>
                  <td className="py-3.5 px-4">
                    {m.status === 'pago' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Pago
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                        <Clock className="w-3 h-3" /> Pendente
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {m.status !== 'pago' ? (
                      <button
                        onClick={() => {
                          setSelectedMensalidade(m);
                          setModalPayOpen(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shadow-sm transition cursor-pointer"
                      >
                        Baixar Pagamento
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium">Quitado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Turma */}
      {modalTurmaOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl space-y-4 border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Cadastrar Turma</h3>
            <form onSubmit={handleCreateTurma} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Turma</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 6º Ano A, Infantil 4"
                  value={turmaForm.nome}
                  onChange={(e) => setTurmaForm({ ...turmaForm, nome: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ano Letivo</label>
                  <input
                    type="text"
                    value={turmaForm.anoLetivo}
                    onChange={(e) => setTurmaForm({ ...turmaForm, anoLetivo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Turno</label>
                  <select
                    value={turmaForm.turno}
                    onChange={(e) => setTurmaForm({ ...turmaForm, turno: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Integral">Integral</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalTurmaOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white">Salvar Turma</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Aluno */}
      {modalAlunoOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl space-y-4 border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Cadastrar Aluno</h3>
            <form onSubmit={handleCreateAluno} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo do Aluno</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do aluno"
                  value={alunoForm.nome}
                  onChange={(e) => setAlunoForm({ ...alunoForm, nome: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Turma</label>
                <select
                  value={alunoForm.turmaId}
                  onChange={(e) => setAlunoForm({ ...alunoForm, turmaId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome} ({t.turno})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Responsável</label>
                <input
                  type="text"
                  placeholder="Nome do pai/mãe/responsável"
                  value={alunoForm.responsavel}
                  onChange={(e) => setAlunoForm({ ...alunoForm, responsavel: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone / Contato</label>
                <input
                  type="text"
                  placeholder="(47) 99999-9999"
                  value={alunoForm.contato}
                  onChange={(e) => setAlunoForm({ ...alunoForm, contato: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalAlunoOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white">Salvar Aluno</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Mensalidade */}
      {modalMensOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl space-y-4 border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Gerar Cobrança de Mensalidade</h3>
            <form onSubmit={handleCreateMensalidade} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Aluno</label>
                <select
                  value={mensForm.alunoId}
                  onChange={(e) => setMensForm({ ...mensForm, alunoId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {alunos.map((a) => (
                    <option key={a.id} value={a.id}>{a.nome} ({a.turmaNome})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mês Referência</label>
                  <input
                    type="month"
                    value={mensForm.mesReferencia}
                    onChange={(e) => setMensForm({ ...mensForm, mesReferencia: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={mensForm.valor}
                    onChange={(e) => setMensForm({ ...mensForm, valor: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalMensOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white">Gerar Mensalidade</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Baixar Pagamento Mensalidade */}
      {modalPayOpen && selectedMensalidade && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl space-y-4 border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Baixar Pagamento: {selectedMensalidade.alunoNome}
            </h3>
            <p className="text-xs text-slate-400">
              Valor de <strong className="text-emerald-400">{formatBrl(selectedMensalidade.valor)}</strong> será creditado na carteira selecionada.
            </p>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Carteira de Destino (Crédito)</label>
                <select
                  value={payForm.carteiraId}
                  onChange={(e) => setPayForm({ ...payForm, carteiraId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {carteiras.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome} (Saldo atual: {formatBrl(c.saldoAtual)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Forma de Recebimento</label>
                <select
                  value={payForm.formaRecebimento}
                  onChange={(e) => setPayForm({ ...payForm, formaRecebimento: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro em Espécie</option>
                  <option value="cartao">Cartão de Crédito/Débito</option>
                  <option value="boleto">Boleto Bancário</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalPayOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white">Confirmar Recebimento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
