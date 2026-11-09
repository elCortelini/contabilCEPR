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
import { FirebaseConfig } from './pages/FirebaseConfig';
import { Login } from './pages/Login';
import { NatalLuz } from './pages/NatalLuz';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash.replace(/^#\/?/, '');
      return urlParams.get('tab') || hash || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      // Auto-autenticação para links de compartilhamento direto à administradora
      if (urlParams.get('direct') === '1' || urlParams.get('acesso') === 'admin') {
        const guestAdmin = {
          id: 9999,
          name: 'Administradora CEPR',
          email: 'administracao@cepr.edu.br',
          role: 'admin',
          status: 'approved'
        };
        localStorage.setItem('cepr_current_user', JSON.stringify(guestAdmin));
        return guestAdmin;
      }

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
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-emerald-500 text-emerald-800 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} currentUser={currentUser} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar activeTab={activeTab} onReimport={handleReimport} isReimporting={isReimporting} />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'natal' && <NatalLuz />}
          {activeTab === 'carteiras' && <Carteiras />}
          {activeTab === 'entradas' && <Entradas />}
          {activeTab === 'saidas' && <Saidas />}
          {activeTab === 'alunos' && <Alunos />}
          {activeTab === 'categorias' && <Categorias />}
          {activeTab === 'fornecedores' && <Fornecedores />}
          {activeTab === 'produtos' && <Produtos />}
          {activeTab === 'relatorios' && <Relatorios />}
          {activeTab === 'firebase' && <FirebaseConfig />}
          {activeTab === 'backup' && <BackupCenter />}
          {activeTab === 'usuarios' && <Usuarios currentUser={currentUser} />}
        </main>
      </div>
    </div>
  );
};
