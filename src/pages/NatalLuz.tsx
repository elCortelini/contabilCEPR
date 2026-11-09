import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  QrCode, 
  Search, 
  Plus, 
  Minus, 
  RefreshCw, 
  Trash2, 
  Utensils, 
  Receipt, 
  Phone, 
  User, 
  GraduationCap, 
  ChevronRight,
  Printer,
  Calendar,
  AlertCircle,
  Share2
} from 'lucide-react';
import { api } from '../services/api';
import { 
  generatePixPayload, 
  getPixQrCodeUrl, 
  CHAVE_PIX_CEPR, 
  NOME_RECEBEDOR_PIX, 
  CIDADE_PIX, 
  WHATSAPP_APP 
} from '../utils/pix';

// Cardápio oficial da ficha enviada
const PRODUTOS_INICIAIS = [
  { id: 'hotdog', nome: 'Cachorro-quente', valorUnitario: 10.00, icone: '🌭' },
  { id: 'pastel', nome: 'Pastel', valorUnitario: 10.00, icone: '🥟' },
  { id: 'refri', nome: 'Refrigerante', valorUnitario: 7.00, icone: '🥤' },
  { id: 'agua', nome: 'Água', valorUnitario: 5.00, icone: '💧' },
  { id: 'pipoca_doce', nome: 'Pipoca doce', valorUnitario: 7.00, icone: '🍿' },
  { id: 'pipoca_salgada', nome: 'Pipoca salgada', valorUnitario: 5.00, icone: '🍿' },
  { id: 'bolo', nome: 'Bolo', valorUnitario: 8.00, icone: '🍰' },
];

