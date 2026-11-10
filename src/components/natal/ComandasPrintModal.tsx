import React, { useState } from 'react';
import { Printer, X, Scissors, CheckCircle2 } from 'lucide-react';

interface ItemComanda {
  id?: string;
  nome: string;
  quantidade: number;
  valorUnitario?: number;
  subtotal?: number;
  total?: number;
}

interface ComandaParaImpressao {
  id: number | string;
  codigoPedido?: string;
  estudante: string;
  turma?: string;
  professor?: string;
  responsavel?: string;
  telefone?: string;
  itens: ItemComanda[];
  total: number;
  formaPagamento: 'pix' | 'dinheiro' | string;
  status?: string;
  ticketEntregue?: boolean;
  criadaEm?: string;
}

interface ComandasPrintModalProps {
  comandas: ComandaParaImpressao[];
  turmaFiltro?: string;
  onClose: () => void;
  onConfirmPrint: (marcarComoEntregue: boolean) => Promise<void>;
}

export const ComandasPrintModal: React.FC<ComandasPrintModalProps> = ({
  comandas,
  turmaFiltro,
  onClose,
  onConfirmPrint,
}) => {
  const [marcarEntregue, setMarcarEntregue] = useState(true);
  const [incluirProtocolo, setIncluirProtocolo] = useState(true);
  const [processando, setProcessando] = useState(false);

  // Divide as comandas em blocos de 4 por folha A4
  const paginas = React.useMemo(() => {
    const chunks: ComandaParaImpressao[][] = [];
    for (let i = 0; i < comandas.length; i += 4) {
      chunks.push(comandas.slice(i, i + 4));
    }
    return chunks;
  }, [comandas]);

  const handleImprimir = async () => {
    setProcessando(true);
    try {
      if (marcarEntregue) {
        await onConfirmPrint(true);
      }
      // Dispara a impressão nativa
      setTimeout(() => {
        window.print();
        setProcessando(false);
      }, 150);
    } catch (e) {
      console.error('Erro ao processar impressão:', e);
      setProcessando(false);
      window.print();
    }
  };

  const formatarMoeda = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Barra de Controle Superior (Oculta na Impressão) */}
      <div className="no-print bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl w-full max-w-5xl mb-4 text-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-white">
                Impressão de Comandas • Natal Luz CEPR
              </h2>
              <p className="text-xs text-slate-400">
                <strong className="text-emerald-400">{comandas.length}</strong> comanda(s) selecionada(s) •{' '}
                <strong className="text-amber-300">{paginas.length}</strong> folha(s) A4 (4 por página)
              </p>
            </div>
          </div>
        </div>

        {/* Opção de Marcar como Entregue & Ações */}
        <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
          <label className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 px-3 py-2 rounded-xl border border-slate-600 text-xs text-slate-200 cursor-pointer select-none transition">
            <input
              type="checkbox"
              checked={incluirProtocolo}
              onChange={(e) => setIncluirProtocolo(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-600 cursor-pointer"
            />
            <span className="font-semibold text-amber-300">Incluir Folha de Rosto / Protocolo da Turma</span>
          </label>

          <label className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 px-3 py-2 rounded-xl border border-slate-600 text-xs text-slate-200 cursor-pointer select-none transition">
            <input
              type="checkbox"
              checked={marcarEntregue}
              onChange={(e) => setMarcarEntregue(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-600 cursor-pointer"
            />
            <span className="font-semibold">Marcar automaticamente como ENTREGUE</span>
          </label>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition border border-transparent"
          >
            Fechar
          </button>

          <button
            type="button"
            disabled={processando || comandas.length === 0}
            onClick={handleImprimir}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white text-xs font-black tracking-wide flex items-center gap-2 shadow-lg shadow-emerald-950 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>{processando ? 'Preparando...' : 'Confirmar & Imprimir'}</span>
          </button>
        </div>
      </div>

      {/* ÁREA DE IMPRESSÃO (Folhas A4) */}
      <div className="w-full max-w-5xl space-y-6 print:space-y-0 print:max-w-none print:w-full">
        {/* Folha de Rosto / Protocolo de Entrega da Turma para o Professor Assinar */}
        {incluirProtocolo && (
          <div
            className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-300 print:border-none print:shadow-none print:p-6 print:rounded-none page-break-comandas flex flex-col justify-between"
            style={{ minHeight: '270mm' }}
          >
            <div>
              <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-black uppercase text-slate-950">
                    CE Pedro Rizzi • Natal Luz 2026
                  </h1>
                  <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">
                    Protocolo de Entrega de Comandas / Vale-Lanches
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 block">
                    Turma: <strong className="text-slate-950 text-sm">{turmaFiltro && turmaFiltro !== 'todas' ? turmaFiltro : 'Geral'}</strong>
                  </span>
                  <span className="text-xs text-slate-500">
                    Total: <strong>{comandas.length}</strong> comanda(s)
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 mb-4 italic">
                Sr(a). Professor(a), favor conferir as comandas entregues para os alunos desta turma e assinar a lista abaixo.
              </p>

              {/* Tabela de Alunos e Assinaturas */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                      <th className="p-2 w-16">Código</th>
                      <th className="p-2">Aluno(a)</th>
                      <th className="p-2">Itens Adquiridos</th>
                      <th className="p-2 w-20 text-right">Valor</th>
                      <th className="p-2 w-48 text-center">Visto / Assinatura do Aluno</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comandas.map((c, i) => {
                      const itensTexto = (Array.isArray(c.itens) ? c.itens : []).map(it => `${it.quantidade}x ${it.nome}`).join(', ');
                      return (
                        <tr key={c.id} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          <td className="p-2 font-mono font-bold text-slate-800">
                            {c.codigoPedido || `#${c.id}`}
                          </td>
                          <td className="p-2 font-bold text-slate-950">
                            {c.estudante}
                          </td>
                          <td className="p-2 text-slate-700 text-[11px]">
                            {itensTexto || 'Sem itens'}
                          </td>
                          <td className="p-2 font-semibold text-slate-900 text-right">
                            {formatarMoeda(c.total)}
                          </td>
                          <td className="p-2 border-l border-slate-200">
                            <div className="h-5 border-b border-dotted border-slate-400"></div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rodapé de Assinatura da Turma */}
            <div className="pt-6 border-t border-slate-400 mt-6 grid grid-cols-2 gap-8 text-xs text-slate-700">
              <div>
                <p>Data de Entrega em Sala: _____/_____/2026</p>
                <div className="mt-8 border-t border-slate-800 pt-1 text-center font-bold">
                  Assinatura do(a) Professor(a) / Responsável da Turma
                </div>
              </div>
              <div>
                <p>Responsável pelo Despacho da Secretaria: CEPR</p>
                <div className="mt-8 border-t border-slate-800 pt-1 text-center font-bold">
                  Visto da Associação de Pais e Professores (APP)
                </div>
              </div>
            </div>
          </div>
        )}

        {paginas.map((paginaComandas, idxPagina) => (
          <div
            key={idxPagina}
            className="bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-2xl border border-slate-300 print:border-none print:shadow-none print:p-0 print:rounded-none page-break-comandas"
            style={{ minHeight: '270mm' }}
          >
            {/* Aviso visual na visualização de tela */}
            <div className="no-print pb-2 mb-3 border-b border-slate-200 flex justify-between items-center text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
              <span>Folha A4 #{idxPagina + 1} de {paginas.length}</span>
              <span>Layout 4 Comandas por Folha (Grade 2x2 com Borda de Recorte)</span>
            </div>

            {/* Grade 2x2: Exatamente 4 comandas por página */}
            <div className="grid grid-cols-2 grid-rows-2 gap-3 h-[260mm] print:h-[275mm]">
              {paginaComandas.map((cmd) => {
                const totalNum = parseFloat(cmd.total as any) || 0;
                const itens = Array.isArray(cmd.itens) ? cmd.itens : [];

                return (
                  <div
                    key={cmd.id}
                    className="border-2 border-dashed border-slate-700 rounded-xl p-3 flex flex-col justify-between bg-white relative overflow-hidden"
                    style={{ height: '100%', boxSizing: 'border-box' }}
                  >
                    {/* Marcador visual de corte (Tesoura) */}
                    <div className="absolute top-1 right-2 text-[10px] text-slate-400 font-mono flex items-center gap-1 select-none pointer-events-none">
                      <Scissors className="w-3 h-3 text-slate-500 rotate-90" />
                      <span>recorte aqui</span>
                    </div>

                    {/* Topo da Comanda */}
                    <div>
                      <div className="border-b-2 border-slate-800 pb-1.5 mb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 block">
                              CE PEDRO RIZZI • NATAL LUZ 🎅
                            </span>
                            <span className="text-xs font-black text-slate-900">
                              VALE-LANCHE / COMANDA ESCOLAR
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-slate-950 font-mono block">
                              {cmd.codigoPedido || `#${cmd.id.toString().padStart(5, '0')}`}
                            </span>
                            <span className="text-[9px] text-slate-500">
                              {cmd.criadaEm
                                ? new Date(cmd.criadaEm).toLocaleDateString('pt-BR')
                                : new Date().toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Identificação do Aluno */}
                      <div className="bg-slate-100 rounded-lg p-2 mb-2 text-xs border border-slate-200">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Aluno(a):</span>
                          <span className="text-[10px] text-slate-600 font-semibold">
                            {cmd.turma ? `Turma: ${cmd.turma}` : ''}
                          </span>
                        </div>
                        <p className="font-extrabold text-sm text-slate-950 truncate">{cmd.estudante}</p>
                        <div className="flex justify-between items-center text-[10px] text-slate-600 mt-0.5">
                          <span>Resp: <strong>{cmd.responsavel || 'Não informado'}</strong></span>
                          <span>Tel: {cmd.telefone || '-'}</span>
                        </div>
                      </div>

                      {/* Tabela de Itens Comprados */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 pb-0.5">
                          <span>Qtd • Item</span>
                          <span>Unit • Subtotal</span>
                        </div>

                        <div className="space-y-1 max-h-[85px] overflow-hidden text-[11px]">
                          {itens.map((it, i) => {
                            const unit = parseFloat(it.valorUnitario as any) || 0;
                            const sub = parseFloat((it.subtotal || it.total) as any) || (it.quantidade * unit);
                            return (
                              <div key={i} className="flex justify-between items-center text-slate-800 leading-tight">
                                <span className="font-bold">
                                  {it.quantidade}x <span className="font-medium text-slate-900">{it.nome}</span>
                                </span>
                                <span className="font-mono text-[10px] text-slate-600">
                                  {unit > 0 && `(${unit.toFixed(2).replace('.', ',')}) `}
                                  <strong className="text-slate-900 font-semibold">{formatarMoeda(sub)}</strong>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Rodapé da Comanda (Valores e Canhoto) */}
                    <div className="mt-2 pt-1.5 border-t-2 border-slate-800">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold uppercase text-slate-600">
                          Forma: <strong className="text-slate-950 uppercase">{cmd.formaPagamento}</strong>
                        </span>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Total Pago:</span>
                          <span className="text-sm font-black text-slate-950 font-mono">
                            {formatarMoeda(totalNum)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-300 rounded p-1 flex items-center justify-between text-[9px] text-slate-600">
                        <span className="flex items-center gap-1 font-semibold text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>PAGO & AUTORIZADO</span>
                        </span>
                        <span className="italic">Apresentar na barraca de lanches</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Preenche caixas vazias se a página tiver menos de 4 comandas */}
              {Array.from({ length: 4 - paginaComandas.length }).map((_, emptyIdx) => (
                <div
                  key={`empty-${emptyIdx}`}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-3 flex items-center justify-center bg-slate-50/50 text-slate-300 text-xs italic"
                  style={{ height: '100%', boxSizing: 'border-box' }}
                >
                  <span className="no-print">Espaço vago para recorte</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
