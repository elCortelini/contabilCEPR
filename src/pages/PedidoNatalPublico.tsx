import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  QrCode, 
  Plus, 
  Minus, 
  Receipt, 
  Phone, 
  User, 
  GraduationCap, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  Upload, 
  MessageCircle, 
  Clock, 
  ShoppingBag, 
  ExternalLink,
  ClipboardCheck,
  Camera,
  X,
  Info
} from 'lucide-react';
import { 
  generatePixPayload, 
  getPixQrCodeUrl, 
  CHAVE_PIX_CEPR, 
  NOME_RECEBEDOR_PIX, 
  CIDADE_PIX, 
  WHATSAPP_APP,
  WHATSAPP_APP_RAW,
  formatCodigoPixTxid
} from '../utils/pix';
import { api } from '../services/api';
import { TURMAS_OFICIAIS, ALUNOS_POR_TURMA } from '../data/turmasAlunosOficiais';

// Cardápio oficial do Natal Luz CEPR
const PRODUTOS = [
  { id: 'hotdog', nome: 'Cachorro-quente', valorUnitario: 10.00, icone: '🌭', desc: 'Molho artesanal e batata palha' },
  { id: 'pastel', nome: 'Pastel', valorUnitario: 10.00, icone: '🥟', desc: 'Frito na hora, crocante' },
  { id: 'refri', nome: 'Refrigerante', valorUnitario: 7.00, icone: '🥤', desc: 'Lata 350ml gelada' },
  { id: 'agua', nome: 'Água mineral', valorUnitario: 5.00, icone: '💧', desc: 'Garrafa 500ml' },
  { id: 'pipoca_doce', nome: 'Pipoca doce', valorUnitario: 7.00, icone: '🍿', desc: 'Caramelizada e crocante' },
  { id: 'pipoca_salgada', nome: 'Pipoca salgada', valorUnitario: 5.00, icone: '🍿', desc: 'Tradicional quentinha' },
  { id: 'bolo', nome: 'Bolo caseiro', valorUnitario: 8.00, icone: '🍰', desc: 'Fatia caprichada' },
];

interface Turma {
  id: number;
  nome: string;
  codigo?: string;
  anoLetivo?: string;
  turno?: string;
}

interface Aluno {
  id: number;
  nome: string;
  responsavel?: string;
  contato?: string;
}

