import React, { useState } from 'react';
import { School, ShieldCheck, Lock, AlertTriangle, CheckCircle2, UserCheck, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'warning' | 'info'; title: string; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Preset quick accounts from historical database
  const presetUsers = [
    { name: 'Elevi Cortelini (Admin Supremo)', email: 'elcortelini@gmail.com', role: 'admin', badge: 'Admin' },
    { name: 'Elevi Cortelini Junior', email: 'elevi.junior@edu.itajai.sc.gov.br', role: 'user', badge: 'Usuário' },
    { name: 'Gabriela Eckstein Mello', email: 'gabriela.mello64871@edu.itajai.sc.gov.br', role: 'user', badge: 'Usuário' },
  ];

  const handleLoginWithEmail = async (email: string, name?: string) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const user = await api.login(email, name);

      if (user.status === 'blocked') {
        setStatusMessage({
          type: 'error',
          title: 'Acesso Bloqueado pelo Administrador',
          text: `Sua conta (${email}) foi bloqueada pelo administrador (Elevi Cortelini). Entre em contato para solicitar liberação.`,
        });
        setLoading(false);
        return;
      }

      if (user.status === 'pending') {
        setStatusMessage({
          type: 'warning',
          title: 'Aguardando Aprovação do Administrador',
          text: `Sua solicitação de acesso com o e-mail ${email} foi registrada! Aguarde a aprovação pelo Administrador (Elevi Cortelini).`,
        });
        setLoading(false);
        return;
      }

      // Approved or Admin
      onLoginSuccess(user);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        title: 'Falha no Login',
        text: 'Não foi possível autenticar. Tente novamente.',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30 border border-indigo-400/20">
            <School className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Contábil<span className="text-indigo-400">CEPR</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">Sistema de Gestão Financeira Escolar</p>
        </div>

        {/* Login Box */}
        <div className="glass-card p-8 rounded-3xl space-y-6 border border-slate-800 shadow-2xl">
          <div className="space-y-1 text-center">
            <h2 className="text-base font-bold text-white flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Autenticação & Controle de Acesso
            </h2>
            <p className="text-xs text-slate-400">
              Acesso exclusivo para administradores e contas autorizadas
            </p>
          </div>

          {/* Alert status message */}
          {statusMessage && (
            <div className={`p-4 rounded-2xl text-xs space-y-1 border ${
              statusMessage.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : statusMessage.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                {statusMessage.type === 'error' && <Lock className="w-4 h-4 text-rose-400" />}
                {statusMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {statusMessage.title}
              </div>
              <p className="opacity-90">{statusMessage.text}</p>
            </div>
          )}

          {/* Quick Account Selector */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Selecionar Conta Cadastrada:
            </label>

            <div className="space-y-2">
              {presetUsers.map((u) => (
                <button
                  key={u.email}
                  onClick={() => handleLoginWithEmail(u.email, u.name)}
                  disabled={loading}
                  className="w-full p-3.5 rounded-2xl bg-slate-900/80 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 flex items-center justify-between transition text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-400">
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-indigo-300 transition">{u.name}</p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    u.role === 'admin'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {u.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase font-bold">ou entrar com novo e-mail</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Custom Email Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (emailInput) handleLoginWithEmail(emailInput, nameInput);
            }}
            className="space-y-3"
          >
            <div>
              <input
                type="email"
                required
                placeholder="seu.email@escola.gov.br ou Google"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !emailInput}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <span>Solicitar Acesso / Entrar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <p className="text-[11px] text-center text-slate-500">
          Apenas administradores podem gerenciar o banco de dados e liberar novos acessos.
        </p>
      </div>
    </div>
  );
};
