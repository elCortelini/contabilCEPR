import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, TrendingUp, Wallet, Printer, Calendar, RefreshCw, Pencil, Sun, Moon, Clock } from 'lucide-react';
import { api } from '../services/api';
import { ReciboPdf } from '../components/ReciboPdf';

export const Entradas: React.FC = () => {
  const [entradas, setEntradas] = useState<any[]>([]);
  const [carteiras, setCarteiras] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCarteira, setSelectedCarteira] = useState('');
  const [selectedForma, setSelectedForma] = useState('');
  const [selectedTurno, setSelectedTurno] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [reciboItem, setReciboItem] = useState<any>(null);

  const [form, setForm] = useState({
    carteiraId: '',
    categoriaId: '',
    valor: '',
    descricao: '',
    formaRecebimento: 'dinheiro',
    turno: 'Matutino',
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

    const cats = await api.getCategorias();
    setCategorias(cats.filter((c: any) => c.tipo === 'entrada'));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      carteiraId: carteiras[0]?.id?.toString() || '',
      categoriaId: '',
      valor: '',
      descricao: '',
      formaRecebimento: 'dinheiro',
      turno: 'Matutino',
      data: new Date().toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      carteiraId: item.carteiraId?.toString() || carteiras[0]?.id?.toString() || '',
      categoriaId: item.categoriaId?.toString() || '',
      valor: item.valor?.toString() || '',
      descricao: item.descricao || '',
      formaRecebimento: item.formaRecebimento || 'dinheiro',
      turno: item.turno || 'Matutino',
      data: item.data ? item.data.substring(0, 10) : new Date().toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await api.updateEntrada(editingItem.id, form);
    } else {
      await api.createEntrada(form);
    }
    setModalOpen(false);
    setEditingItem(null);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta receita? O saldo da carteira será ajustado.')) {
      await api.deleteEntrada(id);
      loadData();
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCarteira('');
    setSelectedForma('');
    setSelectedTurno('');
    setDataInicio('');
    setDataFim('');
  };

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const filtered = entradas.filter((e) => {
    const matchesSearch = e.descricao?.toLowerCase().includes(search.toLowerCase()) || e.carteiraNome?.toLowerCase().includes(search.toLowerCase());
    const matchesCarteira = !selectedCarteira || e.carteiraId.toString() === selectedCarteira;
    const matchesForma = !selectedForma || (e.formaRecebimento || '').toLowerCase() === selectedForma.toLowerCase();
    const matchesTurno = !selectedTurno || (e.turno || 'Matutino').toLowerCase() === selectedTurno.toLowerCase();

    const itemDate = e.data ? e.data.substring(0, 10) : '';
    const matchesInicio = !dataInicio || itemDate >= dataInicio;
    const matchesFim = !dataFim || itemDate <= dataFim;

    return matchesSearch && matchesCarteira && matchesForma && matchesTurno && matchesInicio && matchesFim;
  });

  const totalFiltrado = filtered.reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Recibo Modal */}
      {reciboItem && (
        <ReciboPdf item={reciboItem} onClose={() => setReciboItem(null)} />
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Lançamentos de Entradas (Receitas)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Histórico de vendas da cantina com filtro por Turno (Matutino vs Vespertino)</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium">Total Filtrado ({filtered.length} itens)</span>
            <p className="text-xl font-black text-emerald-400">{formatBrl(totalFiltrado)}</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Receita
          </button>
        </div>
      </div>

      {/* Filter Bar with Turno, Dates, Wallet & Forma */}
      <div className="glass-card p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-indigo-400" />
            Filtros por Período, Turno, Carteira e Forma
          </span>
          {(search || selectedCarteira || selectedForma || selectedTurno || dataInicio || dataFim) && (
            <button
              onClick={clearFilters}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Turno Filter */}
          <div>
            <select
              value={selectedTurno}
              onChange={(e) => setSelectedTurno(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold text-amber-400"
            >
              <option value="">Todos os Turnos</option>
              <option value="matutino">Matutino (Manhã)</option>
              <option value="vespertino">Vespertino (Tarde)</option>
              <option value="noturno">Noturno (Noite)</option>
            </select>
          </div>

          {/* Carteira Filter */}
          <div>
            <select
              value={selectedCarteira}
              onChange={(e) => setSelectedCarteira(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Todas as Carteiras ({carteiras.length})</option>
              {carteiras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Forma Filter */}
          <div>
            <select
              value={selectedForma}
              onChange={(e) => setSelectedForma(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Todas as Formas</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">PIX</option>
              <option value="cartao">Cartão</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          {/* Dates */}
          <div>
            <input
              type="date"
              title="Data Inicial"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <input
              type="date"
              title="Data Final"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
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
                <th className="py-3.5 px-4">Turno</th>
                <th className="py-3.5 px-4">Carteira</th>
                <th className="py-3.5 px-4">Categoria</th>
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
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      item.turno === 'Vespertino'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : item.turno === 'Noturno'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {item.turno === 'Vespertino' ? <Sun className="w-3 h-3 text-amber-400" /> : <Clock className="w-3 h-3" />}
                      {item.turno || 'Matutino'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                      <Wallet className="w-3 h-3" />
                      {item.carteiraNome}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {item.categoriaNome ? (
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px]" style={{ backgroundColor: `${item.categoriaCor || '#6366f1'}20`, color: item.categoriaCor || '#6366f1' }}>
                        {item.categoriaNome}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-normal">—</span>
                    )}
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
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition cursor-pointer"
                        title="Editar lançamento"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setReciboItem({ ...item, tipo: 'entrada', valor: parseFloat(item.valor), forma: item.formaRecebimento })}
                        className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition cursor-pointer"
                        title="Gerar / Imprimir Recibo PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Excluir receita"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova / Editar Entrada */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl space-y-4 border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              {editingItem ? `Editar Receita #${editingItem.id}` : 'Nova Receita / Entrada'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Turno do Lançamento</label>
                  <select
                    value={form.turno}
                    onChange={(e) => setForm({ ...form, turno: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-amber-400 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Matutino">Matutino (Manhã)</option>
                    <option value="Vespertino">Vespertino (Tarde)</option>
                    <option value="Noturno">Noturno (Noite)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria (Opcional)</label>
                  <select
                    value={form.categoriaId}
                    onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Sem categoria</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>
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
                  {editingItem ? 'Salvar Alterações' : 'Registrar Receita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
