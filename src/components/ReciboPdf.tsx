import React from 'react';
import { Printer, School, X } from 'lucide-react';
import { formatLocalDate } from '../utils/formatters';

interface ReciboProps {
  item: {
    id: number;
    tipo: 'entrada' | 'saida';
    data: string;
    valor: number;
    descricao?: string;
    carteiraNome?: string;
    forma?: string;
    categoriaNome?: string;
    alunoNome?: string;
    fornecedorNome?: string;
  };
  onClose: () => void;
}

export const ReciboPdf: React.FC<ReciboProps> = ({ item, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6 relative text-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Area */}
        <div id="printable-recibo" className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <School className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-black text-base text-slate-900">Colégio Educacional CEPR</h2>
                <p className="text-[11px] text-slate-500">CNPJ: 12.345.678/0001-90 • Itajaí - SC</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-indigo-600 uppercase">Recibo Nº</span>
              <p className="text-base font-black text-slate-900">#{item.id.toString().padStart(6, '0')}</p>
            </div>
          </div>

          {/* Body Info */}
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-medium">Valor Total:</span>
              <span className="text-lg font-black text-emerald-600">{formatBrl(item.valor)}</span>
            </div>

            <p className="leading-relaxed text-slate-700">
              Recebemos/Pagamos a quantia de <strong className="text-slate-900">{formatBrl(item.valor)}</strong> referente a{' '}
              <strong className="text-indigo-600">{item.descricao || 'Lançamento financeiro escolar'}</strong>.
            </p>

            <div className="grid grid-cols-2 gap-3 text-[11px] bg-white p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block">Data da Operação:</span>
                <span className="font-semibold text-slate-800">{formatLocalDate(item.data)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Forma de Pagamento:</span>
                <span className="font-semibold text-slate-800 capitalize">{item.forma || 'PIX'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Conta / Carteira:</span>
                <span className="font-semibold text-slate-800">{item.carteiraNome || 'Caixa'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Categoria:</span>
                <span className="font-semibold text-indigo-600">{item.categoriaNome || 'Geral'}</span>
              </div>
            </div>

            {/* Signature fields */}
            <div className="pt-8 grid grid-cols-2 gap-6 text-center text-[10px] text-slate-500">
              <div className="border-t border-slate-300 pt-2">
                Assinatura do Emitente / Financeiro
              </div>
              <div className="border-t border-slate-300 pt-2">
                Assinatura do Pagador / Beneficiário
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Fechar
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>
    </div>
  );
};
