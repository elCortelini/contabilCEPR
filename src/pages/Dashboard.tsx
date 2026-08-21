import React, { useEffect, useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Building2,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Total */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Total Acumulado</p>
              <h3 className="text-2xl font-black text-white mt-1 tracking-tight">
                {formatBrl(data?.saldoTotal)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">4 Carteiras Ativas</span>
            <span className="text-slate-400">• Atualizado</span>
          </div>
        </div>

        {/* Card 2: Total Entradas */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Entradas</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1 tracking-tight">
                {formatBrl(data?.totalEntradas)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">99 lançamentos</span> históricos
          </div>
        </div>

        {/* Card 3: Total Saídas */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Saídas</p>
              <h3 className="text-2xl font-black text-rose-400 mt-1 tracking-tight">
                {formatBrl(data?.totalSaidas)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">55 despesas</span> registradas
          </div>
        </div>

        {/* Card 4: Pendente Fornecedores */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pendente a Fornecedores</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1 tracking-tight">
                {formatBrl(data?.pendenteFornecedores)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Saldo a pagar</span> em aberto
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash flow Area Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Evolução do Fluxo de Caixa</h3>
              <p className="text-xs text-slate-400">Entradas vs. Saídas por mês (Histórico completo)</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Entradas
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Saídas
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.fluxoCaixa || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `R$${val}`} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: any) => formatBrl(value)}
                />
                <Area type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEntradas)" />
                <Area type="monotone" dataKey="saidas" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorSaidas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wallets Distribution Bar Chart */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-indigo-400" />
                Saldos por Carteira
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Distribuição do patrimônio disponível em cada conta</p>

            <div className="space-y-3 mt-2">
              {data?.distribuicaoCarteiras?.map((c: any) => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                      {c.tipo === 'banco' ? <Building2 className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{c.nome}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{c.tipo}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${c.saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatBrl(c.saldo)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Últimas Movimentações</h3>
            <p className="text-xs text-slate-400">Extrato em tempo real das movimentações mais recentes</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Carteira</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Forma</th>
                <th className="py-3 px-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {data?.ultimasMovimentacoes?.map((mov: any) => (
                <tr key={`${mov.tipo}-${mov.id}`} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      mov.tipo === 'entrada'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {mov.tipo === 'entrada' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {mov.tipo === 'entrada' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(mov.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-200">
                    {mov.carteiraNome}
                  </td>
                  <td className="py-3 px-4 font-normal text-slate-300 max-w-xs truncate">
                    {mov.descricao || 'Sem descrição'}
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-400">
                    {mov.forma}
                  </td>
                  <td className={`py-3 px-4 text-right font-bold ${
                    mov.tipo === 'entrada' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {mov.tipo === 'entrada' ? '+' : '-'} {formatBrl(mov.valor)}
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
