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
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Relatórios Financeiros & Comparativo de Turnos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Demonstrativo por carteira, análise comparativa Matutino vs Vespertino e exportação CSV</p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Exportar Relatório Completo (CSV)
        </button>
      </div>

      {/* COMPARATIVO DE TURNOS (MATUTINO VS VESPERTINO) */}
      <div className="glass-card p-6 rounded-2xl space-y-6 border-l-4 border-l-amber-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-amber-600" />
              Relatório Comparativo por Turno (Matutino vs. Vespertino)
            </h3>
            <p className="text-xs text-slate-500">Análise de arrecadação da cantina e eventos por período de aulas</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="bg-transparent text-xs text-slate-800 focus:outline-none"
              />
              <span className="text-slate-400 text-xs">até</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="bg-transparent text-xs text-slate-800 focus:outline-none"
              />
            </div>
            {(dataInicio || dataFim) && (
              <button
                onClick={() => { setDataInicio(''); setDataFim(''); }}
                className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 bg-white border border-slate-300"
                title="Limpar período"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Turnos KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" /> Turno Matutino (Manhã)
              </span>
              <h4 className="text-xl font-black text-emerald-600 mt-1">{formatBrl(matutinoTotal)}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">{turnosData?.matutino?.qtd || 0} lançamentos efetuados</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-600" /> Turno Vespertino (Tarde)
              </span>
              <h4 className="text-xl font-black text-amber-600 mt-1">{formatBrl(vespertinoTotal)}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">{turnosData?.vespertino?.qtd || 0} lançamentos efetuados</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-600 font-medium">Resultado Comparativo</span>
              <h4 className="text-xl font-black text-indigo-700 mt-1">{formatBrl(difTurnos)}</h4>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Variação: <strong className="text-amber-700">{maiorTurno}</strong> arrecadou mais no período
              </p>
            </div>
          </div>
        </div>

        {/* Turnos Bar Chart */}
        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `R$${val}`} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
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
        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-emerald-600">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Bruto de Entradas</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatBrl(totalBrutoEntradas)}</h3>
          <p className="text-[11px] text-slate-500 mt-2">Soma de todas as receitas registradas</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-rose-600">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Bruto de Saídas</p>
          <h3 className="text-2xl font-black text-rose-600 mt-1">{formatBrl(totalBrutoSaidas)}</h3>
          <p className="text-[11px] text-slate-500 mt-2">Soma de todas as despesas registradas</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-indigo-600">
          <p className="text-xs font-semibold text-slate-500 uppercase">Resultado Líquido do Período</p>
          <h3 className={`text-2xl font-black mt-1 ${saldoLiquido >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
            {formatBrl(saldoLiquido)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-2">Diferença entre Entradas e Saídas</p>
        </div>
      </div>

      {/* Wallet Breakdown Table */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-slate-900">Demonstrativo por Carteira</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Carteira</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4 text-right">Total Receitas</th>
                <th className="py-3.5 px-4 text-right">Total Despesas</th>
                <th className="py-3.5 px-4 text-right">Saldo Atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {carteiras.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-indigo-600" />
                    {c.nome}
                  </td>
                  <td className="py-3.5 px-4 capitalize text-slate-600 font-medium">{c.tipo}</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">+{formatBrl(c.totalEntradas)}</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-rose-600">-{formatBrl(c.totalSaidas)}</td>
                  <td className={`py-3.5 px-4 text-right font-black ${c.saldoAtual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
