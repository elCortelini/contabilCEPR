import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  FileText,
  School,
  Shield,
  LogOut,
  GraduationCap,
  Tag,
  Database,
  Cloud,
  Sparkles,
  Globe,
  ExternalLink,
  Github,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: any;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onLogout,
  isOpen = false,
  onClose 
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'natal', label: 'Natal Luz 🎄', icon: Sparkles, badge: 'Festa' },
    { id: 'carteiras', label: 'Carteiras', icon: Wallet, badge: '4' },
    { id: 'entradas', label: 'Entradas (Receitas)', icon: TrendingUp, badge: '99' },
    { id: 'saidas', label: 'Saídas (Despesas)', icon: TrendingDown, badge: '55' },
    { id: 'alunos', label: 'Alunos & Mensalidades', icon: GraduationCap, badge: null },
    { id: 'categorias', label: 'Categorias', icon: Tag, badge: null },
    { id: 'fornecedores', label: 'Fornecedores', icon: Users, badge: null },
    { id: 'produtos', label: 'Produtos & Estoque', icon: Package, badge: null },
    { id: 'relatorios', label: 'Relatórios & CSV', icon: FileText, badge: null },
    { id: 'firebase', label: 'Banco Online Firebase', icon: Cloud, badge: 'Nuvem' },
    { id: 'backup', label: 'Backup & Restauração', icon: Database, badge: null },
    { id: 'usuarios', label: 'Controle de Acessos', icon: Shield, badge: currentUser?.role === 'admin' ? 'Admin' : null },
  ];

  return (
    <>
      {/* Backdrop para fechar a barra lateral no celular */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between select-none shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <School className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
                  Contábil<span className="text-indigo-400">CEPR</span>
                </h1>
                <p className="text-xs text-slate-400 font-medium">Gestão Financeira Escolar</p>
              </div>
            </div>

            {/* Botão de Fechar no Celular */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden cursor-pointer"
              title="Fechar menu"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 mt-2 overflow-y-auto max-h-[calc(100vh-210px)]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-indigo-700 text-indigo-100'
                      : item.badge === 'Admin'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : item.badge === 'Nuvem'
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Atalho de Acesso Online & GitHub */}
      <div className="px-3 py-2 space-y-1.5 border-t border-slate-800/60 bg-slate-950/20">
        <a
          href="https://elcortelini.github.io/contabilCEPR/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 hover:border-indigo-400/60 text-indigo-300 hover:text-white transition group text-xs font-semibold shadow-sm"
          title="Abrir versão online no GitHub Pages"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="w-4 h-4 text-indigo-400 shrink-0 group-hover:scale-110 transition" />
            <span className="truncate">Acesso Online (Nuvem)</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-200 shrink-0 transition" />
        </a>

        <a
          href="https://github.com/elCortelini/contabilCEPR"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition text-[11px] font-medium"
          title="Ver código-fonte no GitHub"
        >
          <div className="flex items-center gap-2">
            <Github className="w-3.5 h-3.5 text-slate-400" />
            <span>Repositório GitHub</span>
          </div>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </a>
      </div>

      {/* Footer User Info & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 text-xs">
              {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{currentUser?.name || 'Usuário'}</p>
              <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {currentUser?.role === 'admin' ? 'Admin Supremo' : 'Operador Autorizado'}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            title="Sair do sistema"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
};
