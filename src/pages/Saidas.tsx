import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, TrendingDown, Wallet, Building2, Printer } from 'lucide-react';
import { api } from '../services/api';
import { ReciboPdf } from '../components/ReciboPdf';

export const Saidas: React.FC = () => {
  const [saidas, setSaidas] = useState<any[]>([]);
  const [carteiras, setCarteiras] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCarteira, setSelectedCarteira] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [reciboItem, setReciboItem] = useState<any>(null);

  const [form, setForm] = useState({
    carteiraId: '',
    categoriaId: '',
    valor: '',
    descricao: '',
    formaPagamento: 'dinheiro',
    fornecedorId: '',
    data: new Date().toISOString().split('T')[0],
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createSaida(form);
    setModalOpen(false);
    setForm({
      carteiraId: carteiras[0]?.id?.toString() || '',
      categoriaId: '',
      valor: '',
      descricao: '',
      formaPagamento: 'dinheiro',
      fornecedorId: '',
      data: new Date().toISOString().split('T')[0],
    });
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja remover esta saída? O saldo será devolvido à carteira.')) {
      await api.deleteSaida(id);
      loadData();
    }
  };

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const filtered = saidas.filter((s) => {
    const matchesSearch = s.descricao?.toLowerCase().includes(search.toLowerCase()) || s.carteiraNome?.toLowerCase().includes(search.toLowerCase());
    const matchesCarteira = !selectedCarteira || s.carteiraId.toString() === selectedCarteira;
    return matchesSearch && matchesCarteira;
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
            <TrendingDown className="w-5 h-5 text-rose-400" />
            Lançamentos de Saídas (Despesas)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Histórico completo de compras de insumos, contas e pagamentos</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium">Total Filtrado</span>
            <p className="text-xl font-black text-rose-400">{formatBrl(totalFiltrado)}</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Despesa
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

      {/* Saidas Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
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
                  <td className="py-3 px-4">
                    {item.categoriaNome ? (
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px]" style={{ backgroundColor: `${item.categoriaCor || '#f43f5e'}20`, color: item.categoriaCor || '#f43f5e' }}>
                        {item.categoriaNome}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-normal">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-normal text-slate-200">
                    <div>{item.descricao || 'Sem descrição'}</div>
                    {item.fornecedorNome && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" /> {item.fornecedorNome}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-400 font-medium">
                    {item.formaPagamento}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-rose-400">
                    -{formatBrl(parseFloat(item.valor))}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setReciboItem({ ...item, tipo: 'saida', valor: parseFloat(item.valor), forma: item.formaPagamento })}
                        className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition cursor-pointer"
                        title="Gerar / Imprimir Recibo PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Excluir saída"
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

      {/* Modal Nova Saida */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl space-y-4 border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-400" />
              Nova Despesa / Saída
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Carteira de Origem (Débito)</label>
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-semibold text-rose-400"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Forma de Pagamento</label>
                <select
                  value={form.formaPagamento}
                  onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="dinheiro">Dinheiro em Espécie</option>
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="cartao">Cartão de Crédito/Débito</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Compra de pães para cantina, Luz"
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30"
                >
                  Registrar Saída
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
