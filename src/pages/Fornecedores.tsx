import React, { useEffect, useState } from 'react';
import { Users, Plus, DollarSign, Building2, Phone, MapPin } from 'lucide-react';
import { api } from '../services/api';

export const Fornecedores: React.FC = () => {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [carteiras, setCarteiras] = useState<any[]>([]);
  const [modalNewOpen, setModalNewOpen] = useState(false);
  const [modalPayOpen, setModalPayOpen] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState<any>(null);

  const [newForm, setNewForm] = useState({
    nome: '',
    contato: '',
    endereco: '',
    observacoes: '',
    saldoPendente: '0',
  });

  const [payForm, setPayForm] = useState({
    carteiraId: '',
    valor: '',
    formaPagamento: 'dinheiro',
  });

  const loadData = async () => {
    const list = await api.getFornecedores();
    setFornecedores(list);
    const carts = await api.getCarteiras();
    setCarteiras(carts);
    if (carts.length > 0 && !payForm.carteiraId) {
      setPayForm((prev) => ({ ...prev, carteiraId: carts[0].id.toString() }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createFornecedor(newForm);
    setModalNewOpen(false);
    setNewForm({ nome: '', contato: '', endereco: '', observacoes: '', saldoPendente: '0' });
    loadData();
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFornecedor) return;

    // Create saida
    await api.createSaida({
      carteiraId: payForm.carteiraId,
      valor: payForm.valor,
      descricao: `Pagamento Fornecedor: ${selectedFornecedor.nome}`,
      formaPagamento: payForm.formaPagamento,
      fornecedorId: selectedFornecedor.id,
      data: new Date().toISOString().split('T')[0],
    });

    setModalPayOpen(false);
    setSelectedFornecedor(null);
    setPayForm({ carteiraId: carteiras[0]?.id?.toString() || '', valor: '', formaPagamento: 'dinheiro' });
    loadData();
  };

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const totalPendente = fornecedores.reduce((acc, f) => acc + (parseFloat(f.saldoPendente) || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Gestão de Fornecedores & Contas a Pagar
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Cadastre parceiros comerciais e efetue pagamentos diretos com débito na carteira</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium">Pendente Total a Pagar</span>
            <p className="text-xl font-black text-amber-400">{formatBrl(totalPendente)}</p>
          </div>
          <button
            onClick={() => setModalNewOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Fornecedor
          </button>
        </div>
      </div>

      {/* Fornecedores Grid */}
      {fornecedores.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl space-y-3">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">Nenhum fornecedor cadastrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Cadastre fornecedores de insumos ou serviços para controlar saldos a pagar e registrar pagamentos diretos.
          </p>
          <button
            onClick={() => setModalNewOpen(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Cadastrar Primeiro Fornecedor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fornecedores.map((f) => (
            <div key={f.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-white">{f.nome}</h3>
                    {f.contato && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Phone className="w-3.5 h-3.5 text-indigo-400" /> {f.contato}
                      </p>
                    )}
                    {f.endereco && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" /> {f.endereco}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Pendente</span>
                    <p className={`text-base font-black ${f.saldoPendente > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {formatBrl(f.saldoPendente)}
                    </p>
                  </div>
                </div>

                {f.observacoes && (
                  <p className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 mt-3">
                    {f.observacoes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setSelectedFornecedor(f);
                    setPayForm((prev) => ({ ...prev, valor: f.saldoPendente > 0 ? f.saldoPendente.toString() : '' }));
                    setModalPayOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <DollarSign className="w-4 h-4" />
                  Efetuar Pagamento
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Fornecedor */}
      {modalNewOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl space-y-4 border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Cadastrar Fornecedor</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Razão Social / Nome Fantasia</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Distribuidora de Alimentos Itajaí"
                  value={newForm.nome}
                  onChange={(e) => setNewForm({ ...newForm, nome: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contato / Telefone</label>
                  <input
                    type="text"
                    placeholder="(47) 99999-9999"
                    value={newForm.contato}
                    onChange={(e) => setNewForm({ ...newForm, contato: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Saldo Pendente Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newForm.saldoPendente}
                    onChange={(e) => setNewForm({ ...newForm, saldoPendente: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Endereço</label>
                <input
                  type="text"
                  placeholder="Rua, número, bairro..."
                  value={newForm.endereco}
                  onChange={(e) => setNewForm({ ...newForm, endereco: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observações</label>
                <textarea
                  rows={2}
                  placeholder="Condições de pagamento, chave PIX, etc."
                  value={newForm.observacoes}
                  onChange={(e) => setNewForm({ ...newForm, observacoes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNewOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Efetuar Pagamento */}
      {modalPayOpen && selectedFornecedor && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl space-y-4 border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Pagamento para {selectedFornecedor.nome}
            </h3>
            <p className="text-xs text-slate-400">
              O valor pago será registrado como saída na carteira selecionada e abaterá o saldo pendente do fornecedor.
            </p>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Carteira de Origem (Débito)</label>
                <select
                  required
                  value={payForm.carteiraId}
                  onChange={(e) => setPayForm({ ...payForm, carteiraId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {carteiras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} (Saldo disponível: {formatBrl(c.saldoAtual)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Valor a Pagar (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={payForm.valor}
                  onChange={(e) => setPayForm({ ...payForm, valor: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Forma de Pagamento</label>
                <select
                  value={payForm.formaPagamento}
                  onChange={(e) => setPayForm({ ...payForm, formaPagamento: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="dinheiro">Dinheiro em Espécie</option>
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="cartao">Cartão de Crédito</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalPayOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