export const PedidoNatalPublico: React.FC = () => {
  // Passos: 1 = Dados do Aluno | 2 = Cardápio | 3 = Pix & Comprovante | 4 = Sucesso/Acompanhamento
  const [passo, setPasso] = useState<1 | 2 | 3 | 4>(1);

  // Turmas e Alunos inicializados instantaneamente a partir do acervo oficial embutido
  const [turmas, setTurmas] = useState<Turma[]>(() => {
    return TURMAS_OFICIAIS.map((t, idx) => ({
      id: idx + 1,
      nome: t.nome,
      codigo: t.codigo,
      anoLetivo: t.ano,
      turno: t.turno
    }));
  });
  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('');
  
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState<string>('');
  const [nomeAlunoCustom, setNomeAlunoCustom] = useState<string>('');
  const [isAlunoManual, setIsAlunoManual] = useState(false);

  // Dados do Responsável
  const [responsavel, setResponsavel] = useState('');
  const [telefone, setTelefone] = useState('');

  // Carrinho de Itens
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});

  // Estado do Pedido Criado
  const [pedidoCriado, setPedidoCriado] = useState<{
    id: number;
    codigoPedido: string;
    total: number;
    status: string;
    pixPayload: string;
  } | null>(null);

  const [loadingPedido, setLoadingPedido] = useState(false);
  const [copiadoPix, setCopiadoPix] = useState(false);

  // Comprovante
  const [comprovanteBase64, setComprovanteBase64] = useState<string | null>(null);
  const [enviandoComprovante, setEnviandoComprovante] = useState(false);
  const [comprovanteEnviadoSucesso, setComprovanteEnviadoSucesso] = useState(false);

  // Recuperar pedido anterior salvo no celular
  useEffect(() => {
    try {
      const salvo = localStorage.getItem('cepr_natal_ultimo_pedido');
      if (salvo) {
        const dados = JSON.parse(salvo);
        if (dados && (dados.id || dados.codigoPedido)) {
          api.getNatalPedido(dados.id || dados.codigoPedido)
            .then(atualizado => {
              if (atualizado && (atualizado.id || atualizado.codigoPedido)) {
                setPedidoCriado({
                  id: atualizado.id,
                  codigoPedido: atualizado.codigoPedido || dados.codigoPedido,
                  total: atualizado.total,
                  status: atualizado.status,
                  pixPayload: atualizado.pixPayload || dados.pixPayload || ''
                });
                if (atualizado.status === 'pendente_conferencia' || atualizado.status === 'pago' || atualizado.status === 'entregue') {
                  setComprovanteEnviadoSucesso(true);
                  setPasso(4);
                } else if (atualizado.status === 'aguardando_comprovante') {
                  setPasso(3);
                }
              }
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Quando o pai escolhe a Turma, carrega instantaneamente os alunos oficiais da turma
  useEffect(() => {
    if (!turmaSelecionada) {
      setAlunos([]);
      setAlunoSelecionadoId('');
      return;
    }

    setAlunoSelecionadoId('');
    setNomeAlunoCustom('');
    setIsAlunoManual(false);

    // Mapeamento direto via acervo oficial
    const turmaObj = TURMAS_OFICIAIS.find(t => t.nome === turmaSelecionada || t.codigo === turmaSelecionada);
    const codigo = turmaObj ? turmaObj.codigo : turmaSelecionada;
    const listaAlunosLocal = ALUNOS_POR_TURMA[codigo] || [];

    if (listaAlunosLocal.length > 0) {
      setAlunos(listaAlunosLocal.map(a => ({
        id: a.id,
        nome: a.nome,
        responsavel: a.responsavel
      })));
      setLoadingAlunos(false);
    } else {
      // Fallback para api se disponível
      setLoadingAlunos(true);
      fetch(`/api/public/turmas/${encodeURIComponent(turmaSelecionada)}/alunos`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setAlunos(data);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingAlunos(false));
    }
  }, [turmaSelecionada]);

  // Ao selecionar um aluno da lista, preencher responsável/contato se disponível
  const handleSelecionarAluno = (alunoId: string) => {
    setAlunoSelecionadoId(alunoId);
    if (alunoId === 'outro') {
      setIsAlunoManual(true);
      setNomeAlunoCustom('');
    } else {
      setIsAlunoManual(false);
      const aluno = alunos.find(a => String(a.id) === alunoId);
      if (aluno) {
        setNomeAlunoCustom(aluno.nome);
        if (aluno.responsavel && !responsavel) {
          setResponsavel(aluno.responsavel);
        }
        if (aluno.contato && !telefone) {
          setTelefone(aluno.contato);
        }
      }
    }
  };

  // Funções do carrinho
  const updateQuantidade = (produtoId: string, delta: number) => {
    setCarrinho(prev => {
      const atual = prev[produtoId] || 0;
      const novo = Math.max(0, atual + delta);
      if (novo === 0) {
        const copy = { ...prev };
        delete copy[produtoId];
        return copy;
      }
      return { ...prev, [produtoId]: novo };
    });
  };

  const totalCarrinho = useMemo(() => {
    return PRODUTOS.reduce((acc, p) => acc + (carrinho[p.id] || 0) * p.valorUnitario, 0);
  }, [carrinho]);

  const totalItensQtd = useMemo(() => {
    return Object.values(carrinho).reduce((acc, q) => acc + q, 0);
  }, [carrinho]);

  const nomeAlunoFinal = isAlunoManual ? nomeAlunoCustom.trim() : (alunos.find(a => String(a.id) === alunoAlunoIdOrCustom())?.nome || nomeAlunoCustom);

  function alunoAlunoIdOrCustom() {
    return alunoSelecionadoId;
  }

  // Validação do Passo 1
  const podeAvancarPasso1 = turmaSelecionada && 
    (isAlunoManual ? nomeAlunoCustom.trim().length >= 3 : alunoSelecionadoId) && 
    responsavel.trim().length >= 3 && 
    telefone.trim().length >= 8;

  // Validação do Passo 2
  const podeAvancarPasso2 = totalCarrinho > 0;

  // Criar Pedido e Gerar Pix
  const handleGerarPix = async () => {
    if (!podeAvancarPasso2 || loadingPedido) return;

    setLoadingPedido(true);

    try {
      const itensComanda = Object.entries(carrinho).map(([id, qtd]) => {
        const prod = PRODUTOS.find(p => p.id === id)!;
        return {
          id: prod.id,
          nome: prod.nome,
          quantidade: qtd,
          valorUnitario: prod.valorUnitario,
          total: qtd * prod.valorUnitario
        };
      });

      // 1. Criar pedido e código único via API escolar (com sincronização em nuvem e fallback local)
      const novoId = Date.now();
      const novoCodigo = `NL-${String(novoId).slice(-4)}`;
      const txidBacen = formatCodigoPixTxid(novoCodigo);

      // 2. Gerar Pix Copia e Cola Oficial com o Código do Pedido no TXID
      const pixPayload = generatePixPayload({
        key: CHAVE_PIX_CEPR,
        name: NOME_RECEBEDOR_PIX,
        city: CIDADE_PIX,
        amount: totalCarrinho,
        txid: txidBacen,
        description: `CEPR NATAL ${novoCodigo}`
      });

      const res = await api.createNatalComanda({
        id: novoId,
        codigoPedido: novoCodigo,
        estudante: nomeAlunoFinal,
        turma: turmaSelecionada,
        responsavel: responsavel.trim(),
        telefone: telefone.trim(),
        itens: itensComanda,
        total: totalCarrinho,
        formaPagamento: 'pix',
        pixPayload,
        status: 'aguardando_comprovante'
      });

      const pedidoId = res?.id || novoId;
      const codigoPedido = res?.codigoPedido || novoCodigo;

      const pedidoInfo = {
        id: pedidoId,
        codigoPedido,
        total: totalCarrinho,
        status: 'aguardando_comprovante',
        pixPayload
      };

      setPedidoCriado(pedidoInfo);

      // Salvar no localStorage para que o pai não perca ao trocar de app
      localStorage.setItem('cepr_natal_ultimo_pedido', JSON.stringify(pedidoInfo));

      setPasso(3);
    } catch (error: any) {
      console.error('Erro ao gerar pedido:', error);
      alert('Falha na comunicação com o servidor escolar. Verifique sua conexão.');
    } finally {
      setLoadingPedido(false);
    }
  };

  // Copiar código Pix
  const handleCopiarPix = () => {
    if (!pedidoCriado?.pixPayload) return;
    navigator.clipboard.writeText(pedidoCriado.pixPayload);
    setCopiadoPix(true);
    setTimeout(() => setCopiadoPix(false), 3000);
  };

  // Processar e comprimir blob de imagem via Canvas para ~150KB
  const processImageBlob = (blob: Blob) => {
    if (blob.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.75);
            setComprovanteBase64(compressed);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(blob);
    } else {
      // Outro formato (ex: PDF)
      const reader = new FileReader();
      reader.onload = () => {
        setComprovanteBase64(reader.result as string);
      };
      reader.readAsDataURL(blob);
    }
  };

  // Ler arquivo selecionado pelo input (Opção 2)
  const handleArquivoComprovante = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageBlob(file);
  };

  // Colar print da área de transferência (Opção 1)
  const [colandoClipboard, setColandoClipboard] = useState(false);
  const handleColarClipboard = async () => {
    setColandoClipboard(true);
    try {
      if (!navigator.clipboard?.read) {
        alert('Seu navegador bloqueou a leitura direta. Pressione Ctrl+V no teclado ou use a opção "Tirar Foto / Galeria".');
        return;
      }
      const clipboardItems = await navigator.clipboard.read();
      let achouImagem = false;
      for (const item of clipboardItems) {
        const imgType = item.types.find(t => t.startsWith('image/'));
        if (imgType) {
          const blob = await item.getType(imgType);
          processImageBlob(blob);
          achouImagem = true;
          break;
        }
      }
      if (!achouImagem) {
        alert('Nenhuma imagem encontrada na sua área de transferência. Tire um print primeiro e tente novamente!');
      }
    } catch (err: any) {
      alert('Permita o acesso à área de transferência para colar ou use o atalho Ctrl+V / opção da câmera.');
    } finally {
      setColandoClipboard(false);
    }
  };

  // Capturar colagem global (Ctrl+V) no Passo 3
  useEffect(() => {
    if (passo !== 3) return;

    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processImageBlob(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [passo]);

  // Enviar comprovante anexado
  const handleEnviarComprovante = async () => {
    if (!pedidoCriado || !comprovanteBase64 || enviandoComprovante) return;

    setEnviandoComprovante(true);

    try {
      await api.updateNatalComprovante(pedidoCriado.id, comprovanteBase64);
      setComprovanteEnviadoSucesso(true);
      setPasso(4);
    } catch (err) {
      alert('Comprovante armazenado localmente! Se preferir, envie também pelo WhatsApp da escola.');
      setComprovanteEnviadoSucesso(true);
      setPasso(4);
    } finally {
      setEnviandoComprovante(false);
    }
  };

  // Montar link direto de WhatsApp da APP com o código do pedido
  const whatsappUrl = useMemo(() => {
    if (!pedidoCriado) return '';
    const texto = `Olá! Segue o comprovante de pagamento do Natal Luz CEPR:\n\n` +
      `📌 *Pedido:* ${pedidoCriado.codigoPedido}\n` +
      `🧒 *Aluno:* ${nomeAlunoFinal}\n` +
      `🏫 *Turma:* ${turmaSelecionada}\n` +
      `💰 *Valor Total:* R$ ${pedidoCriado.total.toFixed(2)}\n\n` +
      `Favor confirmar o recebimento e entrega dos tickets. Obrigado!`;
    return `https://wa.me/${WHATSAPP_APP_RAW}?text=${encodeURIComponent(texto)}`;
  }, [pedidoCriado, nomeAlunoFinal, turmaSelecionada]);

  // Iniciar novo pedido
  const handleNovoPedido = () => {
    localStorage.removeItem('cepr_natal_ultimo_pedido');
    setPedidoCriado(null);
    setCarrinho({});
    setComprovanteBase64(null);
    setComprovanteEnviadoSucesso(false);
    setPasso(1);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header Festivo */}
      <header className="bg-gradient-to-r from-red-700 via-rose-700 to-emerald-800 text-white shadow-xl px-4 py-5 text-center relative overflow-hidden border-b-2 border-amber-400">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-xl mx-auto relative z-10">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-amber-400/20 border border-amber-300/40 rounded-full text-amber-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            CE Pedro Rizzi • Natal Luz 2026
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow">
            Pedido Antecipado de Comandas
          </h1>
          <p className="text-rose-100 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            Garanta os lanches e doces do seu filho com antecedência e evite filas na festa!
          </p>
        </div>
      </header>

      {/* Barra de Progresso / Etapas (Goal-Gradient Effect) */}
      <div className="bg-slate-800/80 backdrop-blur border-b border-slate-700/60 sticky top-0 z-30 px-4 py-2.5">
        <div className="max-w-xl mx-auto flex items-center justify-between text-xs font-medium">
          <div className={`flex items-center gap-1.5 ${passo >= 1 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${passo >= 1 ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>1</span>
            <span>Aluno</span>
          </div>
          <div className="w-6 h-0.5 bg-slate-700"></div>
          <div className={`flex items-center gap-1.5 ${passo >= 2 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${passo >= 2 ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>2</span>
            <span>Itens</span>
          </div>
          <div className="w-6 h-0.5 bg-slate-700"></div>
          <div className={`flex items-center gap-1.5 ${passo >= 3 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${passo >= 3 ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>3</span>
            <span>Pix</span>
          </div>
          <div className="w-6 h-0.5 bg-slate-700"></div>
          <div className={`flex items-center gap-1.5 ${passo === 4 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${passo === 4 ? 'bg-emerald-400 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>4</span>
            <span>Pronto</span>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 pb-28">
        
        {/* ==========================================
            ETAPA 1: DADOS DO ALUNO E TURMA (CASCATA)
           ========================================== */}
        {passo === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                Quem vai receber as comandas?
              </h2>

              {/* 1. Seleção da Turma (Dropdown) */}
              <div className="space-y-1.5 mb-4">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  1. Turma do Aluno <span className="text-rose-400">*</span>
                </label>
                {loadingTurmas ? (
                  <div className="text-xs text-slate-400 py-2">Carregando turmas...</div>
                ) : (
                  <select
                    value={turmaSelecionada}
                    onChange={(e) => setTurmaSelecionada(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">Selecione a turma...</option>
                    {turmas.map(t => (
                      <option key={t.id} value={t.nome}>{t.nome}</option>
                    ))}
                  </select>
                )}
                <p className="text-[11px] text-slate-400">
                  Os tickets serão entregues diretamente na sala de aula desta turma.
                </p>
              </div>

              {/* 2. Seleção do Aluno (Aparece após escolher a Turma) */}
              {turmaSelecionada && (
                <div className="space-y-1.5 mb-4 animate-in fade-in duration-200">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    2. Nome do Aluno <span className="text-rose-400">*</span>
                  </label>
                  
                  {loadingAlunos ? (
                    <div className="text-xs text-amber-300 py-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" /> Carregando alunos da turma {turmaSelecionada}...
                    </div>
                  ) : (
                    <>
                      {!isAlunoManual ? (
                        <div className="space-y-2">
                          <select
                            value={alunoSelecionadoId}
                            onChange={(e) => handleSelecionarAluno(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                          >
                            <option value="">Selecione o aluno na lista...</option>
                            {alunos.map(a => (
                              <option key={a.id} value={a.id}>{a.nome}</option>
                            ))}
                            <option value="outro">✍️ Outro / Aluno novo (digitar nome)</option>
                          </select>

                          {alunos.length === 0 && (
                            <p className="text-xs text-amber-300">
                              Nenhum aluno cadastrado nessa turma ainda. Clique em digitar nome.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Digite o nome completo do aluno..."
                            value={nomeAlunoCustom}
                            onChange={(e) => setNomeAlunoCustom(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsAlunoManual(false);
                              setAlunoSelecionadoId('');
                            }}
                            className="text-xs text-amber-400 hover:underline"
                          >
                            Voltar para a lista de alunos
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* 3. Dados do Responsável */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-700/60">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Nome do Responsável <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      placeholder="Seu nome completo"
                      value={responsavel}
                      onChange={(e) => setResponsavel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    WhatsApp do Responsável <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      placeholder="(47) 99999-9999"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botão de Avançar (Lei de Fitts: tamanho generoso e posição clara) */}
            <button
              type="button"
              disabled={!podeAvancarPasso1}
              onClick={() => setPasso(2)}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
                podeAvancarPasso1
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 cursor-pointer shadow-amber-500/20 active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <span>Escolher Itens do Cardápio</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ==========================================
            ETAPA 2: CARDÁPIO E SELEÇÃO DE ITENS
           ========================================== */}
        {passo === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Pedido para:</p>
                <p className="text-sm font-bold text-white">{nomeAlunoFinal} • <span className="text-amber-400">{turmaSelecionada}</span></p>
              </div>
              <button
                type="button"
                onClick={() => setPasso(1)}
                className="text-xs text-slate-300 hover:text-white bg-slate-700 px-3 py-1.5 rounded-lg"
              >
                Alterar
              </button>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider px-1">
                Cardápio da Festa
              </h2>

              {PRODUTOS.map(prod => {
                const qtd = carrinho[prod.id] || 0;
                return (
                  <div
                    key={prod.id}
                    className={`bg-slate-800/90 border rounded-2xl p-3.5 flex items-center justify-between transition-all ${
                      qtd > 0 ? 'border-amber-400/80 bg-slate-800 shadow-md shadow-amber-500/5' : 'border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-700/70 flex items-center justify-center text-2xl shadow-inner">
                        {prod.icone}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{prod.nome}</h3>
                        <p className="text-[11px] text-slate-400 leading-tight">{prod.desc}</p>
                        <p className="text-amber-400 font-extrabold text-sm mt-0.5">
                          R$ {prod.valorUnitario.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Controles de Quantidade */}
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantidade(prod.id, -1)}
                        disabled={qtd === 0}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          qtd > 0 ? 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95' : 'text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <span className="w-7 text-center font-bold text-sm text-white">
                        {qtd}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantidade(prod.id, 1)}
                        className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 flex items-center justify-center font-bold active:scale-95 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Barra Inferior com Subtotal */}
            <div className="pt-2">
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-400">Total a pagar ({totalItensQtd} itens):</p>
                  <p className="text-2xl font-black text-amber-400">
                    R$ {totalCarrinho.toFixed(2)}
                  </p>
                </div>
                <ShoppingBag className="w-8 h-8 text-amber-400/40" />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPasso(1)}
                  className="px-4 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold hover:bg-slate-700"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  disabled={!podeAvancarPasso2 || loadingPedido}
                  onClick={handleGerarPix}
                  className={`flex-1 py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
                    podeAvancarPasso2 && !loadingPedido
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white cursor-pointer shadow-emerald-500/20 active:scale-[0.98]'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  {loadingPedido ? (
                    <span>Gerando Pix...</span>
                  ) : (
                    <>
                      <span>Finalizar e Pagar via Pix</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            ETAPA 3: PAGAMENTO PIX & COMPROVANTE
           ========================================== */}
        {passo === 3 && pedidoCriado && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Cartão de Destaque do Código do Pedido */}
            <div className="bg-gradient-to-br from-amber-500/10 via-slate-800 to-slate-900 border-2 border-amber-400/80 rounded-2xl p-5 text-center shadow-2xl relative overflow-hidden">
              <div className="inline-block px-3 py-1 bg-amber-400/20 border border-amber-400/40 rounded-full text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                Código do Seu Pedido
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-amber-400 tracking-wider">
                {pedidoCriado.codigoPedido}
              </h2>
              <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto">
                No seu banco ou comprovante, o identificador aparecerá como: <br/>
                <strong className="text-white text-sm bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700 mt-1 inline-block">
                  {formatCodigoPixTxid(pedidoCriado.codigoPedido)}
                </strong>
              </p>
            </div>

            {/* Detalhes do Pagamento */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
                <div>
                  <p className="text-xs text-slate-400">Valor do Pix:</p>
                  <p className="text-2xl font-black text-white">R$ {pedidoCriado.total.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Beneficiário:</p>
                  <p className="text-xs font-bold text-amber-300">{NOME_RECEBEDOR_PIX}</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl max-w-[220px] mx-auto shadow-md">
                <img
                  src={getPixQrCodeUrl(pedidoCriado.pixPayload, 220)}
                  alt="QR Code Pix CEPR"
                  className="w-full h-auto rounded-lg"
                />
                <p className="text-[10px] text-slate-500 font-semibold mt-1">Escaneie pelo aplicativo do seu banco</p>
              </div>

              {/* Botão Copiar Pix */}
              <button
                type="button"
                onClick={handleCopiarPix}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                {copiadoPix ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-800" />
                    <span>Código Pix Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Copiar Código Pix (Copia e Cola)</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Chave Pix oficial da escola: <strong className="text-slate-300">{CHAVE_PIX_CEPR}</strong>
              </p>
            </div>

            {/* Sessão das 4 Opções de Envio e Comprovação */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-start gap-3 pb-3 border-b border-slate-700/70">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Comprovação do Pagamento</h3>
                  <p className="text-xs text-slate-300">
                    Escolha a opção mais fácil para você confirmar os tickets de <strong className="text-white">{nomeAlunoFinal}</strong>:
                  </p>
                </div>
              </div>

              {/* Se o comprovante foi anexado (via Colar ou Galeria), mostra pré-visualização e botão de envio imediato */}
              {comprovanteBase64 && (
                <div className="bg-slate-900 border-2 border-emerald-500/70 rounded-2xl p-4 text-center space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-bold px-1">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Comprovante Carregado
                    </span>
                    <button
                      type="button"
                      onClick={() => setComprovanteBase64(null)}
                      className="text-slate-400 hover:text-rose-400 p-1 flex items-center gap-1 transition-colors"
                    >
                      <X className="w-4 h-4" /> Remover
                    </button>
                  </div>

                  <div className="max-h-52 overflow-hidden rounded-xl bg-black/40 border border-slate-700 flex items-center justify-center p-2">
                    {comprovanteBase64.startsWith('data:image') ? (
                      <img src={comprovanteBase64} alt="Prévia do comprovante" className="max-h-48 object-contain rounded" />
                    ) : (
                      <div className="text-slate-300 text-xs py-4 flex items-center gap-2">
                        <Receipt className="w-6 h-6 text-emerald-400" /> Documento anexado pronto para envio
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={enviandoComprovante}
                    onClick={handleEnviarComprovante}
                    className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {enviandoComprovante ? (
                      <span>Enviando comprovante...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Confirmar e Enviar Comprovante Agora</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* AS 4 OPÇÕES DE ENVIO / RASTREAMENTO */}
              <div className="space-y-3 pt-1">
                {/* OPÇÃO 1: COLAR PRINT (CLIPBOARD) */}
                <div className="bg-slate-900/80 border border-slate-700/80 hover:border-amber-400/60 rounded-xl p-3.5 transition-all">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <ClipboardCheck className="w-4 h-4 text-amber-400" />
                        Colar Print do Pix
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tirou print da tela do banco? Clique abaixo para colar direto, ou pressione <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700">Ctrl+V</kbd>.
                      </p>
                      <button
                        type="button"
                        onClick={handleColarClipboard}
                        disabled={colandoClipboard}
                        className="mt-2.5 w-full py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <ClipboardCheck className="w-4 h-4 text-amber-400" />
                        <span>{colandoClipboard ? 'Lendo área de transferência...' : 'Colar Print Copiado'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* OPÇÃO 2: TIRAR FOTO OU ESCOLHER DA GALERIA */}
                <div className="bg-slate-900/80 border border-slate-700/80 hover:border-emerald-400/60 rounded-xl p-3.5 transition-all">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-emerald-400" />
                        Tirar Foto ou Escolher da Galeria
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tire foto do comprovante com a câmera ou selecione da galeria/PDF do celular.
                      </p>
                      <label className="mt-2.5 w-full py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer">
                        <Camera className="w-4 h-4 text-emerald-400" />
                        <span>Tirar Foto / Escolher Arquivo</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleArquivoComprovante}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* OPÇÃO 3: ENVIAR PELO WHATSAPP DA APP */}
                <div className="bg-slate-900/80 border border-slate-700/80 hover:border-emerald-400/60 rounded-xl p-3.5 transition-all">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        Enviar pelo WhatsApp da APP
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Prefere enviar pelo WhatsApp? O link abre direto com os dados do pedido já preenchidos.
                      </p>
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2.5 w-full py-2.5 px-3 rounded-lg bg-emerald-700/40 hover:bg-emerald-700/60 border border-emerald-500/40 text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-300" />
                        <span>WhatsApp da APP ({WHATSAPP_APP})</span>
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-300 ml-auto" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* OPÇÃO 4: RASTREAMENTO AUTOMÁTICO PELO CÓDIGO NL-XXXX */}
                <div className="bg-slate-900/90 border border-amber-400/30 rounded-xl p-3.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                      4
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-amber-400" />
                        Rastreamento Automático pelo Código {pedidoCriado.codigoPedido}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Não consegue enviar o comprovante agora? Fique tranquilo! O código <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{formatCodigoPixTxid(pedidoCriado.codigoPedido)}</strong> foi embutido no Pix. A tesouraria da APP localiza seu depósito no extrato bancário e valida os tickets do aluno automaticamente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            ETAPA 4: CONFIRMAÇÃO & STATUS DO PEDIDO
           ========================================== */}
        {passo === 4 && pedidoCriado && (
          <div className="space-y-5 animate-in fade-in duration-200 text-center">
            <div className="bg-slate-800/90 border border-emerald-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <span className="inline-block px-3 py-1 bg-emerald-400/20 text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                Pedido Registrado com Sucesso
              </span>

              <h2 className="text-3xl font-black text-white">
                {pedidoCriado.codigoPedido}
              </h2>

              <p className="text-slate-300 text-sm mt-3 max-w-md mx-auto leading-relaxed">
                O comprovante do aluno <strong>{nomeAlunoFinal}</strong> (Turma <strong>{turmaSelecionada}</strong>) foi recebido!
              </p>

              <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 mt-5 text-left text-xs space-y-2">
                <p className="text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <strong>Total Pago:</strong> R$ {pedidoCriado.total.toFixed(2)}
                </p>
                <p className="text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <strong>Entrega:</strong> As comandas físicas impressas serão entregues diretamente para o aluno na sala de aula.
                </p>
              </div>

              <div className="pt-6">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Dúvidas? Fale com a APP ({WHATSAPP_APP})</span>
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNovoPedido}
              className="text-xs text-amber-400 hover:underline py-2"
            >
              Fazer outro pedido para outro aluno
            </button>
          </div>
        )}

      </main>

      {/* Footer simples sem links administrativos */}
      <footer className="text-center text-[11px] text-slate-500 py-4 border-t border-slate-800">
        Centro Educacional Pedro Rizzi • Associação de Pais e Professores (APP) • Itajaí/SC
      </footer>
    </div>
  );
};
