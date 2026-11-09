import React from 'react';
import { Download, RefreshCw, Calendar, Search, CheckCircle2, Menu } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onReimport: () => void;
  isReimporting: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onReimport, isReimporting, onToggleSidebar }) => {
  const titles: Record<string, string> = {
    dashboard: 'Visão Geral & Indicadores',
    natal: 'Vendas & Comandas — Natal Luz 🎄',
    carteiras: 'Gerenciamento de Carteiras & Saldos',
    entradas: 'Receitas & Entradas Financeiras',
    saidas: 'Despesas & Saídas Financeiras',
    fornecedores: 'Fornecedores & Contas a Pagar',
    produtos: 'Produtos, Estoque & Margem de Lucro',
    relatorios: 'Relatórios Consolidados & Exportação CSV',
    alunos: 'Alunos & Mensalidades',
    categorias: 'Categorias Contábeis',
    firebase: 'Banco Online Firebase',
    backup: 'Backup & Restauração',
    usuarios: 'Controle de Acessos',
  };

  const handleExportCsv = () => {
    window.open('/api/relatorios/export-csv', '_blank');
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shadow-md sticky top-0 z-20 text-white">
      <div className="flex items-center gap-3">
        {/* Botão Hambúrguer Mobile */}
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 md:hidden flex items-center justify-center cursor-pointer transition"
          title="Abrir menu de navegação"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-none">
            {titles[activeTab] || 'Gestão Financeira Escolar'}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 font-normal hidden xs:block">
            Colégio Educacional • Ano Letivo 2026
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Base Migrada (154 Lançamentos)</span>
        </div>

        {/* Re-import trigger */}
        <button
          onClick={onReimport}
          disabled={isReimporting}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
          title="Reimportar dados do backup JSON"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReimporting ? 'animate-spin text-indigo-400' : ''}`} />
          <span>{isReimporting ? 'Sincronizando...' : 'Reimportar Base'}</span>
        </button>

        {/* Quick CSV Export button */}
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar CSV</span>
        </button>
      </div>
    </header>
  );
};
