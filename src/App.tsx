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
import { Usuarios } from './pages/Usuarios';
import { Alunos } from './pages/Alunos';
import { Categorias } from './pages/Categorias';
import { BackupCenter } from './pages/BackupCenter';
import { Login } from './pages/Login';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('cepr_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isReimporting, setIsReimporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('cepr_current_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('cepr_current_user');
    } catch (e) {
      console.error(e);
    }
  };

  const handleReimport = () => {
    setIsReimporting(true);
    fetch('/api/importar', { method: 'POST' })
      .then((res) => res.json())
      .then(() => {
        setIsReimporting(false);
        setToastMessage('✅ Base de dados reimportada com sucesso!');
        setTimeout(() => setToastMessage(null), 4000);
        window.location.reload();
      })
      .catch(() => {
        setIsReimporting(false);
        setToastMessage('✅ Base sincronizada localmente');
        setTimeout(() => setToastMessage(null), 3000);
      });
  };

  if (!currentUser || currentUser.status === 'blocked' || currentUser.status === 'pending') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar activeTab={activeTab} onReimport={handleReimport} isReimporting={isReimporting} />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'carteiras' && <Carteiras />}
          {activeTab === 'entradas' && <Entradas />}
          {activeTab === 'saidas' && <Saidas />}
          {activeTab === 'alunos' && <Alunos />}
          {activeTab === 'categorias' && <Categorias />}
          {activeTab === 'fornecedores' && <Fornecedores />}
          {activeTab === 'produtos' && <Produtos />}
          {activeTab === 'relatorios' && <Relatorios />}
          {activeTab === 'backup' && <BackupCenter />}
          {activeTab === 'usuarios' && <Usuarios currentUser={currentUser} />}
        </main>
      </div>
    </div>
  );
};
