import React from 'react';
import { Printer, X, School, Calendar, Filter, FileSpreadsheet, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { formatLocalDate } from '../utils/formatters';

export interface FiltrosRelatorio {
  search?: string;
  carteiraNome?: string;
  forma?: string;
  turno?: string;
  tipoAjuste?: string;
  dataInicio?: string;
  dataFim?: string;
}

interface ListaImpressaoModalProps {
  tipo: 'entradas' | 'saidas';
  itens: any[];
  total: number;
  filtros: FiltrosRelatorio;
  onClose: () => void;
}

export const ListaImpressaoModal: React.FC<ListaImpressaoModalProps> = ({
  tipo,
  itens,
  total,
  filtros,
  onClose,
}) => {
  const isEntrada = tipo === 'entradas';
  const dataEmissao = new Date().toLocaleString('pt-BR');

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  // Totais por forma de pagamento/recebimento
  const resumoFormas = itens.reduce((acc: Record<string, { total: number; qtd: number }>, item) => {
    const forma = (isEntrada ? item.formaRecebimento : item.formaPagamento) || 'Não informado';
    const chave = forma.toLowerCase();
    if (!acc[chave]) {
      acc[chave] = { total: 0, qtd: 0 };
    }
    acc[chave].total += parseFloat(item.valor) || 0;
    acc[chave].qtd += 1;
    return acc;
  }, {});

  // Montar lista de tags de filtros aplicados
  const tagsFiltros: string[] = [];
  if (filtros.search) tagsFiltros.push(`Busca: "${filtros.search}"`);
  if (filtros.carteiraNome) tagsFiltros.push(`Carteira: ${filtros.carteiraNome}`);
  if (filtros.forma) tagsFiltros.push(`Forma: ${filtros.forma.toUpperCase()}`);
  if (filtros.turno) tagsFiltros.push(`Turno: ${filtros.turno}`);
  if (filtros.tipoAjuste && filtros.tipoAjuste !== 'todos') {
    tagsFiltros.push(filtros.tipoAjuste === 'ajustes' ? 'Apenas Ajustes de Saldo' : 'Apenas Lançamentos Normais');
  }
  if (filtros.dataInicio && filtros.dataFim) {
    tagsFiltros.push(`Período: ${formatLocalDate(filtros.dataInicio)} até ${formatLocalDate(filtros.dataFim)}`);
  } else if (filtros.dataInicio) {
    tagsFiltros.push(`A partir de: ${formatLocalDate(filtros.dataInicio)}`);
  } else if (filtros.dataFim) {
    tagsFiltros.push(`Até: ${formatLocalDate(filtros.dataFim)}`);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Barra Superior de Ações (Oculta na Impressão) */}
      <div className="no-print bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl w-full max-w-5xl mb-4 text-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${isEntrada ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}`}>
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Pré-visualização de Impressão • {isEntrada ? 'Receitas (Entradas)' : 'Despesas (Saídas)'}
            </h2>
            <p className="text-xs text-slate-400">
              {itens.length} registro(s) filtrado(s) • Total: <strong className={isEntrada ? 'text-emerald-400' : 'text-rose-400'}>{formatBrl(total)}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-black tracking-wide flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer ${
              isEntrada
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-950/40'
                : 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-rose-950/40'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório (PDF)</span>
          </button>
        </div>
      </div>

      {/* ÁREA DE IMPRESSÃO (Folha A4) */}
      <div
        id="relatorio-impressao-area"
        className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-300 w-full max-w-5xl print:border-none print:shadow-none print:p-2 print:max-w-none print:rounded-none print:block print:m-0"
      >
        {/* Cabeçalho Institucional Oficial CEPR */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-700 flex items-center justify-center text-white shadow-sm print:border print:border-slate-800">
              <School className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-black text-indigo-900 uppercase tracking-widest block">
                COLÉGIO EDUCACIONAL CE PEDRO RIZZI
              </span>
              <h1 className="text-lg font-black text-slate-950 tracking-tight leading-tight">
                RELATÓRIO DE LANÇAMENTOS • {isEntrada ? 'RECEITAS (ENTRADAS)' : 'DESPESAS (SAÍDAS)'}
              </h1>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                CNPJ: 12.345.678/0001-90 • Itajaí - SC • Gestão Contábil Escolar
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-600 flex flex-col justify-end">
            <span className="font-semibold text-slate-800">Emissão: <strong>{dataEmissao}</strong></span>
            <span className="text-[11px] text-slate-500">Total de Registros: <strong>{itens.length}</strong></span>
          </div>
        </div>

        {/* Quadro de Filtros Ativos */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Filtros Aplicados na Consulta:
            </span>
          </div>
          {tagsFiltros.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tagsFiltros.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-block bg-white border border-slate-300 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 italic text-[11px]">Nenhum filtro específico aplicado (Todos os lançamentos).</span>
          )}
        </div>

        {/* Quadro Resumo Financeiro */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="border border-slate-300 rounded-xl p-3 bg-slate-50">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Qtd. Registros
            </span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block">
              {itens.length}
            </span>
            <span className="text-[10px] text-slate-500">itens listados</span>
          </div>

          <div className={`border-2 rounded-xl p-3 ${isEntrada ? 'border-emerald-700 bg-emerald-50/60' : 'border-rose-700 bg-rose-50/60'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isEntrada ? 'text-emerald-800' : 'text-rose-800'}`}>
              Total Consolidado
            </span>
            <span className={`text-lg font-black mt-0.5 block font-mono ${isEntrada ? 'text-emerald-950' : 'text-rose-950'}`}>
              {formatBrl(total)}
            </span>
            <span className="text-[10px] text-slate-600 font-medium">100% da lista filtrada</span>
          </div>

          {/* Resumos por formas mais comuns */}
          {Object.entries(resumoFormas).slice(0, 2).map(([forma, dados], idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl p-3 bg-white">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                {forma}
              </span>
              <span className="text-base font-bold text-slate-800 mt-0.5 block font-mono">
                {formatBrl(dados.total)}
              </span>
              <span className="text-[10px] text-slate-500">
                {dados.qtd} item(ns) ({total > 0 ? ((dados.total / total) * 100).toFixed(0) : 0}%)
              </span>
            </div>
          ))}
        </div>

        {/* Tabela dos Lançamentos */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Data</th>
                {isEntrada && <th className="py-2.5 px-3">Turno</th>}
                <th className="py-2.5 px-3">Carteira</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3">{isEntrada ? 'Descrição' : 'Descrição / Fornecedor'}</th>
                <th className="py-2.5 px-3">Forma</th>
                <th className="py-2.5 px-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {itens.length === 0 ? (
                <tr>
                  <td colSpan={isEntrada ? 8 : 7} className="py-6 text-center text-slate-500 italic">
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                itens.map((item, idx) => (
                  <tr key={item.id || idx} className="even:bg-slate-50/70">
                    <td className="py-2 px-3 font-semibold text-slate-500 text-[11px]">#{item.id}</td>
                    <td className="py-2 px-3 text-slate-700 whitespace-nowrap text-[11px]">
                      {formatLocalDate(item.data)}
                    </td>
                    {isEntrada && (
                      <td className="py-2 px-3 whitespace-nowrap text-[11px] font-medium text-slate-700">
                        {item.turno || 'Matutino'}
                      </td>
                    )}
                    <td className="py-2 px-3 whitespace-nowrap text-[11px] text-slate-700">
                      {item.carteiraNome || '—'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-[11px] text-slate-600">
                      {item.categoriaNome || '—'}
                    </td>
                    <td className="py-2 px-3 text-[11px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.isAjuste && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                            Ajuste
                          </span>
                        )}
                        <span className="font-medium text-slate-800">{item.descricao || 'Sem descrição'}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 capitalize whitespace-nowrap text-[11px] text-slate-600">
                      {isEntrada ? item.formaRecebimento : item.formaPagamento}
                    </td>
                    <td className={`py-2 px-3 text-right font-black whitespace-nowrap text-[11px] font-mono ${
                      isEntrada ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {isEntrada ? '+' : '-'}{formatBrl(parseFloat(item.valor) || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {itens.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs">
                  <td colSpan={isEntrada ? 7 : 6} className="py-3 px-3 text-right uppercase tracking-wider text-slate-800">
                    Total Geral da Lista ({itens.length} lançamentos):
                  </td>
                  <td className={`py-3 px-3 text-right font-black text-sm font-mono ${
                    isEntrada ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    {formatBrl(total)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Rodapé / Assinatura e Autenticação */}
        <div className="border-t border-slate-300 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-end gap-6 text-[10px] text-slate-500">
          <div>
            <p className="font-medium">Sistema Contábil CEPR • Documento gerado eletronicamente para controle interno.</p>
            <p>Relatório emitido em {dataEmissao}.</p>
          </div>

          <div className="w-64 text-center border-t border-slate-400 pt-1.5">
            <span className="font-bold text-slate-700 uppercase tracking-wider block">Responsável Financeiro</span>
            <span className="text-[9px] text-slate-400">Assinatura / Carimbo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
