import React, { useEffect, useState } from 'react';
import { FileText, Download, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export const Relatorios: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [carteiras, setCarteiras] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((res) => setData(res));
    fetch('/api/carteiras')
      .then((res) => res.json())
      .then((res) => setCarteiras(res));
  }, []);

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const handleExportCsv = () => {
    window.open('/api/relatorios/export-csv', '_blank');
  };

  const totalBrutoEntradas = data?.totalEntradas || 0;
  const totalBrutoSaidas = data?.totalSaidas || 0;
  const saldoLiquido = totalBrutoEntradas - totalBrutoSaidas;

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Relatórios Financeiros & DRE
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Visão consolidada por carteira, totais brutos, resultado líquido e exportação</p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Exportar Relatório Completo (CSV)
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Bruto de Entradas</p>
          <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatBrl(totalBrutoEntradas)}</h3>
          <p className="text-[11px] text-slate-400 mt-2">Soma de todas as 99 receitas registradas</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-rose-500">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Bruto de Saídas</p>
          <h3 className="text-2xl font-black text-rose-400 mt-1">{formatBrl(totalBrutoSaidas)}</h3>
          <p className="text-[11px] text-slate-400 mt-2">Soma de todas as 55 despesas registradas</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-indigo-500">
          <p className="text-xs font-semibold text-slate-400 uppercase">Resultado Líquido do Período</p>
          <h3 className={`text-2xl font-black mt-1 ${saldoLiquido >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
            {formatBrl(saldoLiquido)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-2">Diferença entre Entradas e Saídas</p>
        </div>
      </div>

      {/* Wallet Breakdown Table */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-white">Demonstrativo por Carteira</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Carteira</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4 text-right">Total Receitas</th>
                <th className="py-3.5 px-4 text-right">Total Despesas</th>
                <th className="py-3.5 px-4 text-right">Saldo Atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {carteiras.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-indigo-400" />
                    {c.nome}
                  </td>
                  <td className="py-3.5 px-4 capitalize text-slate-400 font-medium">{c.tipo}</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">+{formatBrl(c.totalEntradas)}</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-rose-400">-{formatBrl(c.totalSaidas)}</td>
                  <td className={`py-3.5 px-4 text-right font-black ${c.saldoAtual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatBrl(c.saldoAtual)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