export const NatalLuz: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'nova' | 'comandas' | 'cozinha'>('nova');
  const [loading, setLoading] = useState(false);

  // Formulário da Nova Comanda
  const [estudante, setEstudante] = useState('');
  const [turma, setTurma] = useState('');
  const [professor, setProfessor] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [telefone, setTelefone] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'dinheiro'>('pix');
  const [ticketEntregue, setTicketEntregue] = useState(false);
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});

  // Listagem & Filtros
  const [comandas, setComandas] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroTicket, setFiltroTicket] = useState<'todos' | 'entregue' | 'pendente'>('todos');

  // Modal de Sucesso / Envio WhatsApp
  const [modalSucesso, setModalSucesso] = useState<any | null>(null);
  const [copiadoPix, setCopiadoPix] = useState(false);
  const [copiadoTexto, setCopiadoTexto] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState(false);
  const [mostrarQrCodeModal, setMostrarQrCodeModal] = useState(false);

  const handleCopiarLinkExclusivo = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const urlExclusiva = `${baseUrl}?tab=natal&direct=1`;
    navigator.clipboard.writeText(urlExclusiva);
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 2500);
  };

  // Resumo da Cozinha
  const [resumoCozinha, setResumoCozinha] = useState<any>(null);

  // Carrega comandas e resumo
  const carregarDados = async () => {
    setLoading(true);
    try {
      const [lista, resumo] = await Promise.all([
        api.getNatalComandas(),
        api.getNatalResumo()
      ]);
      setComandas(lista || []);
      setResumoCozinha(resumo || null);
    } catch (e) {
      console.error('Erro ao carregar dados do Natal Luz:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Máscara de telefone simples
  const handleTelefoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').substring(0, 11);
    let formatted = raw;
    if (raw.length > 2 && raw.length <= 7) {
      formatted = `(${raw.substring(0, 2)}) ${raw.substring(2)}`;
    } else if (raw.length > 7) {
      formatted = `(${raw.substring(0, 2)}) ${raw.substring(2, 7)}-${raw.substring(7)}`;
    }
    setTelefone(formatted);
  };

  // Manipulação de quantidades
  const handleQtdChange = (id: string, delta: number) => {
    setQuantidades((prev) => {
      const atual = prev[id] || 0;
      const novo = Math.max(0, atual + delta);
      return { ...prev, [id]: novo };
    });
  };

  const handleQtdDirectInput = (id: string, val: string) => {
    const parsed = parseInt(val, 10);
    setQuantidades((prev) => ({
      ...prev,
      [id]: isNaN(parsed) ? 0 : Math.max(0, parsed)
    }));
  };

  // Cálculo de totais
  const itensCalculados = useMemo(() => {
    return PRODUTOS_INICIAIS.map((p) => {
      const quantidade = quantidades[p.id] || 0;
      const subtotal = quantidade * p.valorUnitario;
      return { ...p, quantidade, subtotal };
    });
  }, [quantidades]);

  const totalGeral = useMemo(() => {
    return itensCalculados.reduce((acc, item) => acc + item.subtotal, 0);
  }, [itensCalculados]);

  const totalItensQtd = useMemo(() => {
    return itensCalculados.reduce((acc, item) => acc + item.quantidade, 0);
  }, [itensCalculados]);

  const itensSelecionados = useMemo(() => {
    return itensCalculados.filter((i) => i.quantidade > 0);
  }, [itensCalculados]);

  // Limpar formulário
  const handleResetForm = () => {
    setEstudante('');
    setTurma('');
    setProfessor('');
    setResponsavel('');
    setTelefone('');
    setFormaPagamento('pix');
    setTicketEntregue(false);
    setQuantidades({});
  };

  // Sanitização de telefone para o link do WhatsApp
  const sanitizarTelefone = (tel: string) => {
    const nums = tel.replace(/\D/g, '');
    if (nums.startsWith('55')) return nums;
    return `55${nums}`;
  };

  // Gerador de mensagem formatada para WhatsApp
  const gerarTextoWhatsApp = (comandaId: number | string, pixPayloadStr?: string) => {
    const dataHora = new Date().toLocaleString('pt-BR');
    const linhasItens = itensSelecionados
      .map((it) => `• ${it.quantidade}x ${it.nome} — R$ ${it.subtotal.toFixed(2).replace('.', ',')}`)
      .join('\n');

    let msg = `🎄 *COLÉGIO CE PEDRO RIZZI - NATAL LUZ* 🎄\n`;
    msg += `✨ *FICHA DE ENCOMENDA & COMANDA* ✨\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📄 *Comanda Nº:* #${comandaId.toString().padStart(5, '0')}\n`;
    msg += `📅 *Data:* ${dataHora}\n\n`;
    msg += `👤 *Estudante:* ${estudante.trim()}\n`;
    if (turma.trim()) msg += `🏫 *Turma:* ${turma.trim()}\n`;
    if (professor.trim()) msg += `👩‍🏫 *Prof(a):* ${professor.trim()}\n`;
    msg += `👨‍👩‍👧 *Responsável:* ${responsavel.trim()}\n`;
    msg += `📞 *Telefone:* ${telefone.trim()}\n\n`;
    msg += `📦 *ITENS ENCOMENDADOS:*\n${linhasItens}\n\n`;
    msg += `💰 *TOTAL DO PEDIDO: R$ ${totalGeral.toFixed(2).replace('.', ',')}*\n`;
    msg += `💳 *Forma de Pagamento:* ${formaPagamento === 'pix' ? 'PIX' : 'DINHEIRO'}\n`;
    msg += `🎟️ *Ticket Entregue:* ${ticketEntregue ? 'SIM (Retirado) ✅' : 'NÃO (Pendente de Retirada) ⏳'}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    if (formaPagamento === 'pix') {
      msg += `📲 *PAGAMENTO PIX (VALOR EXATO: R$ ${totalGeral.toFixed(2).replace('.', ',')}):*\n`;
      msg += `_Copie o código abaixo e cole no app do seu banco na opção "Pix Copia e Cola":_\n\n`;
      msg += `${pixPayloadStr || ''}\n\n`;
      msg += `ℹ️ *Chave Pix Alternativa (E-mail):* ${CHAVE_PIX_CEPR}\n`;
      msg += `📌 Após pagar, envie o comprovante para este WhatsApp da APP: ${WHATSAPP_APP}\n`;
    } else {
      msg += `💵 *PAGAMENTO EM DINHEIRO:*\n`;
      msg += `Por favor, realize o pagamento diretamente na administração da escola ou com os professores.\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_Obrigado por apoiar a nossa escola! Desejamos um Feliz Natal!_ ❤️✨`;

    return msg;
  };

  // Submissão do pedido
  const handleSalvarComanda = async () => {
    if (!estudante.trim()) {
      alert('Por favor, informe o nome do estudante.');
      return;
    }
    if (!responsavel.trim()) {
      alert('Por favor, informe o nome do responsável.');
      return;
    }
    if (!telefone.trim() || telefone.replace(/\D/g, '').length < 10) {
      alert('Por favor, informe um telefone de WhatsApp válido com DDD.');
      return;
    }
    if (itensSelecionados.length === 0) {
      alert('Selecione ao menos 1 item para a comanda.');
      return;
    }

    setLoading(true);

    try {
      const tempId = Date.now().toString().slice(-5);
      let payloadPix = '';

      if (formaPagamento === 'pix' && totalGeral > 0) {
        payloadPix = generatePixPayload({
          key: CHAVE_PIX_CEPR,
          name: NOME_RECEBEDOR_PIX,
          city: CIDADE_PIX,
          amount: totalGeral,
          txid: `NATAL${tempId}`
        });
      }

      const dadosComanda = {
        estudante: estudante.trim(),
        turma: turma.trim(),
        professor: professor.trim(),
        responsavel: responsavel.trim(),
        telefone: telefone.trim(),
        itens: itensSelecionados.map((it) => ({
          id: it.id,
          nome: it.nome,
          quantidade: it.quantidade,
          valorUnitario: it.valorUnitario,
          subtotal: it.subtotal
        })),
        total: totalGeral,
        formaPagamento,
        ticketEntregue,
        pixPayload: payloadPix
      };

      const res = await api.createNatalComanda(dadosComanda);
      const comandaId = res?.id || tempId;

      // Se o ID retornado for definitivo, regenera o Pix se necessário
      if (formaPagamento === 'pix' && totalGeral > 0) {
        payloadPix = generatePixPayload({
          key: CHAVE_PIX_CEPR,
          name: NOME_RECEBEDOR_PIX,
          city: CIDADE_PIX,
          amount: totalGeral,
          txid: `NATAL${comandaId.toString().padStart(4, '0')}`
        });
      }

      const textoWhats = gerarTextoWhatsApp(comandaId, payloadPix);

      setModalSucesso({
        id: comandaId,
        estudante,
        responsavel,
        telefone,
        total: totalGeral,
        formaPagamento,
        ticketEntregue,
        itens: itensSelecionados,
        pixPayload: payloadPix,
        textoWhats
      });

      // Recarrega listagens
      await carregarDados();
      handleResetForm();
    } catch (e: any) {
      console.error(e);
      alert('Erro ao salvar a comanda: ' + (e?.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  // Disparar WhatsApp
  const handleAbrirWhatsApp = (tel: string, texto: string) => {
    const numLimpo = sanitizarTelefone(tel);
    const url = `https://api.whatsapp.com/send?phone=${numLimpo}&text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  // Copiar código Pix
  const handleCopiarPix = (payload: string) => {
    navigator.clipboard.writeText(payload);
    setCopiadoPix(true);
    setTimeout(() => setCopiadoPix(false), 2500);
  };

  // Copiar texto da comanda
  const handleCopiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoTexto(true);
    setTimeout(() => setCopiadoTexto(false), 2500);
  };

  // Alternar status de ticket na listagem
  const handleToggleTicket = async (comanda: any) => {
    try {
      const novoStatus = !comanda.ticketEntregue;
      await api.updateNatalTicket(comanda.id, novoStatus);
      setComandas((prev) =>
        prev.map((c) => (c.id === comanda.id ? { ...c, ticketEntregue: novoStatus } : c))
      );
      // Atualiza resumo
      api.getNatalResumo().then((res) => setResumoCozinha(res));
    } catch (e) {
      console.error('Erro ao atualizar ticket:', e);
    }
  };

  // Excluir comanda
  const handleExcluirComanda = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta comanda de Natal?')) return;
    try {
      await api.deleteNatalComanda(id);
      setComandas((prev) => prev.filter((c) => c.id !== id));
      api.getNatalResumo().then((res) => setResumoCozinha(res));
    } catch (e) {
      console.error('Erro ao excluir comanda:', e);
    }
  };

  // Filtragem de comandas
  const comandasFiltradas = useMemo(() => {
    return comandas.filter((c) => {
      const matchBusca =
        !busca.trim() ||
        (c.estudante || '').toLowerCase().includes(busca.toLowerCase()) ||
        (c.responsavel || '').toLowerCase().includes(busca.toLowerCase()) ||
        (c.turma || '').toLowerCase().includes(busca.toLowerCase()) ||
        (c.id || '').toString().includes(busca);

      if (!matchBusca) return false;

      if (filtroTicket === 'entregue') return c.ticketEntregue;
      if (filtroTicket === 'pendente') return !c.ticketEntregue;
      return true;
    });
  }, [comandas, busca, filtroTicket]);

  return (
    <div className="min-h-full bg-slate-900 text-slate-100 pb-28 md:pb-12">
      {/* Banner Superior Natal Luz */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-800 via-emerald-900 to-red-950 border-b border-amber-500/30 px-4 py-5 sm:px-6 shadow-xl">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                CE PEDRO RIZZI
              </div>
              <button
                onClick={handleCopiarLinkExclusivo}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
                title="Copiar link exclusivo do Natal Luz para enviar à administradora"
              >
                {copiadoLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Share2 className="w-3.5 h-3.5 text-emerald-300" />}
                <span>{copiadoLink ? 'Link Copiado!' : 'Compartilhar Link'}</span>
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
              <span>✨ NATAL LUZ 🎅</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/90 font-medium mt-0.5">
              Ficha de Encomenda & Comanda Digital • Otimizado para Celular
            </p>
          </div>

          {/* Navegação entre Abas */}
          <div className="flex bg-slate-950/60 p-1 rounded-2xl border border-white/10 backdrop-blur-md w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab('nova')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                activeSubTab === 'nova'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Nova Ficha</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('comandas');
                carregarDados();
              }}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                activeSubTab === 'comandas'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Comandas</span>
              {comandas.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-emerald-950 text-emerald-300 text-[10px] rounded-full font-black border border-emerald-500/40">
                  {comandas.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveSubTab('cozinha');
                carregarDados();
              }}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                activeSubTab === 'cozinha'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Cozinha</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5">
        {/* ============================================================== */}
        {/* ABA 1: NOVA COMANDA (LANÇAMENTO NO CELULAR)                      */}
        {/* ============================================================== */}
        {activeSubTab === 'nova' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Bloco 1: Identificação (Família e Aluno) */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3">
                <User className="w-5 h-5 text-emerald-400" />
                <h2 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                  1. Dados do Aluno e Responsável
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Estudante <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={estudante}
                    onChange={(e) => setEstudante(e.target.value)}
                    placeholder="Nome completo do aluno"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Turma
                  </label>
                  <input
                    type="text"
                    value={turma}
                    onChange={(e) => setTurma(e.target.value)}
                    placeholder="Ex: 5º Ano A, 6º Ano B"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Professor(a)
                  </label>
                  <input
                    type="text"
                    value={professor}
                    onChange={(e) => setProfessor(e.target.value)}
                    placeholder="Nome do(a) professor(a)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Responsável <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    placeholder="Nome do pai/mãe/responsável"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Telefone WhatsApp (para envio da nota e Pix) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      value={telefone}
                      onChange={(e) => handleTelefoneChange(e.target.value)}
                      placeholder="(47) 99675-2537"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 2: Itens do Cardápio (Tabela e Controles Grandes) */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-400" />
                  <h2 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                    2. Cardápio de Produtos
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">Toque em + ou -</span>
              </div>

              <div className="space-y-2.5">
                {PRODUTOS_INICIAIS.map((prod) => {
                  const qtd = quantidades[prod.id] || 0;
                  const subtotal = qtd * prod.valorUnitario;
                  const selecionado = qtd > 0;

                  return (
                    <div
                      key={prod.id}
                      className={`p-3 sm:p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                        selecionado
                          ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm shadow-emerald-950'
                          : 'bg-slate-900/70 border-slate-700/60 hover:border-slate-600'
                      }`}
                    >
                      {/* Nome e Preço */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl select-none">{prod.icone}</span>
                        <div>
                          <h3 className="font-bold text-sm sm:text-base text-white truncate">
                            {prod.nome}
                          </h3>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-emerald-400">
                              R$ {prod.valorUnitario.toFixed(2).replace('.', ',')}
                            </span>
                            {selecionado && (
                              <span className="text-slate-400">
                                • Subtotal:{' '}
                                <strong className="text-white">
                                  R$ {subtotal.toFixed(2).replace('.', ',')}
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botões Grandes para Polegar (Lei de Fitts - min 48x48dp) */}
                      <div className="flex items-center gap-1.5 shrink-0 select-none">
                        <button
                          type="button"
                          onClick={() => handleQtdChange(prod.id, -1)}
                          disabled={qtd === 0}
                          aria-label={`Diminuir ${prod.nome}`}
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-lg transition active:scale-95 ${
                            qtd === 0
                              ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/40'
                              : 'bg-red-950/80 text-red-300 hover:bg-red-900 border border-red-700/60 shadow-sm'
                          }`}
                        >
                          <Minus className="w-5 h-5" />
                        </button>

                        <input
                          type="number"
                          min="0"
                          value={qtd === 0 ? '' : qtd}
                          onChange={(e) => handleQtdDirectInput(prod.id, e.target.value)}
                          placeholder="0"
                          className="w-12 h-11 sm:h-12 bg-slate-950 border border-slate-700 text-center font-black text-base text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />

                        <button
                          type="button"
                          onClick={() => handleQtdChange(prod.id, 1)}
                          aria-label={`Aumentar ${prod.nome}`}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center font-black text-lg transition shadow-md shadow-emerald-950 border border-emerald-400/40"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bloco 3: Pagamento & Controle de Ticket */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h2 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                  3. Forma de Pagamento & Entrega do Ticket
                </h2>
              </div>

              {/* Seletor de Pagamento */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormaPagamento('pix')}
                    className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 active:scale-98 ${
                      formaPagamento === 'pix'
                        ? 'bg-gradient-to-b from-emerald-900/60 to-emerald-950 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xl">💠</span>
                    <span className="font-bold text-sm">PIX</span>
                    <span className="text-[11px] text-emerald-300">Copia e Cola Automático</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormaPagamento('dinheiro')}
                    className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 active:scale-98 ${
                      formaPagamento === 'dinheiro'
                        ? 'bg-gradient-to-b from-amber-900/60 to-amber-950 border-amber-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xl">💵</span>
                    <span className="font-bold text-sm">DINHEIRO</span>
                    <span className="text-[11px] text-amber-300">Pagamento no Local</span>
                  </button>
                </div>

                {formaPagamento === 'pix' && (
                  <div className="mt-3 bg-emerald-950/40 border border-emerald-600/40 rounded-xl p-3 text-xs text-emerald-200 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Chave Pix Oficial da Escola:</p>
                      <p className="font-mono text-emerald-300 mt-0.5">{CHAVE_PIX_CEPR}</p>
                      <p className="text-[11px] text-emerald-200/80 mt-1">
                        O código <strong>Pix Copia e Cola com valor exato (R$ {totalGeral.toFixed(2).replace('.', ',')})</strong> será gerado e enviado para o WhatsApp do responsável.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Campo Adicional Requisitado: Ticket Entregue (Sim / Não) */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  🎟️ Ticket Entregue à Família? <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTicketEntregue(false)}
                    className={`p-3.5 rounded-xl border text-center transition flex items-center justify-center gap-2 active:scale-98 ${
                      !ticketEntregue
                        ? 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-sm">NÃO (Pendente)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTicketEntregue(true)}
                    className={`p-3.5 rounded-xl border text-center transition flex items-center justify-center gap-2 active:scale-98 ${
                      ticketEntregue
                        ? 'bg-emerald-950/80 border-emerald-400 text-emerald-100 shadow-md ring-1 ring-emerald-400/50'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-sm">SIM (Entregue)</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {ticketEntregue
                    ? '✅ O responsável já retirou as fichas de consumo em mãos.'
                    : '⏳ As fichas ainda serão retiradas na secretaria ou no dia do evento.'}
                </p>
              </div>
            </div>

            {/* Barra Inferior Fixa (Sticky Bottom Bar para Celular) */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 p-3.5 sm:p-4 backdrop-blur-md shadow-2xl">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                    Total do Pedido ({totalItensQtd} itens)
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
                    R$ {totalGeral.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSalvarComanda}
                  disabled={loading || totalGeral === 0}
                  className={`px-5 py-3.5 rounded-xl font-black text-sm tracking-wide transition flex items-center gap-2 shadow-xl active:scale-95 ${
                    totalGeral === 0 || loading
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white hover:brightness-110 shadow-emerald-950 border border-emerald-400/50 animate-pulse'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Salvando...' : 'Salvar & Enviar WhatsApp'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 2: COMANDAS & CONTROLE DE TICKETS                          */}
        {/* ============================================================== */}
        {activeSubTab === 'comandas' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Barra de Busca e Filtros */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por estudante, responsável, turma ou Nº..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                <button
                  onClick={() => setFiltroTicket('todos')}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                    filtroTicket === 'todos'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Todas ({comandas.length})
                </button>
                <button
                  onClick={() => setFiltroTicket('pendente')}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                    filtroTicket === 'pendente'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Pendentes de Entrega</span>
                </button>
                <button
                  onClick={() => setFiltroTicket('entregue')}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                    filtroTicket === 'entregue'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Tickets Entregues</span>
                </button>
              </div>
            </div>

            {/* Listagem de Comandas */}
            {comandasFiltradas.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400">
                <Receipt className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-sm">Nenhuma comanda encontrada.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Cadastre um pedido na aba "Nova Ficha".
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {comandasFiltradas.map((cmd) => {
                  const itensArr = Array.isArray(cmd.itens) ? cmd.itens : [];
                  const totalNum = parseFloat(cmd.total) || 0;

                  return (
                    <div
                      key={cmd.id}
                      className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-md space-y-3 transition hover:border-slate-600"
                    >
                      {/* Topo do Card */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-700/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-base">
                              #{cmd.id.toString().padStart(5, '0')}
                            </span>
                            <span className="text-xs text-slate-400">
                              {cmd.criadaEm ? new Date(cmd.criadaEm).toLocaleString('pt-BR') : ''}
                            </span>
                          </div>
                          <h3 className="font-bold text-emerald-400 text-base mt-0.5">
                            {cmd.estudante}
                          </h3>
                          <p className="text-xs text-slate-300">
                            {cmd.turma && <span className="font-semibold">{cmd.turma} • </span>}
                            Resp: <strong>{cmd.responsavel}</strong> ({cmd.telefone})
                          </p>
                        </div>

                        {/* Badges de Status */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-black border flex items-center gap-1 ${
                              cmd.ticketEntregue
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                                : 'bg-amber-950 text-amber-300 border-amber-500/50'
                            }`}
                          >
                            {cmd.ticketEntregue ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Ticket Entregue</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Ticket Pendente</span>
                              </>
                            )}
                          </span>

                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {cmd.formaPagamento === 'pix' ? '💠 Pix' : '💵 Dinheiro'}
                          </span>
                        </div>
                      </div>

                      {/* Itens do Pedido */}
                      <div className="bg-slate-900/60 rounded-xl p-3 text-xs space-y-1">
                        <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">
                          Itens da Comanda:
                        </span>
                        {itensArr.map((it: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-slate-300">
                            <span>
                              {it.quantidade}x {it.nome}
                            </span>
                            <span className="font-semibold text-slate-200">
                              R$ {(parseFloat(it.subtotal) || 0).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                        <div className="border-t border-slate-700/60 pt-1.5 mt-1.5 flex justify-between font-black text-sm text-amber-400">
                          <span>Total</span>
                          <span>R$ {totalNum.toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>

                      {/* Botões de Ação Rápida */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        {/* Botão de Alternar Ticket Entregue */}
                        <button
                          type="button"
                          onClick={() => handleToggleTicket(cmd)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            cmd.ticketEntregue
                              ? 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{cmd.ticketEntregue ? 'Marcar como Pendente' : 'Marcar como Entregue'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {/* Reenviar WhatsApp */}
                          <button
                            type="button"
                            onClick={() => {
                              const texto = gerarTextoWhatsApp(cmd.id, cmd.pixPayload);
                              handleAbrirWhatsApp(cmd.telefone, texto);
                            }}
                            className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 text-xs font-bold transition flex items-center gap-1"
                            title="Reenviar pelo WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Excluir */}
                          <button
                            type="button"
                            onClick={() => handleExcluirComanda(cmd.id)}
                            className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/40 text-xs font-bold transition"
                            title="Excluir comanda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 3: RESUMO DA COZINHA & PRODUÇÃO                            */}
        {/* ============================================================== */}
        {activeSubTab === 'cozinha' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Cards de Métricas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Geral
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 mt-1 block">
                  R$ {(resumoCozinha?.faturamentoTotal || 0).toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-slate-500">
                  {resumoCozinha?.totalComandas || 0} comandas
                </span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total em Pix
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 block">
                  R$ {(resumoCozinha?.totalPix || 0).toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-emerald-400/80">Via conta escolar</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total em Dinheiro
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-300 mt-1 block">
                  R$ {(resumoCozinha?.totalDinheiro || 0).toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-amber-400/80">No caixa físico</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tickets
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-black text-emerald-400">
                    {resumoCozinha?.ticketsEntregues || 0} entregues
                  </span>
                </div>
                <span className="text-[10px] text-amber-400">
                  {resumoCozinha?.ticketsPendentes || 0} pendentes
                </span>
              </div>
            </div>

            {/* Tabela de Produção da Cozinha */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-400" />
                  <h2 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                    Demanda de Preparo & Estoque da Cozinha
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={carregarDados}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                  title="Atualizar dados"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {PRODUTOS_INICIAIS.map((prod) => {
                  const achado = (resumoCozinha?.produtos || []).find(
                    (p: any) => p.nome.toLowerCase() === prod.nome.toLowerCase()
                  );
                  const qtdTotal = achado?.quantidade || 0;
                  const valorTotal = achado?.valorTotal || 0;

                  return (
                    <div
                      key={prod.id}
                      className="p-3.5 bg-slate-900/70 border border-slate-700/60 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{prod.icone}</span>
                        <div>
                          <h4 className="font-bold text-white text-sm sm:text-base">
                            {prod.nome}
                          </h4>
                          <span className="text-xs text-slate-400">
                            Valor unitário: R$ {prod.valorUnitario.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xl sm:text-2xl font-black text-amber-400 block">
                          {qtdTotal} <span className="text-xs font-normal text-slate-400">un</span>
                        </span>
                        <span className="text-xs text-emerald-400 font-semibold">
                          Total: R$ {valorTotal.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL DE SUCESSO & ENVIO DO WHATSAPP                           */}
      {/* ============================================================== */}
      {modalSucesso && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/50 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-8 text-slate-100">
            {/* Topo do Modal */}
            <div className="text-center space-y-1">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-950">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Comanda Registrada com Sucesso!
              </span>
              <h2 className="text-2xl font-black text-white">
                Comanda #{modalSucesso.id.toString().padStart(5, '0')}
              </h2>
              <p className="text-xs text-slate-400">
                Aluno: <strong className="text-white">{modalSucesso.estudante}</strong> • Total:{' '}
                <strong className="text-amber-400">
                  R$ {modalSucesso.total.toFixed(2).replace('.', ',')}
                </strong>
              </p>
            </div>

            {/* Ação Principal: Disparo WhatsApp (Lei de Von Restorff) */}
            <button
              type="button"
              onClick={() => handleAbrirWhatsApp(modalSucesso.telefone, modalSucesso.textoWhats)}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-base tracking-wide flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950 active:scale-98 transition"
            >
              <Send className="w-5 h-5" />
              <span>Abrir WhatsApp do Responsável</span>
            </button>

            {/* Bloco de Código Pix Copia e Cola (se Pix) */}
            {modalSucesso.formaPagamento === 'pix' && modalSucesso.pixPayload && (
              <div className="bg-slate-950 border border-emerald-700/50 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" />
                    Pix Copia e Cola (Valor: R$ {modalSucesso.total.toFixed(2).replace('.', ',')})
                  </span>
                  <button
                    type="button"
                    onClick={() => setMostrarQrCodeModal(!mostrarQrCodeModal)}
                    className="text-[11px] text-amber-300 underline font-semibold hover:text-amber-200"
                  >
                    {mostrarQrCodeModal ? 'Ocultar QR Code' : 'Ver QR Code'}
                  </button>
                </div>

                {/* Exibição opcional do QR Code na tela */}
                {mostrarQrCodeModal && (
                  <div className="bg-white p-3 rounded-xl mx-auto w-48 h-48 flex items-center justify-center shadow-lg my-2">
                    <img
                      src={getPixQrCodeUrl(modalSucesso.pixPayload, 200)}
                      alt="QR Code Pix"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-[11px] font-mono text-slate-300 break-all select-all max-h-20 overflow-y-auto">
                  {modalSucesso.pixPayload}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopiarPix(modalSucesso.pixPayload)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-emerald-500/30"
                >
                  {copiadoPix ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Código Pix Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Código Pix Copia e Cola</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Ações Secundárias */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopiarTexto(modalSucesso.textoWhats)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
              >
                {copiadoTexto ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Texto Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setModalSucesso(null)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700"
              >
                Nova Comanda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
