import React, { useEffect, useState } from 'react';
import { Wallet, Plus, Building2, SlidersHorizontal, AlertTriangle, CheckCircle2, X, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { api } from '../services/api';
import { formatLocalDate } from '../utils/formatters';

export const Carteiras: React.FC = () => {
  const [carteiras, setCarteiras] = useState<any[]>([]);
  const [ajustes, setAjustes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal nova carteira
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', descricao: '', tipo: 'dinheiro', saldoAtual: '0' });

  // Modal ajuste de saldo
  const [ajusteModal, setAjusteModal] = useState<{ carteira: any } | null>(null);
  const [saldoApurado, setSaldoApurado] = useState('');
  const [ajusteObs, setAjusteObs] = useState('');
  const [savingAjuste, setSavingAjuste] = useState(false);

  // Tabela de pendências expandida
  const [pendenciasExpand, setPendenciasExpand] = useState(true);

  const loadData = () => {
    Promise.all([api.getCarteiras(), api.getAjustesSaldo()]).then(([c, a]) => {
      setCarteiras(c as any[]);
      setAjustes((a as any[]).sort((x: any, y: any) => (y.criadoEm ?? '').localeCompare(x.criadoEm ?? '')));
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/carteiras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(() => {
      setModalOpen(false);
      setForm({ nome: '', descricao: '', tipo: 'dinheiro', saldoAtual: '0' });
      loadData();
    }).catch(() => {
      setModalOpen(false);
      loadData();
    });
  };

  const handleOpenAjuste = (carteira: any) => {
    setSaldoApurado((carteira.saldoAtual ?? 0).toFixed(2));
    setAjusteObs('');
    setAjusteModal({ carteira });
  };

  const handleSaveAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ajusteModal) return;
    setSavingAjuste(true);
    const { carteira } = ajusteModal;
    const apurado = parseFloat(saldoApurado) || 0;
    const diferenca = apurado - (carteira.saldoAtual || 0);
    await api.saveAjusteSaldo({
      carteiraId: carteira.id,
      carteiraNome: carteira.nome,
      saldoCalculado: carteira.saldoAtual || 0,
      saldoApurado: apurado,
      diferenca,
      observacao: ajusteObs,
    });
    setSavingAjuste(false);
    setAjusteModal(null);
    loadData();
  };

  const handleResolver = async (id: number) => {
    await api.resolverAjusteSaldo(id);
    loadData();
  };

  const formatBrl = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const totalGeral = carteiras.reduce((acc, c) => acc + (c.saldoAtual || 0), 0);

  const ultimoAjustePendente = (carteiraId: number) =>
    ajustes.find((a: any) => a.carteiraId === carteiraId && a.status === 'pendente');

  const pendentes = ajustes.filter((a: any) => a.status === 'pendente');

  const diferencaPreview = ajusteModal
    ? (parseFloat(saldoApurado) || 0) - (ajusteModal.carteira.saldoAtual || 0)
    : 0;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Carteiras & Contas Financeiras</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gerencie os caixas físicos e contas bancárias da instituição</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium">Patrimônio Total Disponível</span>
            <p className="text-2xl font-black text-emerald-600">{formatBrl(totalGeral)}</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Carteira
          </button>
        </div>
      </div>

      {/* Carteiras Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {carteiras.map((c) => {
          const ajustePendente = ultimoAjustePendente(c.id);
          return (
            <div key={c.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden hover:shadow-lg transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    ID #{c.id}
                  </span>
                  {ajustePendente ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      Divergência
                    </span>
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Carteira Ativa" />
                  )}
                </div>

                <div className="flex items-center gap-3 my-2">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    {c.tipo === 'banco' ? <Building2 className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{c.nome}</h3>
                    <p className="text-xs text-slate-500 capitalize">{c.tipo} • {c.descricao || 'Sem observação'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total Entradas:</span>
                  <span className="font-semibold text-emerald-600">+{formatBrl(c.totalEntradas)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total Saídas:</span>
                  <span className="font-semibold text-rose-600">-{formatBrl(c.totalSaidas)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-800">Saldo Calculado:</span>
                  <span className={`text-base font-black ${c.saldoAtual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatBrl(c.saldoAtual)}
                  </span>
                </div>

                {/* Divergência pendente */}
                {ajustePendente && (
                  <div className={`text-xs flex items-center justify-between rounded-lg px-2 py-1.5 ${ajustePendente.diferenca >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
                    <span className={`font-semibold ${ajustePendente.diferenca >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      Dif. apurada:
                    </span>
                    <span className={`font-black ${ajustePendente.diferenca >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {ajustePendente.diferenca >= 0 ? '+' : ''}{formatBrl(ajustePendente.diferenca)}
                    </span>
                  </div>
                )}

                {/* Botão Ajustar Saldo */}
                <button
                  onClick={() => handleOpenAjuste(c)}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 transition cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Ajustar Saldo
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pendências de Acerto */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <button
          onClick={() => setPendenciasExpand(!pendenciasExpand)}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-900">Pendências de Acerto de Saldo</h3>
              <p className="text-xs text-slate-500">Diferenças registradas entre saldo calculado e saldo apurado</p>
            </div>
            {pendentes.length > 0 && (
              <span className="ml-2 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800">
                {pendentes.length} pendente{pendentes.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {pendenciasExpand ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {pendenciasExpand && (
          <div className="border-t border-slate-200">
            {ajustes.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                Nenhum ajuste de saldo registrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Data</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Carteira</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Saldo Sistema</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Saldo Apurado</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Diferença</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Observação</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-600">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ajustes.map((a: any) => (
                      <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="px-4 py-3 text-slate-600">{formatLocalDate(a.data)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{a.carteiraNome}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatBrl(a.saldoCalculado)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatBrl(a.saldoApurado)}</td>
                        <td className={`px-4 py-3 text-right font-black ${a.diferenca >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {a.diferenca >= 0 ? '+' : ''}{formatBrl(a.diferenca)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">{a.observacao || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {a.status === 'pendente' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Pendente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Resolvido
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {a.status === 'pendente' && (
                            <button
                              onClick={() => handleResolver(a.id)}
                              className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 transition cursor-pointer"
                            >
                              Marcar Resolvido
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Nova Carteira */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl space-y-4 border border-slate-200 shadow-2xl text-slate-800">
            <h3 className="text-lg font-bold text-slate-900">Cadastrar Nova Carteira</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Carteira</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Caixa Cantina, Banco Bradesco"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Conta</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  <option value="dinheiro">Dinheiro (Caixa Físico)</option>
                  <option value="banco">Banco (Conta Corrente)</option>
                  <option value="cartao">Cartão</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Saldo Inicial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.saldoAtual}
                  onChange={(e) => setForm({ ...form, saldoAtual: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Observações ou utilidade da carteira..."
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                >
                  Salvar Carteira
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajuste de Saldo */}
      {ajusteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl space-y-5 border border-slate-200 shadow-2xl text-slate-800 relative">
            <button
              onClick={() => setAjusteModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ajuste de Saldo</h3>
                <p className="text-xs text-slate-500">{ajusteModal.carteira.nome}</p>
              </div>
            </div>

            {/* Preview de saldos */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Saldo calculado pelo sistema:</span>
                <span className="font-bold text-slate-800">{formatBrl(ajusteModal.carteira.saldoAtual)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Saldo apurado (informado):</span>
                <span className="font-bold text-slate-800">{formatBrl(parseFloat(saldoApurado) || 0)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-700">Diferença:</span>
                <span className={`font-black text-sm ${diferencaPreview === 0 ? 'text-slate-400' : diferencaPreview > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {diferencaPreview >= 0 ? '+' : ''}{formatBrl(diferencaPreview)}
                </span>
              </div>
              {diferencaPreview !== 0 && (
                <p className="text-[10px] text-slate-500 pt-1">
                  {diferencaPreview > 0
                    ? '↑ Saldo apurado maior: possível entrada não registrada ou dinheiro extra.'
                    : '↓ Saldo apurado menor: possível saída não registrada ou falta de caixa.'}
                </p>
              )}
            </div>

            <form onSubmit={handleSaveAjuste} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Saldo Real Apurado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={saldoApurado}
                  onChange={(e) => setSaldoApurado(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-indigo-600"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observação <span className="text-slate-400 font-normal">(motivo, data da conferência...)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Contagem física realizada em 17/09/2026..."
                  value={ajusteObs}
                  onChange={(e) => setAjusteObs(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-1 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAjusteModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingAjuste}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {savingAjuste ? 'Salvando...' : 'Registrar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

