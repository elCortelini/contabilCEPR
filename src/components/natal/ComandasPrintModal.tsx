import React, { useState } from 'react';
import { Printer, X } from 'lucide-react';

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
  const [processando, setProcessando] = useState(false);

  // Agrupa as comandas por turma para gerar o relatório/protocolo oficial
  const turmasAgrupadas = React.useMemo(() => {
    const mapa: Record<string, ComandaParaImpressao[]> = {};
    comandas.forEach((cmd) => {
      const t = cmd.turma && cmd.turma.trim() ? cmd.turma.trim() : (turmaFiltro && turmaFiltro !== 'todas' ? turmaFiltro : 'Geral');
      if (!mapa[t]) mapa[t] = [];
      mapa[t].push(cmd);
    });

    // Ordena as turmas numericamente (ex: 101, 102 ... 803)
    const turmasOrdenadas = Object.keys(mapa).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    // Dentro de cada turma, organiza os estudantes por ordem alfabética
    return turmasOrdenadas.map((tNome) => {
      const listaAlunos = [...mapa[tNome]].sort((a, b) => a.estudante.localeCompare(b.estudante, 'pt-BR'));
      return {
        turmaNome: tNome,
        comandas: listaAlunos,
        totalGeral: listaAlunos.reduce((acc, c) => acc + (parseFloat(c.total as any) || 0), 0)
      };
    });
  }, [comandas, turmaFiltro]);

  const handleImprimir = async () => {
    setProcessando(true);
    try {
      if (marcarEntregue) {
        await onConfirmPrint(true);
      }
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
                Relatório de Entrega de Comandas • Natal Luz CEPR
              </h2>
              <p className="text-xs text-slate-400">
                <strong className="text-emerald-400">{comandas.length}</strong> comanda(s) selecionada(s) •{' '}
                <strong className="text-amber-300">{turmasAgrupadas.length}</strong> turma(s) listada(s)
              </p>
            </div>
          </div>
        </div>

        {/* Opções & Ações */}
        <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
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
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition border border-transparent cursor-pointer"
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

      {/* ÁREA DE IMPRESSÃO: Formato Oficial de Relatório / Protocolo */}
      <div className="w-full max-w-5xl space-y-6 print:space-y-0 print:max-w-none print:w-full">
        {turmasAgrupadas.map(({ turmaNome, comandas: listaComandas, totalGeral }) => (
          <div
            key={turmaNome}
            className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-300 print:border-none print:shadow-none print:p-4 print:rounded-none page-break-comandas mb-6 print:mb-0"
          >
            {/* Topo do Relatório */}
            <div className="border-b-2 border-slate-900 pb-2 mb-2 flex justify-between items-end">
              <div>
                <h1 className="text-xl font-black uppercase text-slate-950 tracking-tight">
                  CE PEDRO RIZZI • NATAL LUZ 2026
                </h1>
                <h2 className="text-xs sm:text-sm font-bold text-emerald-800 uppercase tracking-wider">
                  PROTOCOLO DE ENTREGA DE COMANDAS / VALE-LANCHES
                </h2>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-800 block">
                  Turma: <strong className="text-slate-950 text-base">{turmaNome}</strong>
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  Total: <strong className="text-slate-950">{listaComandas.length}</strong> comanda(s)
                </span>
              </div>
            </div>

            {/* Subtítulo / Instrução para o Professor */}
            <p className="text-xs text-slate-600 mb-3 italic">
              Sr(a). Professor(a), favor conferir as comandas entregues para os alunos desta turma e assinar a lista abaixo.
            </p>

            {/* Tabela de Alunos e Assinaturas */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-2.5 w-24">CÓDIGO</th>
                    <th className="p-2.5">ALUNO(A)</th>
                    <th className="p-2.5">ITENS ADQUIRIDOS</th>
                    <th className="p-2.5 w-24 text-right">VALOR</th>
                    <th className="p-2.5 w-56 sm:w-64 text-center">VISTO / ASSINATURA DO ALUNO</th>
                  </tr>
                </thead>
                <tbody>
                  {listaComandas.map((c, i) => {
                    const itensTexto = (Array.isArray(c.itens) ? c.itens : [])
                      .map(it => `${it.quantidade}x ${it.nome}`)
                      .join(', ');
                    const totalNum = parseFloat(c.total as any) || 0;
                    return (
                      <tr
                        key={c.id}
                        className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                      >
                        <td className="p-2.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {c.codigoPedido || `#${c.id.toString().padStart(4, '0')}`}
                        </td>
                        <td className="p-2.5 font-bold text-slate-950 uppercase">
                          {c.estudante}
                        </td>
                        <td className="p-2.5 text-slate-700 text-xs">
                          {itensTexto || 'Sem itens'}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 text-right whitespace-nowrap">
                          {formatarMoeda(totalNum)}
                        </td>
                        <td className="p-2.5 border-l border-slate-200">
                          <div className="h-4 border-b border-dotted border-slate-400 w-full mt-2"></div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100/90 font-bold text-xs border-t border-slate-300">
                    <td colSpan={3} className="p-2.5 text-right uppercase text-[10px] text-slate-600 font-bold">
                      Total da Turma ({listaComandas.length} comanda(s)):
                    </td>
                    <td className="p-2.5 text-right font-black text-slate-950">
                      {formatarMoeda(totalGeral)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};