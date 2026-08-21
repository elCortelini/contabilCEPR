import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Carteiras } from './pages/Carteiras';
import { Entradas } from './pages/Entradas';
import { Saidas } from './pages/Saidas';
import { Fornecedores } from './pages/Fornecedores';
import { Produtos } from './pages/Produtos';
import { Relatorios } from './pages/Relatorios';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isReimporting, setIsReimporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleReimport = () => {
    setIsReimporting(true);
    fetch('/api/importar', { method: 'POST' })
      .then((res) => res.json())
      .then((res) => {
        setIsReimporting(false);
        setToastMessage('✅ Base de dados reimportada com sucesso (154 lançamentos)!');
        setTimeout(() => setToastMessage(null), 4000);
        // Refresh page content
        window.location.reload();
      })
      .catch((err) => {
        setIsReimporting(false);
        setToastMessage('❌ Erro ao reimportar dados');
        setTimeout(() => setToastMessage(null), 4000);
      });
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar activeTab={activeTab} onReimport={handleReimport} isReimporting={isReimporting} />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'carteiras' && <Carteiras />}
          {activeTab === 'entradas' && <Entradas />}
          {activeTab === 'saidas' && <Saidas />}
          {activeTab === 'fornecedores' && <Fornecedores />}
          {activeTab === 'produtos' && <Produtos />}
          {activeTab === 'relatorios' && <Relatorios />}
        </main>
      </div>
    </div>
  );
};
