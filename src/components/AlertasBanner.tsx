import React from 'react';
import { AlertTriangle, Package, Users, ArrowRight } from 'lucide-react';

interface AlertasBannerProps {
  alertas: {
    produtosEstoqueBaixo?: any[];
    fornecedoresPendentes?: any[];
  };
  onNavigate: (tab: string) => void;
}

export const AlertasBanner: React.FC<AlertasBannerProps> = ({ alertas, onNavigate }) => {
  const estoques = alertas?.produtosEstoqueBaixo || [];
  const fornecedores = alertas?.fornecedoresPendentes || [];

  if (estoques.length === 0 && fornecedores.length === 0) return null;

  return (
    <div className="glass-card border-l-4 border-l-amber-500 p-5 rounded-2xl space-y-3 bg-amber-500/5">
      <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
        <AlertTriangle className="w-5 h-5 animate-pulse" />
        <span>Central de Alertas & Notificações Operacionais</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Estoque Alerta */}
        {estoques.length > 0 && (
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-200">{estoques.length} produto(s) com estoque baixo (≤ 5 un)</p>
                <p className="text-[10px] text-slate-400">{estoques.map((p) => p.nome).slice(0, 2).join(', ')}...</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('produtos')}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <span>Repor</span> <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Fornecedores Alerta */}
        {fornecedores.length > 0 && (
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-200">{fornecedores.length} fornecedor(es) com débito pendente</p>
                <p className="text-[10px] text-slate-400">{fornecedores.map((f) => f.nome).slice(0, 2).join(', ')}...</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('fornecedores')}
              className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <span>Pagar</span> <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
