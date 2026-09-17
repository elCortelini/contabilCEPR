import React, { useEffect, useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { api } from '../services/api';

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

  const loadData = async () => {
    const list = await api.getProdutos();
    setProdutos(list);
    const forns = await api.getFornecedores();
    setFornecedores(forns);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createProduto(form);
    setModalOpen(false);
    setForm({ nome: '', descricao: '', fornecedorId: '', quantidade: '0', precoUnitario: '0.00', custoUnitario: '0.00' });
    loadData();
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
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            Produtos & Controle de Estoque
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Gerencie itens da cantina e eventos com cálculo de custo, receita prevista e lucro bruto</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium">Potencial de Venda</span>
            <p className="text-xl font-black text-emerald-600">{formatBrl(totalValorVenda)}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium">Lucro Bruto Previsto</span>
            <p className="text-xl font-black text-indigo-600">{formatBrl(totalLucroEstimado)}</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Table / Grid */}
      {produtos.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl space-y-3">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Nenhum produto cadastrado no estoque</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Cadastre salgados, bebidas, doces ou uniformes para calcular a margem de lucro e custo total em estoque.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" /> Cadastrar Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {produtos.map((p) => {
                  const margem = p.precoUnitario > 0 ? (((p.precoUnitario - p.custoUnitario) / p.precoUnitario) * 100).toFixed(0) : '0';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {p.nome}
                        {p.descricao && <p className="text-[11px] text-slate-500 font-normal">{p.descricao}</p>}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.fornecedorNome || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          p.quantidade > 10
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {p.quantidade} un
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">{formatBrl(p.custoUnitario)}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-semibold">{formatBrl(p.precoUnitario)}</td>
                      <td className="py-3 px-4 text-right text-slate-500">{formatBrl(p.custoTotalEstoque)}</td>
                      <td className="py-3 px-4 text-right text-slate-800 font-semibold">{formatBrl(p.valorTotalVenda)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-emerald-600 block">{formatBrl(p.lucroBruto)}</span>
                        <span className="text-[10px] text-indigo-600 font-medium">Margem: {margem}%</span>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl space-y-4 border border-slate-200 shadow-2xl text-slate-800">
            <h3 className="text-lg font-bold text-slate-900">Cadastrar Produto no Estoque</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Salgado Assado, Suco de Laranja"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fornecedor (Opcional)</label>
                <select
                  value={form.fornecedorId}
                  onChange={(e) => setForm({ ...form, fornecedorId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantidade</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={form.quantidade}
                    onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Custo Unit. (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={form.custoUnitario}
                    onChange={(e) => setForm({ ...form, custoUnitario: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preço Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={form.precoUnitario}
                    onChange={(e) => setForm({ ...form, precoUnitario: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 text-emerald-600 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Tamanho médio, sabor frango"
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
