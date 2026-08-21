import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { api } from '../services/api';

export const Entradas: React.FC = () => {
  const [entradas, setEntradas] = useState<any[]>([]);
  const [carteiras, setCarteiras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCarteira, setSelectedCarteira] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    carteiraId: '',
    valor: '',
    descricao: '',
    formaRecebimento: 'dinheiro',
    data: new Date().toISOString().split('T')[0],
  });

  const loadData = async () => {
    const list = await api.getEntradas();
    setEntradas(list);
    setLoading(false);

    const carts = await api.getCarteiras();
    setCarteiras(carts);
    if (carts.length > 0 && !form.carteiraId) {
      setForm((prev) => ({ ...prev, carteiraId: carts[0].id.toString() }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createEntrada(form);
    setModalOpen(false);
    setForm({
      carteiraId: carteiras[0]?.id?.toString() || '',
      valor: '',
      descricao: '',
      formaRecebimento: 'dinheiro',
      data: new Date().toISOString().split('T')[0],
    });
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta receita? O saldo da carteira será ajustado.')) {
      await api.deleteEntrada(id);
      loadData();
    }
  };

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const filtered = entradas.filter((e) => {
    const matchesSearch = e.descricao?.toLowerCase().includes(search.toLowerCase()) || e.carteiraNome?.toLowerCase().includes(search.toLowerCase());
    const matchesCarteira = !selectedCarteira || e.carteiraId.toString() === selectedCarteira;
    return matchesSearch && matchesCarteira;
  });

  const totalFiltrado = filtered.reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Lançamentos de Entradas (Receitas)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Histórico completo de vendas da cantina, taxas e receitas</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium">Total Filtrado</span>
            <p className="text-xl font-black text-emerald-400">{formatBrl(totalFiltrado)}</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Receita
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por descrição ou carteira..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="w-full md:w-64">
          <select
            value={selectedCarteira}
            onChange={(e) => setSelectedCarteira(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Todas as Carteiras ({carteiras.length})</option>
            {carteiras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Entradas Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Data</th>
                <th className="py-3.5 px-4">Carteira</th>
                <th className="py-3.5 px-4">Descrição</th>
                <th className="py-3.5 px-4">Forma</th>
                <th className="py-3.5 px-4 text-right">Valor</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4 font-bold text-slate-400">#{item.id}</td>
                  <td className="py-3 px-4 text-slate-300 font-medium">
                    {new Date(item.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                      <Wallet className="w-3 h-3" />
                      {item.carteiraNome}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-normal text-slate-200">
                    {item.descricao || 'Sem descrição'}
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-400 font-medium">
                    {item.formaRecebimento}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-emerald-400">
                    +{formatBrl(parseFloat(item.valor))}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Excluir receita"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Entrada */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl space-y-4 border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Nova Receita / Entrada
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Carteira de Destino</label>
                <select
                  required
                  value={form.carteiraId}
                  onChange={(e) => setForm({ ...form, carteiraId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {carteiras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({formatBrl(c.saldoAtual)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-semibold text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data do Lançamento</label>
                  <input
                    type="date"
                    required
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Forma de Recebimento</label>
                <select
                  value={form.formaRecebimento}
                  onChange={(e) => setForm({ ...form, formaRecebimento: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="dinheiro">Dinheiro em Espécie</option>
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão de Crédito/Débito</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição / Origem</label>
                <input
                  type="text"
                  placeholder="Ex: Cantina matutino, Mensalidade"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
                >
                  Registrar Receita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
