import React from 'react';
import { Download, RefreshCw, Calendar, Search, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onReimport: () => void;
  isReimporting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onReimport, isReimporting }) => {
  const titles: Record<string, string> = {
    dashboard: 'Visão Geral & Indicadores',
    carteiras: 'Gerenciamento de Carteiras & Saldos',
    entradas: 'Receitas & Entradas Financeiras',
    saidas: 'Despesas & Saídas Financeiras',
    fornecedores: 'Fornecedores & Contas a Pagar',
    produtos: 'Produtos, Estoque & Margem de Lucro',
    relatorios: 'Relatórios Consolidados & Exportação CSV',
  };

  const handleExportCsv = () => {
    window.open('/api/relatorios/export-csv', '_blank');
  };

  return (
    <header className="h-16 bg-slate-900/60 border-b border-slate-800/80 px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">
          {titles[activeTab] || 'Gestão Financeira Escolar'}
        </h2>
        <p className="text-xs text-slate-400 font-normal">
          Colegio Educacional • Ano Letivo 2026
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Base Migrada (154 Lançamentos)</span>
        </div>

        {/* Re-import trigger */}
        <button
          onClick={onReimport}
          disabled={isReimporting}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
          title="Reimportar dados do backup JSON"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReimporting ? 'animate-spin text-indigo-400' : ''}`} />
          <span>{isReimporting ? 'Sincronizando...' : 'Reimportar Base'}</span>
        </button>

        {/* Quick CSV Export button */}
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar CSV</span>
        </button>
      </div>
    </header>
  );
};
