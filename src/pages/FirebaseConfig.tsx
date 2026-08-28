import React, { useState } from 'react';
import { Cloud, CheckCircle2, AlertCircle, Key, ExternalLink, Save, RefreshCw, Layers } from 'lucide-react';
import { getStoredFirebaseConfig, FirebaseConfigKeys } from '../config/firebase';
import { firebaseApi } from '../services/firebaseApi';

export const FirebaseConfig: React.FC = () => {
  const currentConfig = getStoredFirebaseConfig();
  const isConnected = firebaseApi.isConfigured();

  const [keys, setKeys] = useState<FirebaseConfigKeys>({
    apiKey: currentConfig?.apiKey || '',
    authDomain: currentConfig?.authDomain || '',
    projectId: currentConfig?.projectId || '',
    storageBucket: currentConfig?.storageBucket || '',
    messagingSenderId: currentConfig?.messagingSenderId || '',
    appId: currentConfig?.appId || '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('cepr_firebase_config', JSON.stringify(keys));
      setMessage({ type: 'success', text: '✅ Configurações salvas! Reiniciando conexão com o Firebase...' });
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (e) {
      setMessage({ type: 'error', text: '❌ Erro ao salvar chaves do Firebase.' });
    }
  };

  const handleDisconnect = () => {
    if (confirm('Deseja desconectar o Firebase? O sistema voltará ao modo padrão.')) {
      localStorage.removeItem('cepr_firebase_config');
      window.location.reload();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-400" />
            Configuração do Banco de Dados Online (Firebase)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Sincronização 100% online e em tempo real entre todos os seus dispositivos</p>
        </div>

        {/* Status Indicator */}
        <div>
          {isConnected ? (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <CheckCircle2 className="w-4 h-4" /> Conectado & Sincronizado no Firestore
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <AlertCircle className="w-4 h-4" /> Modo Local (Aguardando Chaves Firebase)
            </span>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Key Form */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            Chaves de Acesso do Seu Projeto Firebase
          </h3>
          <p className="text-xs text-slate-400">
            Cole as credenciais do seu projeto Firebase para ativar o banco de dados online na nuvem.
          </p>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">API Key (`apiKey`)</label>
                <input
                  type="text"
                  required
                  placeholder="AIzaSy..."
                  value={keys.apiKey}
                  onChange={(e) => setKeys({ ...keys, apiKey: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Project ID (`projectId`)</label>
                <input
                  type="text"
                  required
                  placeholder="contabil-cepr-1234"
                  value={keys.projectId}
                  onChange={(e) => setKeys({ ...keys, projectId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Auth Domain (`authDomain`)</label>
                <input
                  type="text"
                  placeholder="contabil-cepr.firebaseapp.com"
                  value={keys.authDomain}
                  onChange={(e) => setKeys({ ...keys, authDomain: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Storage Bucket (`storageBucket`)</label>
                <input
                  type="text"
                  placeholder="contabil-cepr.appspot.com"
                  value={keys.storageBucket}
                  onChange={(e) => setKeys({ ...keys, storageBucket: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Messaging Sender ID (`messagingSenderId`)</label>
                <input
                  type="text"
                  placeholder="1234567890"
                  value={keys.messagingSenderId}
                  onChange={(e) => setKeys({ ...keys, messagingSenderId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">App ID (`appId`)</label>
                <input
                  type="text"
                  placeholder="1:1234567890:web:abcdef"
                  value={keys.appId}
                  onChange={(e) => setKeys({ ...keys, appId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                >
                  Desconectar Firebase
                </button>
              ) : (
                <div></div>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Salvar & Conectar ao Firebase
              </button>
            </div>
          </form>
        </div>

        {/* Step by Step Helper Guide */}
        <div className="glass-card p-6 rounded-2xl space-y-4 border-l-4 border-l-amber-500">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            Como criar seu Firebase Grátis (2 min):
          </h3>

          <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
            <li className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              Acesse o console do Firebase:{' '}
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 font-bold underline inline-flex items-center gap-1 mt-1"
              >
                console.firebase.google.com <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              Clique em <strong className="text-white">"Adicionar projeto"</strong> e nomeie como <strong className="text-amber-400">contabil-cepr</strong>.
            </li>
            <li className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              Vá em <strong className="text-white">Build ➔ Firestore Database</strong> e clique em <strong className="text-emerald-400">Criar Banco de Dados</strong>.
            </li>
            <li className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              Em <strong className="text-white">⚙️ Configurações do Projeto ➔ Seus Aplicativos</strong>, clique em <strong className="text-indigo-400">Web (&lt;/&gt;)</strong> para copiar as 6 chaves ao lado!
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
