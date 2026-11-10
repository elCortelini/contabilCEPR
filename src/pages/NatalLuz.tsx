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
  Share2,
  DollarSign,
  Download,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Filter,
  Users,
  MessageCircle,
  ExternalLink,
  Eye,
  CheckCheck,
  XCircle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { 
  generatePixPayload, 
  getPixQrCodeUrl, 
  CHAVE_PIX_CEPR, 
  NOME_RECEBEDOR_PIX, 
  CIDADE_PIX, 
  WHATSAPP_APP,
  formatCodigoPixTxid
} from '../utils/pix';
import { ComandasPrintModal } from '../components/natal/ComandasPrintModal';
import { BalancetePrintModal } from '../components/natal/BalancetePrintModal';

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
  const [activeSubTab, setActiveSubTab] = useState<'nova' | 'comandas' | 'cozinha' | 'arrecadacao'>('nova');
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

  // Listagem & Filtros (Aba Comandas)
  const [comandas, setComandas] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente_conferencia' | 'pago' | 'entregue' | 'aguardando_comprovante' | 'recusado'>('todos');
  const [filtroTicket, setFiltroTicket] = useState<'todos' | 'entregue' | 'pendente'>('todos');
  const [filtroTurma, setFiltroTurma] = useState<string>('todas');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modais de Impressão
  const [modalImpressaoComandas, setModalImpressaoComandas] = useState(false);
  const [turmaImpressaoLote, setTurmaImpressaoLote] = useState<string>('todas');
  const [modalBalancete, setModalBalancete] = useState(false);

  // Modal de Comprovante (Lightbox)
  const [modalComprovante, setModalComprovante] = useState<any | null>(null);
  const [motivoRecusaInput, setMotivoRecusaInput] = useState('');
  const [mostrarRecusaField, setMostrarRecusaField] = useState(false);

  // Filtros da Aba Arrecadação
  const [filtroFormaArrecadacao, setFiltroFormaArrecadacao] = useState<'todas' | 'pix' | 'dinheiro'>('todas');
  const [filtroTurmaArrecadacao, setFiltroTurmaArrecadacao] = useState<string>('todas');
  const [buscaArrecadacao, setBuscaArrecadacao] = useState('');

  // Modal de Sucesso / Envio WhatsApp
  const [modalSucesso, setModalSucesso] = useState<any | null>(null);
  const [copiadoPix, setCopiadoPix] = useState(false);
  const [copiadoTexto, setCopiadoTexto] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState(false);
  const [copiadoTextoPais, setCopiadoTextoPais] = useState(false);
  const [mostrarQrCodeModal, setMostrarQrCodeModal] = useState(false);

  const handleCopiarLinkExclusivo = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const urlExclusiva = `${baseUrl}?tab=natal&direct=1`;
    navigator.clipboard.writeText(urlExclusiva);
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 2500);
  };

  // Copiar mensagem completa com link público para os pais no WhatsApp
  const handleCopiarTextoPais = () => {
    const rawPath = window.location.pathname.replace(/\/+$/, '');
    const baseUrl = window.location.origin + rawPath;
    const linkPublico = `${baseUrl}/natalLuz`;

    const texto = `🎄 *CENTRO EDUCACIONAL PEDRO RIZZI* 🎄\n` +
      `✨ *NATAL LUZ 2026 - COMPRA ANTECIPADA DE COMANDAS* ✨\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Senhores pais e responsáveis,\n\n` +
      `Já está disponível o link para a compra antecipada das comandas de lanches, pasteis, doces e bebidas para o nosso evento de Natal!\n\n` +
      `👉 *FAÇA SEU PEDIDO AQUI:* ${linkPublico}\n\n` +
      `📌 *Como funciona:*\n` +
      `1️⃣ Selecione a turma e o nome do seu filho;\n` +
      `2️⃣ Escolha os itens do cardápio;\n` +
      `3️⃣ Pague pelo Pix oficial da escola com o código do seu pedido;\n` +
      `4️⃣ Anexe o comprovante direto na tela (ou envie no WhatsApp da APP ${WHATSAPP_APP}).\n\n` +
      `🎟️ *Importante:* Os tickets impressos serão entregues diretamente para o aluno na sala de aula antes da festa!\n\n` +
      `Contamos com o apoio de todos! ❤️✨`;

    navigator.clipboard.writeText(texto);
    setCopiadoTextoPais(true);
    setTimeout(() => setCopiadoTextoPais(false), 3000);
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
      msg += `_O código Pix Copia e Cola será enviado na mensagem seguinte para você copiar com apenas 1 toque e colar no app do seu banco!_\n\n`;
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

  // Lista de turmas disponíveis para filtros
  const turmasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    comandas.forEach((c) => {
      if (c.turma && c.turma.trim()) {
        set.add(c.turma.trim());
      }
    });
    return Array.from(set).sort();
  }, [comandas]);

  // Aprovar comprovante e confirmar pagamento (1 clique)
  const handleAprovarComanda = async (id: number) => {
    try {
      await api.updateNatalStatus(id, 'pago');
      setComandas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'pago' } : c))
      );
      if (modalComprovante && modalComprovante.id === id) {
        setModalComprovante(null);
      }
      api.getNatalResumo().then((res) => setResumoCozinha(res));
    } catch (e) {
      console.error('Erro ao aprovar comanda:', e);
      alert('Erro ao aprovar pagamento.');
    }
  };

  // Recusar comprovante informando motivo opcional
  const handleRecusarComanda = async (id: number) => {
    try {
      await api.updateNatalStatus(id, 'recusado', motivoRecusaInput.trim() || 'Comprovante ilegível ou incorreto');
      setComandas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'recusado', motivoRecusa: motivoRecusaInput.trim() || 'Comprovante ilegível ou incorreto' } : c))
      );
      setModalComprovante(null);
      setMostrarRecusaField(false);
      setMotivoRecusaInput('');
      api.getNatalResumo().then((res) => setResumoCozinha(res));
    } catch (e) {
      console.error('Erro ao recusar comanda:', e);
      alert('Erro ao recusar comanda.');
    }
  };

  // Imprimir lote da turma
  const handleImprimirLoteTurma = (nomeTurma: string) => {
    const daTurma = comandas.filter(c => 
      (c.turma || '').trim().toLowerCase() === nomeTurma.trim().toLowerCase() &&
      (c.status === 'pago' || c.status === 'entregue' || c.ticketEntregue)
    );
    if (daTurma.length === 0) {
      alert(`Nenhuma comanda paga ou pronta para imprimir na turma "${nomeTurma}".`);
      return;
    }
    setSelectedIds(daTurma.map(c => Number(c.id)));
    setTurmaImpressaoLote(nomeTurma);
    setModalImpressaoComandas(true);
  };

  // Contadores para badges e alertas
  const contadoresStatus = useMemo(() => {
    let pendentesConferencia = 0;
    let pagos = 0;
    let entregues = 0;
    let aguardando = 0;

    comandas.forEach(c => {
      const st = c.status || (c.ticketEntregue ? 'entregue' : 'pago');
      if (st === 'pendente_conferencia') pendentesConferencia++;
      else if (st === 'pago') pagos++;
      else if (st === 'entregue') entregues++;
      else if (st === 'aguardando_comprovante') aguardando++;
    });

    return { pendentesConferencia, pagos, entregues, aguardando };
  }, [comandas]);

  // Filtragem de comandas
  const comandasFiltradas = useMemo(() => {
    return comandas.filter((c) => {
      const codigoLimpo = (c.codigoPedido || `NL-${String(c.id).padStart(4, '0')}`).toLowerCase();
      const searchLimpo = busca.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

      const matchBusca =
        !busca.trim() ||
        codigoLimpo.replace(/[^a-z0-9]/g, '').includes(searchLimpo) ||
        (c.codigoPedido || '').toLowerCase().includes(busca.toLowerCase()) ||
        (c.estudante || '').toLowerCase().includes(busca.toLowerCase()) ||
        (c.responsavel || '').toLowerCase().includes(busca.toLowerCase()) ||
        (c.turma || '').toLowerCase().includes(busca.toLowerCase()) ||
        (c.telefone || '').includes(busca) ||
        (c.id || '').toString().includes(busca);

      if (!matchBusca) return false;

      if (filtroTurma !== 'todas' && (c.turma || '').trim() !== filtroTurma) {
        return false;
      }

      // Filtro de Status
      const st = c.status || (c.ticketEntregue ? 'entregue' : 'pago');
      if (filtroStatus !== 'todos') {
        if (filtroStatus !== st) return false;
      }

      if (filtroTicket === 'entregue') return c.ticketEntregue || st === 'entregue';
      if (filtroTicket === 'pendente') return !c.ticketEntregue && st !== 'entregue';
      return true;
    });
  }, [comandas, busca, filtroStatus, filtroTicket, filtroTurma]);

  // Gerenciamento de seleção para impressão
  const handleToggleSelectAll = () => {
    if (selectedIds.length === comandasFiltradas.length && comandasFiltradas.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(comandasFiltradas.map((c) => Number(c.id)));
    }
  };

  const handleToggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const comandasParaImpressao = useMemo(() => {
    const idSet = new Set(selectedIds);
    return comandas.filter((c) => idSet.has(Number(c.id)));
  }, [comandas, selectedIds]);

  const handleConfirmarImpressao = async (marcarEntregue: boolean) => {
    if (marcarEntregue && selectedIds.length > 0) {
      await api.updateMultipleNatalTickets(selectedIds, true);
      setComandas((prev) =>
        prev.map((c) => (selectedIds.includes(Number(c.id)) ? { ...c, ticketEntregue: true } : c))
      );
      api.getNatalResumo().then((res) => setResumoCozinha(res));
    }
  };

  // Cálculos consolidados para a aba Arrecadação (Contábil)
  const turmasCalculadas = useMemo(() => {
    const mapa: Record<string, { totalComandas: number; totalPix: number; totalDinheiro: number; total: number }> = {};
    let totalGeral = 0;

    for (const c of comandas) {
      const nomeTurma = (c.turma || '').trim() || 'Sem Turma Definida';
      const valor = parseFloat(c.total) || 0;
      totalGeral += valor;

      if (!mapa[nomeTurma]) {
        mapa[nomeTurma] = { totalComandas: 0, totalPix: 0, totalDinheiro: 0, total: 0 };
      }
      mapa[nomeTurma].totalComandas += 1;
      mapa[nomeTurma].total += valor;
      if (c.formaPagamento === 'dinheiro') {
        mapa[nomeTurma].totalDinheiro += valor;
      } else {
        mapa[nomeTurma].totalPix += valor;
      }
    }

    return Object.entries(mapa)
      .map(([turma, dados]) => ({
        turma,
        ...dados,
        porcentagem: totalGeral > 0 ? (dados.total / totalGeral) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [comandas]);

  const produtosCalculados = useMemo(() => {
    const mapa: Record<string, { nome: string; quantidade: number; valorUnitario: number; valorTotal: number }> = {};
    let totalGeral = 0;

    for (const c of comandas) {
      const itens = Array.isArray(c.itens) ? c.itens : [];
      for (const it of itens) {
        const nome = it.nome || 'Item';
        const qtd = parseInt(it.quantidade) || 0;
        const unit = parseFloat(it.valorUnitario) || 0;
        const sub = parseFloat(it.subtotal || it.total) || (qtd * unit);
        totalGeral += sub;

        if (!mapa[nome]) {
          mapa[nome] = { nome, quantidade: 0, valorUnitario: unit, valorTotal: 0 };
        }
        mapa[nome].quantidade += qtd;
        mapa[nome].valorTotal += sub;
        if (!mapa[nome].valorUnitario && unit > 0) {
          mapa[nome].valorUnitario = unit;
        }
      }
    }

    return Object.values(mapa)
      .map((p) => ({
        ...p,
        porcentagem: totalGeral > 0 ? (p.valorTotal / totalGeral) * 100 : 0
      }))
      .sort((a, b) => b.valorTotal - a.valorTotal);
  }, [comandas]);

  // Filtragem de comandas na aba Arrecadação
  const comandasArrecadacaoFiltradas = useMemo(() => {
    return comandas.filter((c) => {
      const matchBusca =
        !buscaArrecadacao.trim() ||
        (c.estudante || '').toLowerCase().includes(buscaArrecadacao.toLowerCase()) ||
        (c.turma || '').toLowerCase().includes(buscaArrecadacao.toLowerCase()) ||
        (c.responsavel || '').toLowerCase().includes(buscaArrecadacao.toLowerCase()) ||
        (c.id || '').toString().includes(buscaArrecadacao);

      if (!matchBusca) return false;

      if (filtroFormaArrecadacao !== 'todas' && c.formaPagamento !== filtroFormaArrecadacao) {
        return false;
      }

      if (filtroTurmaArrecadacao !== 'todas' && (c.turma || '').trim() !== filtroTurmaArrecadacao) {
        return false;
      }

      return true;
    });
  }, [comandas, buscaArrecadacao, filtroFormaArrecadacao, filtroTurmaArrecadacao]);

  // Exportação CSV do Contábil
  const handleExportarCsvContabil = () => {
    const headers = [
      'ID Comanda',
      'Data/Hora',
      'Estudante',
      'Turma',
      'Professor(a)',
      'Responsável',
      'Telefone',
      'Forma Pagamento',
      'Status Ticket',
      'Qtd Total Itens',
      'Itens Detalhados',
      'Valor Total (R$)'
    ];

    const rows = comandas.map((c) => {
      const itens = Array.isArray(c.itens) ? c.itens : [];
      const itensTexto = itens.map((it: any) => `${it.quantidade}x ${it.nome}`).join(' | ');
      const qtdTotal = itens.reduce((acc: number, it: any) => acc + (parseInt(it.quantidade) || 0), 0);
      const totalNum = (parseFloat(c.total) || 0).toFixed(2).replace('.', ',');
      const dataStr = c.criadaEm ? new Date(c.criadaEm).toLocaleString('pt-BR') : '';

      return [
        `#${c.id}`,
        `"${dataStr}"`,
        `"${(c.estudante || '').replace(/"/g, '""')}"`,
        `"${(c.turma || '').replace(/"/g, '""')}"`,
        `"${(c.professor || '').replace(/"/g, '""')}"`,
        `"${(c.responsavel || '').replace(/"/g, '""')}"`,
        `"${(c.telefone || '').replace(/"/g, '""')}"`,
        `"${(c.formaPagamento || '').toUpperCase()}"`,
        `"${c.ticketEntregue ? 'ENTREGUE' : 'PENDENTE'}"`,
        qtdTotal,
        `"${itensTexto.replace(/"/g, '""')}"`,
        `"${totalNum}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_contabil_natal_luz_cepr_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

              {/* Botão para copiar texto pronto com link de WhatsApp para enviar nos grupos de pais */}
              <button
                onClick={handleCopiarTextoPais}
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg active:scale-95"
                title="Copiar texto pronto com link para enviar nos grupos de pais do WhatsApp"
              >
                {copiadoTextoPais ? <Check className="w-3.5 h-3.5 text-emerald-900" /> : <MessageCircle className="w-3.5 h-3.5" />}
                <span>{copiadoTextoPais ? 'Mensagem Copiada!' : '📱 Link p/ Grupo de Pais WhatsApp'}</span>
              </button>

              {/* Link para testar a página pública dos pais */}
              <a
                href={`${window.location.origin}${window.location.pathname}?tab=pedido-natal`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-600 text-xs font-semibold transition"
                title="Abrir a tela pública que os pais verão no celular"
              >
                <ExternalLink className="w-3 h-3 text-amber-400" />
                <span>Ver Tela dos Pais</span>
              </a>

              {contadoresStatus.pendentesConferencia > 0 && (
                <button
                  onClick={() => {
                    setActiveSubTab('comandas');
                    setFiltroStatus('pendente_conferencia');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500 hover:bg-blue-400 text-white text-xs font-black transition cursor-pointer shadow-lg animate-pulse"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{contadoresStatus.pendentesConferencia} comprovante(s) p/ conferir</span>
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
              <span>✨ NATAL LUZ 🎅</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/90 font-medium mt-0.5">
              Ficha de Encomenda & Comanda Digital • Otimizado para Celular
            </p>
          </div>

          {/* Navegação entre Abas */}
          <div className="flex flex-wrap bg-slate-950/60 p-1 rounded-2xl border border-white/10 backdrop-blur-md w-full sm:w-auto gap-1">
            <button
              onClick={() => setActiveSubTab('nova')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
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
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
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
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                activeSubTab === 'cozinha'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Cozinha</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('arrecadacao');
                carregarDados();
              }}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                activeSubTab === 'arrecadacao'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Arrecadação</span>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Campo de Busca Rápida (com suporte a Código #NL-0042) */}
                <div className="relative md:col-span-2">
                  <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="🔎 Buscar por Código (#NL-0042 ou 42), Aluno, Responsável ou Turma..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                  />
                  {busca && (
                    <button
                      onClick={() => setBusca('')}
                      className="absolute right-3 top-3 text-xs text-slate-400 hover:text-white"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Filtro por Turma */}
                <div className="relative">
                  <select
                    value={filtroTurma}
                    onChange={(e) => setFiltroTurma(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold cursor-pointer"
                  >
                    <option value="todas">🏫 Todas as Turmas ({turmasDisponiveis.length})</option>
                    {turmasDisponiveis.map((t) => (
                      <option key={t} value={t}>
                        Turma: {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filtros por Status do Pedido / Conferência */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold pb-1">
                  <button
                    onClick={() => setFiltroStatus('todos')}
                    className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                      filtroStatus === 'todos'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Todas ({comandas.length})
                  </button>

                  <button
                    onClick={() => setFiltroStatus('pendente_conferencia')}
                    className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                      filtroStatus === 'pendente_conferencia'
                        ? 'bg-blue-600 text-white font-black ring-2 ring-blue-400'
                        : 'bg-blue-950/60 text-blue-300 border border-blue-800/40 hover:bg-blue-900/60'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-300" />
                    <span>🔵 Pendentes Conferência ({contadoresStatus.pendentesConferencia})</span>
                  </button>

                  <button
                    onClick={() => setFiltroStatus('pago')}
                    className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                      filtroStatus === 'pago'
                        ? 'bg-emerald-600 text-white font-black'
                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/60'
                    }`}
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                    <span>🟢 Pagos / Pronto Imprimir ({contadoresStatus.pagos})</span>
                  </button>

                  <button
                    onClick={() => setFiltroStatus('entregue')}
                    className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                      filtroStatus === 'entregue'
                        ? 'bg-slate-600 text-white font-black'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>⚪ Entregues ({contadoresStatus.entregues})</span>
                  </button>

                  <button
                    onClick={() => setFiltroStatus('aguardando_comprovante')}
                    className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                      filtroStatus === 'aguardando_comprovante'
                        ? 'bg-amber-700 text-white font-black'
                        : 'bg-amber-950/40 text-amber-300 border border-amber-900/40 hover:bg-amber-900/40'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>🟡 Aguardando Comprovante ({contadoresStatus.aguardando})</span>
                  </button>
                </div>

                <span className="text-xs text-slate-400">
                  Exibindo <strong>{comandasFiltradas.length}</strong> pedido(s)
                </span>
              </div>
            </div>

            {/* Barra de Ação em Lote: Seleção e Impressão (Lei de Fitts & Von Restorff) */}
            <div className="bg-slate-800/90 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 transition select-none cursor-pointer"
                >
                  {selectedIds.length > 0 && selectedIds.length === comandasFiltradas.length ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {selectedIds.length === comandasFiltradas.length && comandasFiltradas.length > 0
                      ? 'Desmarcar Todas'
                      : `Selecionar Filtradas (${comandasFiltradas.length})`}
                  </span>
                </button>

                {/* Botão de Atalho: Imprimir Lote da Turma Selecionada */}
                {filtroTurma !== 'todas' && (
                  <button
                    type="button"
                    onClick={() => handleImprimirLoteTurma(filtroTurma)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Lote: {filtroTurma} + Folha de Entrega</span>
                  </button>
                )}

                {selectedIds.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
                    {selectedIds.length} selecionada(s)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700 transition"
                  >
                    Limpar
                  </button>
                )}

                <button
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => {
                    setTurmaImpressaoLote(filtroTurma);
                    setModalImpressaoComandas(true);
                  }}
                  className={`w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-2 transition shadow-xl active:scale-95 cursor-pointer ${
                    selectedIds.length === 0
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white shadow-emerald-950 border border-emerald-400/50'
                  }`}
                  title="Gerar impressão das comandas selecionadas"
                >
                  <Printer className="w-4 h-4" />
                  <span>
                    {selectedIds.length === 0
                      ? 'Selecione Comandas para Imprimir'
                      : `Imprimir Selecionadas (${selectedIds.length})`}
                  </span>
                </button>
              </div>
            </div>

            {/* Listagem de Comandas */}
            {comandasFiltradas.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400">
                <Receipt className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-sm">Nenhuma comanda encontrada.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Ajuste os filtros de busca ou cadastre um pedido na aba "Nova Ficha".
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {comandasFiltradas.map((cmd) => {
                  const itensArr = Array.isArray(cmd.itens) ? cmd.itens : [];
                  const totalNum = parseFloat(cmd.total) || 0;
                  const isSelected = selectedIds.includes(Number(cmd.id));
                  const codigoExibicao = cmd.codigoPedido || `NL-${String(cmd.id).padStart(4, '0')}`;
                  const statusAtual = cmd.status || (cmd.ticketEntregue ? 'entregue' : 'pago');

                  return (
                    <div
                      key={cmd.id}
                      className={`bg-slate-800/90 border rounded-2xl p-4 shadow-md space-y-3 transition ${
                        statusAtual === 'pendente_conferencia'
                          ? 'border-blue-500/80 ring-2 ring-blue-500/20 bg-slate-800'
                          : isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-slate-800/95'
                          : 'border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      {/* Topo do Card com Checkbox de Seleção e Código do Pedido */}
                      <div className="flex items-start justify-between gap-3 border-b border-slate-700/60 pb-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(Number(cmd.id))}
                            className="mt-1 w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-600 cursor-pointer"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Código de Rastreio do Pix / Pedido */}
                              <span className="font-mono font-black text-amber-300 text-sm px-2.5 py-0.5 rounded-lg bg-amber-400/15 border border-amber-400/40">
                                {codigoExibicao}
                              </span>
                              <span className="text-xs text-slate-400">
                                {cmd.criadaEm ? new Date(cmd.criadaEm).toLocaleString('pt-BR') : ''}
                              </span>
                            </div>
                            <h3 className="font-bold text-white text-base mt-1">
                              {cmd.estudante}
                            </h3>
                            <p className="text-xs text-slate-300 mt-0.5">
                              {cmd.turma && <span className="font-semibold text-amber-400">Turma: {cmd.turma} • </span>}
                              Resp: <strong>{cmd.responsavel}</strong> ({cmd.telefone})
                            </p>
                          </div>
                        </div>

                        {/* Badges de Status do Fluxo */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {statusAtual === 'pendente_conferencia' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-950 text-blue-300 border border-blue-500/60 flex items-center gap-1 animate-pulse">
                              <Eye className="w-3 h-3 text-blue-400" />
                              <span>Pendente Conferência</span>
                            </span>
                          )}

                          {statusAtual === 'pago' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-500/60 flex items-center gap-1">
                              <CheckCheck className="w-3 h-3 text-emerald-400" />
                              <span>Pago / Pronto p/ Imprimir</span>
                            </span>
                          )}

                          {statusAtual === 'entregue' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-800 text-slate-300 border border-slate-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-slate-400" />
                              <span>Entregue ao Aluno</span>
                            </span>
                          )}

                          {statusAtual === 'aguardando_comprovante' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-950 text-amber-300 border border-amber-500/60 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Aguardando Comprovante</span>
                            </span>
                          )}

                          {statusAtual === 'recusado' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-950 text-rose-300 border border-rose-500/60 flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>Recusado</span>
                            </span>
                          )}

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
                              R$ {(parseFloat(it.subtotal || it.total) || 0).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                        <div className="border-t border-slate-700/60 pt-1.5 mt-1.5 flex justify-between font-black text-sm text-amber-400">
                          <span>Total</span>
                          <span>R$ {totalNum.toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>

                      {/* Motivo de recusa se houver */}
                      {cmd.motivoRecusa && (
                        <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-900/60 rounded-lg p-2">
                          ⚠️ <strong>Motivo da recusa:</strong> {cmd.motivoRecusa}
                        </p>
                      )}

                      {/* Botões de Ação Rápida e Conferência */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-700/50">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Visualizar Comprovante se houver */}
                          {cmd.comprovante ? (
                            <button
                              type="button"
                              onClick={() => {
                                setModalComprovante(cmd);
                                setMostrarRecusaField(false);
                                setMotivoRecusaInput('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-400" />
                              <span>Ver Comprovante Anexado</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">
                              Sem comprovante anexado
                            </span>
                          )}

                          {/* Botão de 1 Clique: Aprovar Pagamento se estiver pendente */}
                          {statusAtual === 'pendente_conferencia' && (
                            <button
                              type="button"
                              onClick={() => handleAprovarComanda(Number(cmd.id))}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer active:scale-95"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Aprovar Pagamento (1 Clique)</span>
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Botão de Alternar Ticket Entregue */}
                          <button
                            type="button"
                            onClick={() => handleToggleTicket(cmd)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                              cmd.ticketEntregue || statusAtual === 'entregue'
                                ? 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                                : 'bg-slate-700 text-emerald-300 hover:bg-slate-600 border border-emerald-500/40'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{cmd.ticketEntregue || statusAtual === 'entregue' ? 'Desmarcar Entrega' : 'Marcar Entregue'}</span>
                          </button>

                          {/* Imprimir Comanda Individual */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedIds([Number(cmd.id)]);
                              setTurmaImpressaoLote(cmd.turma || 'todas');
                              setModalImpressaoComandas(true);
                            }}
                            className="p-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold transition flex items-center gap-1"
                            title="Imprimir esta comanda"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Imprimir</span>
                          </button>

                          {/* Reenviar WhatsApp */}
                          <button
                            type="button"
                            onClick={() => {
                              const texto = gerarTextoWhatsApp(cmd.id, cmd.pixPayload);
                              handleAbrirWhatsApp(cmd.telefone, texto);
                            }}
                            className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 text-xs font-bold transition flex items-center gap-1"
                            title="Reenviar resumo pelo WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {/* Excluir comanda */}
                          <button
                            type="button"
                            onClick={() => handleExcluirComanda(Number(cmd.id))}
                            className="p-2 rounded-xl text-rose-400 hover:text-white hover:bg-rose-950/50 border border-transparent hover:border-rose-800 transition"
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
        {/* ABA 3: COZINHA (EXCLUSIVO CONTROLE DE PRODUÇÃO)               */}
        {/* ============================================================== */}
        {activeSubTab === 'cozinha' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Cabeçalho da Cozinha */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Utensils className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base sm:text-lg text-white tracking-wide">
                    Demanda de Produção da Cozinha
                  </h2>
                  <p className="text-xs text-slate-400">
                    Controle operacional exclusivo das quantidades totais de comidas e bebidas a preparar
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={carregarDados}
                  className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                  title="Atualizar dados de produção"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>

            {/* Card de Resumo de Produção */}
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-800/80 to-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-md flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                  Volume Total de Produção
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white mt-0.5 block">
                  {PRODUTOS_INICIAIS.reduce((acc, prod) => {
                    const achado = (resumoCozinha?.produtos || []).find(
                      (p: any) => p.nome.toLowerCase() === prod.nome.toLowerCase()
                    );
                    return acc + (achado?.quantidade || 0);
                  }, 0)}{' '}
                  <span className="text-sm font-semibold text-amber-300">porções / itens no total</span>
                </span>
              </div>
              <span className="text-3xl sm:text-4xl">👨‍🍳</span>
            </div>

            {/* Cards de Preparo da Cozinha (Sem Valores Financeiros) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PRODUTOS_INICIAIS.map((prod) => {
                const achado = (resumoCozinha?.produtos || []).find(
                  (p: any) => p.nome.toLowerCase() === prod.nome.toLowerCase()
                );
                const qtdTotal = achado?.quantidade || 0;

                return (
                  <div
                    key={prod.id}
                    className="p-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-md flex items-center justify-between gap-3 hover:border-amber-500/50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-700/60">
                        {prod.icone}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-white text-base">
                          {prod.nome}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Item do cardápio festivo
                        </span>
                      </div>
                    </div>

                    <div className="text-right bg-slate-900/80 border border-slate-700/60 px-3.5 py-2 rounded-xl">
                      <span className="text-2xl font-black text-amber-400 block font-mono">
                        {qtdTotal}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        unidades
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 4: ARRECADAÇÃO (PAINEL CONTÁBIL COMPLETO)                  */}
        {/* ============================================================== */}
        {activeSubTab === 'arrecadacao' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Topo com Ações Contábeis */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base sm:text-lg text-white tracking-wide">
                    Painel de Arrecadação & Contábil
                  </h2>
                  <p className="text-xs text-slate-400">
                    Prestação de contas, balancete consolidado e arrecadação por turma e produto
                  </p>
                </div>
              </div>

              {/* Botões de Ação do Contábil */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleExportarCsvContabil}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold transition flex items-center justify-center gap-2 shadow-md active:scale-95"
                  title="Baixar planilha completa das vendas em formato CSV para Excel"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Exportar CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalBalancete(true)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950 active:scale-95 cursor-pointer"
                  title="Abrir demonstrativo contábil oficial para impressão ou PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Balancete</span>
                </button>
              </div>
            </div>

            {/* Cards de Métricas Financeiras Consolidadas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Faturamento Total
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 mt-1 block font-mono">
                  R$ {(resumoCozinha?.faturamentoTotal || 0).toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {comandas.length} comanda(s) emitida(s)
                </span>
              </div>

              <div className="bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Total em PIX
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-300 mt-1 block font-mono">
                  R$ {(resumoCozinha?.totalPix || 0).toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-emerald-400/80 font-medium">
                  Conta Escolar (
                  {(resumoCozinha?.faturamentoTotal || 0) > 0
                    ? (((resumoCozinha?.totalPix || 0) / resumoCozinha.faturamentoTotal) * 100).toFixed(1)
                    : '0'}
                  %)
                </span>
              </div>

              <div className="bg-slate-800/80 border border-amber-500/30 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Total em Dinheiro
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-300 mt-1 block font-mono">
                  R$ {(resumoCozinha?.totalDinheiro || 0).toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-amber-400/80 font-medium">
                  Caixa Físico (
                  {(resumoCozinha?.faturamentoTotal || 0) > 0
                    ? (((resumoCozinha?.totalDinheiro || 0) / resumoCozinha.faturamentoTotal) * 100).toFixed(1)
                    : '0'}
                  %)
                </span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ticket Médio
                </span>
                <span className="text-xl sm:text-2xl font-black text-white mt-1 block font-mono">
                  R${' '}
                  {comandas.length > 0
                    ? ((resumoCozinha?.faturamentoTotal || 0) / comandas.length).toFixed(2).replace('.', ',')
                    : '0,00'}
                </span>
                <span className="text-[10px] text-slate-400">Por pedido emitido</span>
              </div>
            </div>

            {/* SEÇÃO 1: Arrecadação Consolidada por Turma */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    1. Arrecadação Consolidada por Turma
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  {turmasCalculadas.length} turma(s) com pedidos
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-left bg-slate-900/60">
                      <th className="py-2 px-3 font-bold rounded-l-lg">Turma</th>
                      <th className="py-2 px-3 font-bold text-center">Nº Comandas</th>
                      <th className="py-2 px-3 font-bold text-right">Dinheiro</th>
                      <th className="py-2 px-3 font-bold text-right">Pix</th>
                      <th className="py-2 px-3 font-bold text-right">Total Arrecadado</th>
                      <th className="py-2 px-3 font-bold text-right rounded-r-lg">% do Faturamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {turmasCalculadas.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-700/30 transition">
                        <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 text-[10px] flex items-center justify-center font-mono">
                            {i + 1}
                          </span>
                          <span>{t.turma}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-300 font-semibold">
                          {t.totalComandas}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-300 font-mono">
                          R$ {t.totalDinheiro.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-300 font-mono">
                          R$ {t.totalPix.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-amber-400 font-mono text-sm">
                          R$ {t.total.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300 font-semibold">
                          {t.porcentagem.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO 2: Vendas e Arrecadação por Produto */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    2. Desempenho de Vendas por Produto
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  {produtosCalculados.length} item(ns)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-left bg-slate-900/60">
                      <th className="py-2 px-3 font-bold rounded-l-lg">Produto</th>
                      <th className="py-2 px-3 font-bold text-center">Qtd Vendida</th>
                      <th className="py-2 px-3 font-bold text-right">Valor Unitário</th>
                      <th className="py-2 px-3 font-bold text-right">Total Apurado</th>
                      <th className="py-2 px-3 font-bold text-right rounded-r-lg">% da Receita</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {produtosCalculados.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-700/30 transition">
                        <td className="py-2.5 px-3 font-bold text-white">{p.nome}</td>
                        <td className="py-2.5 px-3 text-center text-slate-300 font-bold">
                          {p.quantidade} un
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400 font-mono">
                          R$ {p.valorUnitario.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-amber-400 font-mono text-sm">
                          R$ {p.valorTotal.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300 font-semibold">
                          {p.porcentagem.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO 3: Extrato Analítico de Pedidos */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    3. Extrato Analítico de Comandas
                  </h3>
                  <p className="text-xs text-slate-400">
                    Conferência contábil item a item de todos os pedidos registrados
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <select
                    value={filtroFormaArrecadacao}
                    onChange={(e: any) => setFiltroFormaArrecadacao(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="todas">Forma: Todas</option>
                    <option value="pix">Apenas PIX</option>
                    <option value="dinheiro">Apenas Dinheiro</option>
                  </select>

                  <select
                    value={filtroTurmaArrecadacao}
                    onChange={(e) => setFiltroTurmaArrecadacao(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="todas">Turma: Todas</option>
                    {turmasDisponiveis.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-900">
                    <tr className="border-b border-slate-700 text-slate-400 text-left">
                      <th className="py-2 px-2 font-bold">Nº</th>
                      <th className="py-2 px-2 font-bold">Data</th>
                      <th className="py-2 px-2 font-bold">Estudante</th>
                      <th className="py-2 px-2 font-bold">Turma</th>
                      <th className="py-2 px-2 font-bold">Responsável</th>
                      <th className="py-2 px-2 font-bold text-center">Forma</th>
                      <th className="py-2 px-2 font-bold text-right">Total (R$)</th>
                      <th className="py-2 px-2 font-bold text-center">Ticket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {comandasArrecadacaoFiltradas.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-700/30 transition">
                        <td className="py-2 px-2 font-mono font-bold text-slate-300">
                          #{c.id.toString().padStart(5, '0')}
                        </td>
                        <td className="py-2 px-2 text-slate-400">
                          {c.criadaEm ? new Date(c.criadaEm).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="py-2 px-2 font-bold text-white">{c.estudante}</td>
                        <td className="py-2 px-2 text-slate-300">{c.turma || '-'}</td>
                        <td className="py-2 px-2 text-slate-400">{c.responsavel}</td>
                        <td className="py-2 px-2 text-center uppercase font-bold text-[10px]">
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              c.formaPagamento === 'pix'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {c.formaPagamento}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-amber-400 font-mono">
                          R$ {(parseFloat(c.total) || 0).toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              c.ticketEntregue
                                ? 'bg-emerald-900/60 text-emerald-300'
                                : 'bg-amber-900/60 text-amber-300'
                            }`}
                          >
                            {c.ticketEntregue ? 'Entregue' : 'Pendente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL DE IMPRESSÃO DAS COMANDAS (4 POR FOLHA A4)               */}
      {/* ============================================================== */}
      {modalImpressaoComandas && (
        <ComandasPrintModal
          comandas={comandasParaImpressao}
          turmaFiltro={turmaImpressaoLote}
          onClose={() => setModalImpressaoComandas(false)}
          onConfirmPrint={handleConfirmarImpressao}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL DE CONFERÊNCIA DE COMPROVANTE (LIGHTBOX 1-CLIQUE)        */}
      {/* ============================================================== */}
      {modalComprovante && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-6 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between border-b border-slate-700 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Conferência de Comprovante de Pagamento
                </span>
                <h2 className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
                  <span>Pedido {modalComprovante.codigoPedido || `#${modalComprovante.id}`}</span>
                  <span className="text-xs font-mono bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/40">
                    TXID: {formatCodigoPixTxid(modalComprovante.codigoPedido || `NL${modalComprovante.id}`)}
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Aluno: <strong className="text-white">{modalComprovante.estudante}</strong> • Turma: <strong className="text-amber-400">{modalComprovante.turma || 'Sem turma'}</strong> • Total: <strong className="text-emerald-400 text-sm">R$ {(parseFloat(modalComprovante.total) || 0).toFixed(2).replace('.', ',')}</strong>
                </p>
              </div>
              <button
                onClick={() => setModalComprovante(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
              >
                ✕
              </button>
            </div>

            {/* Imagem do Comprovante */}
            <div className="bg-slate-950 rounded-2xl p-2 border border-slate-800 max-h-[55vh] overflow-auto flex items-center justify-center">
              {modalComprovante.comprovante ? (
                modalComprovante.comprovante.startsWith('data:image') || modalComprovante.comprovante.startsWith('http') ? (
                  <img
                    src={modalComprovante.comprovante}
                    alt="Comprovante de pagamento"
                    className="max-h-[50vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
                  />
                ) : (
                  <iframe
                    src={modalComprovante.comprovante}
                    title="Documento de comprovante"
                    className="w-full h-[50vh] rounded-xl border-none"
                  />
                )
              ) : (
                <p className="text-xs text-slate-500 py-8">Nenhum anexo disponível.</p>
              )}
            </div>

            {/* Campo Opcional de Recusa */}
            {mostrarRecusaField && (
              <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-3.5 space-y-2 animate-in fade-in">
                <label className="text-xs font-bold text-rose-300 block">
                  Motivo da Recusa (visível para o responsável):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Valor incorreto, comprovante ilegível, comprovante de agendamento..."
                  value={motivoRecusaInput}
                  onChange={(e) => setMotivoRecusaInput(e.target.value)}
                  className="w-full bg-slate-900 border border-rose-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                  autoFocus
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setMostrarRecusaField(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRecusarComanda(modalComprovante.id)}
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
                  >
                    Confirmar Recusa
                  </button>
                </div>
              </div>
            )}

            {/* Ações de Conferência em 1 Clique */}
            {!mostrarRecusaField && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarRecusaField(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 hover:text-rose-100 border border-rose-900/60 text-xs font-bold transition cursor-pointer"
                >
                  ⚠️ Recusar Comprovante
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalComprovante(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                  >
                    Fechar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAprovarComanda(modalComprovante.id)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white text-xs font-black tracking-wide flex items-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer active:scale-95"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Aprovar Pagamento (1 Clique)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL DE IMPRESSÃO DO BALANCETE CONTÁBIL                       */}
      {/* ============================================================== */}
      {modalBalancete && (
        <BalancetePrintModal
          resumo={resumoCozinha}
          comandas={comandas}
          turmasCalculadas={turmasCalculadas}
          produtosCalculados={produtosCalculados}
          onClose={() => setModalBalancete(false)}
        />
      )}

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

            {/* Ações Principais: Disparo WhatsApp */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleAbrirWhatsApp(modalSucesso.telefone, modalSucesso.textoWhats)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950 active:scale-98 transition"
              >
                <Send className="w-5 h-5" />
                <span>
                  {modalSucesso.formaPagamento === 'pix'
                    ? '1. Enviar Resumo da Comanda no WhatsApp'
                    : 'Abrir WhatsApp do Responsável'}
                </span>
              </button>

              {modalSucesso.formaPagamento === 'pix' && modalSucesso.pixPayload && (
                <button
                  type="button"
                  onClick={() => handleAbrirWhatsApp(modalSucesso.telefone, modalSucesso.pixPayload)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-xl shadow-teal-950 border border-teal-400/40 active:scale-98 transition"
                  title="Envia apenas o código Pix Copia e Cola isolado em mensagem separada para facilitar cópia"
                >
                  <QrCode className="w-5 h-5 text-amber-300" />
                  <span>2. Enviar Código Pix (Mensagem Separada)</span>
                </button>
              )}
            </div>

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
