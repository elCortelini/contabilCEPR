import React, { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../services/api';

export const Categorias: React.FC = () => {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', tipo: 'entrada', cor: '#6366f1' });

  const loadCategorias = async () => {
    const list = await api.getCategorias();
    setCategorias(list);
  };

  useEffect(() => {
    loadCategorias();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createCategoria(form);
    setModalOpen(false);
    setForm({ nome: '', tipo: 'entrada', cor: '#6366f1' });
    loadCategorias();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja excluir esta categoria?')) {
      await api.deleteCategoria(id);
      loadCategorias();
    }
  };

  const entradas = categorias.filter((c) => c.tipo === 'entrada');
  const saidas = categorias.filter((c) => c.tipo === 'saida');

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            Categorias & Centros de Custo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Organize as receitas e despesas da escola por classificação financeira</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receitas (Entradas) */}
        <div className="glass-card p-6 rounded-2xl space-y-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Categorias de Receita ({entradas.length})
            </h3>
          </div>

          <div className="space-y-2">
            {entradas.map((c) => (
              <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.cor || '#10b981' }}></span>
                  <span className="text-xs font-semibold text-slate-800">{c.nome}</span>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Despesas (Saídas) */}
        <div className="glass-card p-6 rounded-2xl space-y-4 border-l-4 border-l-rose-600">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-600" />
              Categorias de Despesa ({saidas.length})
            </h3>
          </div>

          <div className="space-y-2">
            {saidas.map((c) => (
              <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.cor || '#f43f5e' }}></span>
                  <span className="text-xs font-semibold text-slate-800">{c.nome}</span>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Nova Categoria */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl space-y-4 border border-slate-200 shadow-2xl text-slate-800">
            <h3 className="text-lg font-bold text-slate-900">Cadastrar Categoria</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mensalidades, Vendas Cantina"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="entrada">Receita (Entrada)</option>
                    <option value="saida">Despesa (Saída)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cor Identificadora</label>
                  <input
                    type="color"
                    value={form.cor}
                    onChange={(e) => setForm({ ...form, cor: e.target.value })}
                    className="w-full h-9 bg-white border border-slate-300 rounded-xl p-1 cursor-pointer"
                  />
                </div>
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
                  Salvar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
