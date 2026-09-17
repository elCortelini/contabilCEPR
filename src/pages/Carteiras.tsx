import React, { useEffect, useState } from 'react';
import { Wallet, Plus, Building2 } from 'lucide-react';
import { api } from '../services/api';

export const Carteiras: React.FC = () => {
  const [carteiras, setCarteiras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', descricao: '', tipo: 'dinheiro', saldoAtual: '0' });

  const loadCarteiras = () => {
    api.getCarteiras().then((res) => {
      setCarteiras(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadCarteiras();
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
      loadCarteiras();
    }).catch(() => {
      setModalOpen(false);
      loadCarteiras();
    });
  };

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const totalGeral = carteiras.reduce((acc, c) => acc + (c.saldoAtual || 0), 0);

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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Carteira
          </button>
        </div>
      </div>

      {/* Carteiras Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {carteiras.map((c) => (
          <div key={c.id} className="glass-card glass-card-hover p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  ID #{c.id}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Carteira Ativa"></span>
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
                <span className="text-xs font-bold text-slate-800">Saldo Atual:</span>
                <span className={`text-base font-black ${c.saldoAtual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatBrl(c.saldoAtual)}
                </span>
              </div>
            </div>
          </div>
        ))}
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
    </div>
  );
};
