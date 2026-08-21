import React, { useEffect, useState } from 'react';
import { Users, Shield, CheckCircle2, XCircle, Clock, UserPlus, Lock, Unlock } from 'lucide-react';
import { api } from '../services/api';

interface UsuariosProps {
  currentUser: any;
}

export const Usuarios: React.FC<UsuariosProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const list = await api.getUsers();
      setUsers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleApprove = async (id: number) => {
    await api.approveUser(id);
    loadUsers();
  };

  const handleBlock = async (id: number) => {
    if (confirm('Deseja bloquear este usuário? Ele perderá acesso ao sistema contábil.')) {
      await api.blockUser(id);
      loadUsers();
    }
  };

  const handleRoleChange = async (id: number, role: string) => {
    await api.updateUserRole(id, role);
    loadUsers();
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            Controle de Acessos & Permissões (Painel do Administrador)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Gerencie os usuários autorizados a acessar o sistema contábil da escola</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Admin: {currentUser?.name}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Usuário</th>
                <th className="py-3.5 px-4">E-mail</th>
                <th className="py-3.5 px-4">Método</th>
                <th className="py-3.5 px-4">Status de Acesso</th>
                <th className="py-3.5 px-4">Função / Perfil</th>
                <th className="py-3.5 px-4 text-center">Ações do Administrador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const status = u.status || 'approved';
                return (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-[10px]">
                        {u.name ? u.name.substring(0, 2).toUpperCase() : 'US'}
                      </div>
                      <div>
                        {u.name || 'Sem nome'}
                        {isSelf && <span className="ml-1.5 text-[9px] text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded">(Você)</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">{u.email}</td>
                    <td className="py-3 px-4 capitalize text-slate-400">{u.loginMethod || 'google'}</td>
                    <td className="py-3 px-4">
                      {status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Aprovado
                        </span>
                      )}
                      {status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold animate-pulse">
                          <Clock className="w-3 h-3" /> Pendente de Aprovação
                        </span>
                      )}
                      {status === 'blocked' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                          <XCircle className="w-3 h-3" /> Bloqueado
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isAdmin && !isSelf ? (
                        <select
                          value={u.role || 'user'}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
                        >
                          <option value="admin">Administrador</option>
                          <option value="user">Operador (Escrita)</option>
                          <option value="viewer">Visualizador (Leitura)</option>
                        </select>
                      ) : (
                        <span className="capitalize text-xs font-semibold text-slate-200">{u.role === 'admin' ? 'Administrador' : u.role === 'viewer' ? 'Visualizador' : 'Operador'}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {!isSelf && isAdmin ? (
                        <div className="flex items-center justify-center gap-2">
                          {status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(u.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] shadow-sm transition cursor-pointer"
                              title="Aprovar Acesso"
                            >
                              <Unlock className="w-3 h-3" /> Aprovar
                            </button>
                          )}
                          {status !== 'blocked' && (
                            <button
                              onClick={() => handleBlock(u.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-semibold text-[10px] shadow-sm transition cursor-pointer"
                              title="Bloquear Acesso"
                            >
                              <Lock className="w-3 h-3" /> Bloquear
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">Privilégios Admin Protegidos</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
