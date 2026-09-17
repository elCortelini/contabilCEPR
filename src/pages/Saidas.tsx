import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, TrendingDown, Wallet, Building2, Printer, Calendar, RefreshCw, Pencil } from 'lucide-react';
import { api } from '../services/api';
import { ReciboPdf } from '../components/ReciboPdf';
import { formatLocalDate, getTodayLocalDate } from '../utils/formatters';

export const Saidas: React.FC = () => {
  const [saidas, setSaidas] = useState<any[]>([]);
  const [carteiras, setCarteiras] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCarteira, setSelectedCarteira] = useState('');
  const [selectedForma, setSelectedForma] = useState('');
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
    formaPagamento: 'dinheiro',
    fornecedorId: '',
    data: getTodayLocalDate(),
  });

  const loadData = async () => {
    const list = await api.getSaidas();
    setSaidas(list);
    setLoading(false);

    const carts = await api.getCarteiras();
    setCarteiras(carts);
    if (carts.length > 0 && !form.carteiraId) {
      setForm((prev) => ({ ...prev, carteiraId: carts[0].id.toString() }));
    }

    const forns = await api.getFornecedores();
    setFornecedores(forns);

    const cats = await api.getCategorias();
    setCategorias(cats.filter((c: any) => c.tipo === 'saida'));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      carteiraId: carteiras.length > 0 ? carteiras[0].id.toString() : '',
      categoriaId: '',
      valor: '',
      descricao: '',
      formaPagamento: 'dinheiro',
      fornecedorId: '',
      data: getTodayLocalDate(),
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      carteiraId: item.carteiraId.toString(),
      categoriaId: item.categoriaId ? item.categoriaId.toString() : '',
      valor: item.valor.toString(),
      descricao: item.descricao || '',
      formaPagamento: item.formaPagamento || 'dinheiro',
      fornecedorId: item.fornecedorId ? item.fornecedorId.toString() : '',
      data: item.data ? item.data.substring(0, 10) : getTodayLocalDate(),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await api.updateSaida(editingItem.id, form);
    } else {
      await api.createSaida(form);
    }
    setModalOpen(false);
    setEditingItem(null);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta despesa? O saldo da carteira será reajustado.')) {
      await api.deleteSaida(id);
      loadData();
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCarteira('');
    setSelectedForma('');
    setDataInicio('');
    setDataFim('');
  };

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const filtered = saidas
    .filter((s) => {
      const matchesSearch = s.descricao?.toLowerCase().includes(search.toLowerCase()) || s.carteiraNome?.toLowerCase().includes(search.toLowerCase());
      const matchesCarteira = !selectedCarteira || s.carteiraId.toString() === selectedCarteira;
      const matchesForma = !selectedForma || (s.formaPagamento || '').toLowerCase() === selectedForma.toLowerCase();

      const itemDate = s.data ? s.data.substring(0, 10) : '';
      const matchesInicio = !dataInicio || itemDate >= dataInicio;
      const matchesFim = !dataFim || itemDate <= dataFim;

      return matchesSearch && matchesCarteira && matchesForma && matchesInicio && matchesFim;
    })
    .sort((a, b) => {
      const dateA = a.data ? new Date(a.data).getTime() : 0;
      const dateB = b.data ? new Date(b.data).getTime() : 0;
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      return Number(b.id) - Number(a.id);
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
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-600" />
            Lançamentos de Saídas (Despesas)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Histórico completo de despesas operacionais e pagamentos a fornecedores</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium">Total Filtrado ({filtered.length} itens)</span>
            <p className="text-xl font-black text-rose-600">{formatBrl(totalFiltrado)}</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Despesa
          </button>
        </div>
      </div>

      {/* Filter Bar with Dates, Wallet & Forma */}
      <div className="glass-card p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Filtros por Período, Carteira e Forma
          </span>
          {(search || selectedCarteira || selectedForma || dataInicio || dataFim) && (
            <button
              onClick={clearFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar descrição ou carteira..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Carteira Filter */}
          <div>
            <select
              value={selectedCarteira}
              onChange={(e) => setSelectedCarteira(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
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
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
            >
              <option value="">Todas as Formas</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">PIX</option>
              <option value="cartao">Cartão</option>
              <option value="boleto">Boleto</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>

          {/* Dates */}
          <div>
            <input
              type="date"
              title="Data Inicial"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <input
              type="date"
              title="Data Final"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Saidas Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Data</th>
                <th className="py-3.5 px-4">Carteira Origem</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Descrição / Fornecedor</th>
                <th className="py-3.5 px-4">Forma</th>
                <th className="py-3.5 px-4 text-right">Valor</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-500">#{item.id}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {formatLocalDate(item.data)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                      <Wallet className="w-3 h-3" />
                      {item.carteiraNome}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {item.categoriaNome ? (
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px]" style={{ backgroundColor: `${item.categoriaCor || '#f43f5e'}20`, color: item.categoriaCor || '#f43f5e' }}>
                        {item.categoriaNome}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-normal text-slate-800">
                    {item.descricao || 'Sem descrição'}
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-600 font-medium">
                    {item.formaPagamento}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-rose-600">
                    -{formatBrl(parseFloat(item.valor))}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                        title="Editar despesa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setReciboItem({ ...item, tipo: 'saida', valor: parseFloat(item.valor), forma: item.formaPagamento })}
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                        title="Gerar / Imprimir Recibo PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Excluir despesa"
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

      {/* Modal Nova / Editar Saída */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl space-y-4 border border-slate-200 shadow-2xl text-slate-800">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-600" />
              {editingItem ? `Editar Despesa #${editingItem.id}` : 'Nova Despesa / Saída'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Carteira de Origem</label>
                <select
                  required
                  value={form.carteiraId}
                  onChange={(e) => setForm({ ...form, carteiraId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  {carteiras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({formatBrl(c.saldoAtual)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria (Opcional)</label>
                <select
                  value={form.categoriaId}
                  onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  <option value="">Sem categoria</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 font-bold text-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data do Pagamento</label>
                  <input
                    type="date"
                    required
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Forma de Pagamento</label>
                <select
                  value={form.formaPagamento}
                  onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  <option value="dinheiro">Dinheiro em Espécie</option>
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão de Crédito/Débito</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="transferencia">Transferência TED/DOC</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fornecedor Vinculado (Opcional)</label>
                <select
                  value={form.fornecedorId}
                  onChange={(e) => setForm({ ...form, fornecedorId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  <option value="">Nenhum fornecedor selecionado</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome} ({f.categoria})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição da Despesa</label>
                <input
                  type="text"
                  placeholder="Ex: Compra de insumos, conta de luz"
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30"
                >
                  {editingItem ? 'Salvar Alterações' : 'Registrar Despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
