import React, { useEffect, useState } from 'react';
import { FileText, Download, Wallet, Sun, Clock, Calendar, RefreshCw, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../services/api';

export const Relatorios: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [carteiras, setCarteiras] = useState<any[]>([]);
  const [turnosData, setTurnosData] = useState<any>(null);

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const loadData = async () => {
    api.getDashboard().then((res) => setData(res));
    api.getCarteiras().then((res) => setCarteiras(res));
    api.getComparativoTurnos(dataInicio, dataFim).then((res) => setTurnosData(res));
  };

  useEffect(() => {
    loadData();
  }, [dataInicio, dataFim]);

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const handleExportCsv = () => {
    window.open('/api/relatorios/export-csv', '_blank');
  };

  const totalBrutoEntradas = data?.totalEntradas || 0;
  const totalBrutoSaidas = data?.totalSaidas || 0;
  const saldoLiquido = totalBrutoEntradas - totalBrutoSaidas;

  const matutinoTotal = turnosData?.matutino?.total || 0;
  const vespertinoTotal = turnosData?.vespertino?.total || 0;
  const noturnoTotal = turnosData?.noturno?.total || 0;

  const chartData = [
    { name: 'Matutino (Manhã)', valor: matutinoTotal, cor: '#10b981', qtd: turnosData?.matutino?.qtd || 0 },
    { name: 'Vespertino (Tarde)', valor: vespertinoTotal, cor: '#f59e0b', qtd: turnosData?.vespertino?.qtd || 0 },
    { name: 'Noturno (Noite)', valor: noturnoTotal, cor: '#6366f1', qtd: turnosData?.noturno?.qtd || 0 },
  ];

  const maiorTurno = matutinoTotal >= vespertinoTotal ? 'Matutino' : 'Vespertino';
  const difTurnos = Math.abs(matutinoTotal - vespertinoTotal);

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Relatórios Financeiros & Comparativo de Turnos
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Demonstrativo por carteira, análise comparativa Matutino vs Vespertino e exportação CSV</p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Exportar Relatório Completo (CSV)
        </button>
      </div>

      {/* COMPARATIVO DE TURNOS (MATUTINO VS VESPERTINO) */}
      <div className="glass-card p-6 rounded-2xl space-y-6 border-l-4 border-l-amber-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-amber-400" />
              Relatório Comparativo por Turno (Matutino vs. Vespertino)
            </h3>
            <p className="text-xs text-slate-400">Análise de arrecadação da cantina e eventos por período de aulas</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none"
              />
              <span className="text-slate-500 text-xs">até</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none"
              />
            </div>
            {(dataInicio || dataFim) && (
              <button
                onClick={() => { setDataInicio(''); setDataFim(''); }}
                className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 bg-slate-900 border border-slate-800"
                title="Limpar período"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Turnos KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Turno Matutino (Manhã)
              </span>
              <h4 className="text-xl font-black text-emerald-400 mt-1">{formatBrl(matutinoTotal)}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">{turnosData?.matutino?.qtd || 0} lançamentos efetuados</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Turno Vespertino (Tarde)
              </span>
              <h4 className="text-xl font-black text-amber-400 mt-1">{formatBrl(vespertinoTotal)}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">{turnosData?.vespertino?.qtd || 0} lançamentos efetuados</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Resultado Comparativo</span>
              <h4 className="text-xl font-black text-indigo-300 mt-1">{formatBrl(difTurnos)}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Variação: <strong className="text-amber-400">{maiorTurno}</strong> arrecadou mais no período
              </p>
            </div>
          </div>
        </div>

        {/* Turnos Bar Chart */}
        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `R$${val}`} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                formatter={(value: any) => formatBrl(value)}
              />
              <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Bruto de Entradas</p>
          <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatBrl(totalBrutoEntradas)}</h3>
          <p className="text-[11px] text-slate-400 mt-2">Soma de todas as receitas registradas</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-rose-500">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Bruto de Saídas</p>
          <h3 className="text-2xl font-black text-rose-400 mt-1">{formatBrl(totalBrutoSaidas)}</h3>
          <p className="text-[11px] text-slate-400 mt-2">Soma de todas as despesas registradas</p>
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
