import React, { useEffect, useState } from 'react';
import { Package, Plus, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

export const Produtos: React.FC = () => {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    fornecedorId: '',
    quantidade: '0',
    precoUnitario: '0.00',
    custoUnitario: '0.00',
  });

  const loadData = () => {
    fetch('/api/produtos')
      .then((res) => res.json())
      .then((res) => setProdutos(res));
    fetch('/api/fornecedores')
      .then((res) => res.json())
      .then((res) => setFornecedores(res));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(() => {
      setModalOpen(false);
      setForm({ nome: '', descricao: '', fornecedorId: '', quantidade: '0', precoUnitario: '0.00', custoUnitario: '0.00' });
      loadData();
    });
  };

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const totalCustoEstoque = produtos.reduce((acc, p) => acc + (p.custoTotalEstoque || 0), 0);
  const totalValorVenda = produtos.reduce((acc, p) => acc + (p.valorTotalVenda || 0), 0);
  const totalLucroEstimado = totalValorVenda - totalCustoEstoque;

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            Produtos & Controle de Estoque
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Gerencie itens da cantina e eventos com cálculo de custo, receita prevista e lucro bruto</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium">Potencial de Venda</span>
            <p className="text-xl font-black text-emerald-400">{formatBrl(totalValorVenda)}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium">Lucro Bruto Previsto</span>
            <p className="text-xl font-black text-indigo-400">{formatBrl(totalLucroEstimado)}</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Table / Grid */}
      {produtos.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">Nenhum produto cadastrado no estoque</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Cadastre salgados, bebidas, doces ou uniformes para calcular a margem de lucro e custo total em estoque.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Cadastrar Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Produto</th>
                  <th className="py-3.5 px-4">Fornecedor</th>
                  <th className="py-3.5 px-4 text-center">Qtd Estoque</th>
                  <th className="py-3.5 px-4 text-right">Custo Unit.</th>
                  <th className="py-3.5 px-4 text-right">Preço Venda</th>
                  <th className="py-3.5 px-4 text-right">Custo Total</th>
                  <th className="py-3.5 px-4 text-right">Venda Total</th>
                  <th className="py-3.5 px-4 text-right">Lucro Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {produtos.map((p) => {
                  const margem = p.precoUnitario > 0 ? (((p.precoUnitario - p.custoUnitario) / p.precoUnitario) * 100).toFixed(0) : '0';
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4 font-bold text-white">
                        {p.nome}
                        {p.descricao && <p className="text-[11px] text-slate-400 font-normal">{p.descricao}</p>}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{p.fornecedorNome || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          p.quantidade > 10
                            ? 'bg-slate-800 text-slate-200'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {p.quantidade} un
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">{formatBrl(p.custoUnitario)}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-semibold">{formatBrl(p.precoUnitario)}</td>
                      <td className="py-3 px-4 text-right text-slate-400">{formatBrl(p.custoTotalEstoque)}</td>
                      <td className="py-3 px-4 text-right text-slate-200 font-semibold">{formatBrl(p.valorTotalVenda)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-emerald-400 block">{formatBrl(p.lucroBruto)}</span>
                        <span className="text-[10px] text-indigo-400 font-medium">Margem: {margem}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Novo Produto */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl space-y-4 border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Cadastrar Produto no Estoque</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Salgado Assado, Suco de Laranja"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fornecedor (Opcional)</label>
                <select
                  value={form.fornecedorId}
                  onChange={(e) => setForm({ ...form, fornecedorId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Sem fornecedor específico</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantidade</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={form.quantidade}
                    onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Custo Unit. (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={form.custoUnitario}
                    onChange={(e) => setForm({ ...form, custoUnitario: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Preço Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={form.precoUnitario}
                    onChange={(e) => setForm({ ...form, precoUnitario: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 text-emerald-400 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Tamanho médio, sabor frango"
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
