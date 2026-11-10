import React from 'react';
import { Printer, X, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface BalancetePrintModalProps {
  resumo: any;
  comandas: any[];
  turmasCalculadas: Array<{
    turma: string;
    totalComandas: number;
    totalPix: number;
    totalDinheiro: number;
    total: number;
    porcentagem: number;
  }>;
  produtosCalculados: Array<{
    nome: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    porcentagem: number;
  }>;
  onClose: () => void;
}

export const BalancetePrintModal: React.FC<BalancetePrintModalProps> = ({
  resumo,
  comandas,
  turmasCalculadas,
  produtosCalculados,
  onClose,
}) => {
  const formatarMoeda = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const dataEmissao = new Date().toLocaleString('pt-BR');

  const faturamentoTotal = resumo?.faturamentoTotal || 0;
  const totalPix = resumo?.totalPix || 0;
  const totalDinheiro = resumo?.totalDinheiro || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Barra de Ações (Oculta na Impressão) */}
      <div className="no-print bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl w-full max-w-4xl mb-4 text-slate-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-white">
              Demonstrativo Contábil • Natal Luz CEPR
            </h2>
            <p className="text-xs text-slate-400">
              Relatório oficial consolidado para prestação de contas da tesouraria e APP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-black tracking-wide flex items-center gap-2 shadow-lg shadow-amber-950 transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Balancete (PDF)</span>
          </button>
        </div>
      </div>

      {/* ÁREA DE IMPRESSÃO (Papel A4 Contábil) */}
      <div className="bg-white text-slate-900 rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-300 w-full max-w-4xl print:border-none print:shadow-none print:p-4 print:max-w-none print:rounded-none page-break-balancete">
        {/* Cabeçalho Institucional */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
          <div>
            <span className="text-xs font-black text-emerald-800 uppercase tracking-widest block">
              COLÉGIO EDUCACIONAL CE PEDRO RIZZI • APP
            </span>
            <h1 className="text-xl font-black text-slate-950 tracking-tight">
              DEMONSTRATIVO CONTÁBIL & PRESTAÇÃO DE CONTAS
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Evento Festivo: <strong>Natal Luz</strong> • Fichas e Comandas
            </p>
          </div>

          <div className="text-right text-xs text-slate-600">
            <span className="font-bold block text-slate-800">Emissão: {dataEmissao}</span>
            <span>Total de Registros: {comandas.length} comandas</span>
          </div>
        </div>

        {/* Quadro Consolidado Financeiro */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border-2 border-slate-800 rounded-xl p-3 bg-slate-50">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Faturamento Geral
            </span>
            <span className="text-xl font-black text-slate-950 mt-0.5 block font-mono">
              {formatarMoeda(faturamentoTotal)}
            </span>
            <span className="text-[10px] text-slate-600 font-medium">100% da receita apurada</span>
          </div>

          <div className="border border-slate-300 rounded-xl p-3 bg-emerald-50/50">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Receita em PIX (Conta Escolar)
            </span>
            <span className="text-xl font-black text-emerald-950 mt-0.5 block font-mono">
              {formatarMoeda(totalPix)}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold">
              {faturamentoTotal > 0 ? ((totalPix / faturamentoTotal) * 100).toFixed(1) : '0'}% do total
            </span>
          </div>

          <div className="border border-slate-300 rounded-xl p-3 bg-amber-50/50">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
              Receita em Dinheiro (Caixa Físico)
            </span>
            <span className="text-xl font-black text-amber-950 mt-0.5 block font-mono">
              {formatarMoeda(totalDinheiro)}
            </span>
            <span className="text-[10px] text-amber-700 font-semibold">
              {faturamentoTotal > 0 ? ((totalDinheiro / faturamentoTotal) * 100).toFixed(1) : '0'}% do total
            </span>
          </div>
        </div>

        {/* Tabela de Arrecadação por Turma */}
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
            1. Arrecadação Consolidada por Turma
          </h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-400 text-slate-600 text-left bg-slate-100">
                <th className="py-1.5 px-2 font-bold">Turma</th>
                <th className="py-1.5 px-2 font-bold text-center">Nº Comandas</th>
                <th className="py-1.5 px-2 font-bold text-right">Dinheiro</th>
                <th className="py-1.5 px-2 font-bold text-right">Pix</th>
                <th className="py-1.5 px-2 font-bold text-right">Total (R$)</th>
                <th className="py-1.5 px-2 font-bold text-right">% Receita</th>
              </tr>
            </thead>
            <tbody>
              {turmasCalculadas.map((t, i) => (
                <tr key={i} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-1.5 px-2 font-semibold text-slate-900">{t.turma}</td>
                  <td className="py-1.5 px-2 text-center text-slate-700">{t.totalComandas}</td>
                  <td className="py-1.5 px-2 text-right text-slate-700">{formatarMoeda(t.totalDinheiro)}</td>
                  <td className="py-1.5 px-2 text-right text-slate-700">{formatarMoeda(t.totalPix)}</td>
                  <td className="py-1.5 px-2 text-right font-bold text-slate-950">{formatarMoeda(t.total)}</td>
                  <td className="py-1.5 px-2 text-right text-slate-600">{t.porcentagem.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 font-black bg-slate-50">
                <td className="py-1.5 px-2">Total Consolidado</td>
                <td className="py-1.5 px-2 text-center">{comandas.length}</td>
                <td className="py-1.5 px-2 text-right">{formatarMoeda(totalDinheiro)}</td>
                <td className="py-1.5 px-2 text-right">{formatarMoeda(totalPix)}</td>
                <td className="py-1.5 px-2 text-right">{formatarMoeda(faturamentoTotal)}</td>
                <td className="py-1.5 px-2 text-right">100,0%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Tabela de Venda por Item */}
        <div className="mb-8">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
            2. Vendas e Receita por Item de Consumo
          </h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-400 text-slate-600 text-left bg-slate-100">
                <th className="py-1.5 px-2 font-bold">Produto / Lanche</th>
                <th className="py-1.5 px-2 font-bold text-center">Qtd Vendida</th>
                <th className="py-1.5 px-2 font-bold text-right">Valor Unitário</th>
                <th className="py-1.5 px-2 font-bold text-right">Total Apurado</th>
                <th className="py-1.5 px-2 font-bold text-right">% Receita</th>
              </tr>
            </thead>
            <tbody>
              {produtosCalculados.map((p, i) => (
                <tr key={i} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-1.5 px-2 font-semibold text-slate-900">{p.nome}</td>
                  <td className="py-1.5 px-2 text-center font-bold text-slate-800">{p.quantidade} un</td>
                  <td className="py-1.5 px-2 text-right text-slate-700">{formatarMoeda(p.valorUnitario)}</td>
                  <td className="py-1.5 px-2 text-right font-bold text-slate-950">{formatarMoeda(p.valorTotal)}</td>
                  <td className="py-1.5 px-2 text-right text-slate-600">{p.porcentagem.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Termo e Assinaturas */}
        <div className="pt-6 border-t-2 border-slate-900 text-xs">
          <p className="text-slate-600 text-[11px] leading-relaxed mb-8">
            Declaramos para os devidos fins de prestação de contas que os valores acima expressos correspondem
            fielmente às comandas registradas para o evento festivo Natal Luz do CE Pedro Rizzi, estando os
            recursos em conta bancária e caixa devidamente conferidos.
          </p>

          <div className="grid grid-cols-3 gap-6 text-center text-[10px] text-slate-600">
            <div>
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-900">
                Tesouraria da APP
              </div>
              <span>Responsável Financeiro</span>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-900">
                Direção Escolar
              </div>
              <span>CE Pedro Rizzi</span>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-900">
                Conselho Fiscal / APP
              </div>
              <span>Visto e Conferência</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
