import React, { useState } from 'react';
import { Database, Download, Upload, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const BackupCenter: React.FC = () => {
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async () => {
    await api.exportBackupJSON();
    setStatusMsg({ type: 'success', text: '✅ Arquivo de backup JSON gerado e baixado com sucesso!' });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await api.restoreBackupJSON(content);
      if (success) {
        setStatusMsg({ type: 'success', text: '🎉 Backup restaurado com sucesso! Recarregando dados...' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setStatusMsg({ type: 'error', text: '❌ Erro ao ler arquivo de backup. Verifique o formato JSON.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            Central de Backup & Restauração de Dados
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Exporte cópias de segurança em JSON ou restaure o histórico completo a qualquer momento</p>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
          statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between border-l-4 border-l-indigo-500">
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Exportar Backup Atual (JSON)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Gera um arquivo contendo todo o histórico de carteiras, lançamentos de receitas, despesas, alunos, mensalidades e produtos cadastrados no sistema.
            </p>
          </div>

          <button
            onClick={handleExport}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Baixar Backup em JSON
          </button>
        </div>

        {/* Import Card */}
        <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Restaurar do Arquivo (JSON)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Carregue um arquivo `.json` de backup para restaurar a base inteira de dados do seu sistema contábil.
            </p>
          </div>

          <label className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer text-center">
            <Upload className="w-4 h-4" />
            <span>Selecionar Arquivo JSON</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
