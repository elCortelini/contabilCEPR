/**
 * Utilitário de Geração de Código Pix Copia e Cola (Padrão BACEN / EMVCo BR Code)
 * Permite gerar o payload oficial do Banco Central com valor fixo e chave escolar.
 */

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixPayloadParams {
  key: string;          // Chave pix (email, telefone, cpf, etc)
  name: string;         // Nome do beneficiário (máx 25 chars)
  city: string;         // Cidade (máx 15 chars)
  amount?: number;      // Valor em Reais (opcional)
  txid?: string;        // Identificador da transação (máx 25 chars)
  description?: string; // Descrição opcional
}

export function generatePixPayload({
  key,
  name,
  city,
  amount,
  txid = 'NATAL'
}: PixPayloadParams): string {
  // Limpeza de caracteres especiais para padrão BACEN
  const cleanName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 25)
    .toUpperCase();

  const cleanCity = city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 15)
    .toUpperCase();

  const cleanTxid = (txid || '***')
    .replace(/[^A-Za-z0-9]/g, '')
    .substring(0, 25) || '***';

  // ID 26: Merchant Account Information
  let merchantAccount = formatField('00', 'br.gov.bcb.pix');
  merchantAccount += formatField('01', key.trim());

  let payload = '';
  // 00: Payload Format Indicator
  payload += formatField('00', '01');
  // 26: Merchant Account Information
  payload += formatField('26', merchantAccount);
  // 52: Merchant Category Code (0000 = Padrão)
  payload += formatField('52', '0000');
  // 53: Transaction Currency (986 = Real Brasileiro BRL)
  payload += formatField('53', '986');

  // 54: Transaction Amount
  if (amount && amount > 0) {
    payload += formatField('54', amount.toFixed(2));
  }

  // 58: Country Code
  payload += formatField('58', 'BR');
  // 59: Merchant Name
  payload += formatField('59', cleanName);
  // 60: Merchant City
  payload += formatField('60', cleanCity);

  // 62: Additional Data Field Template
  const additionalData = formatField('05', cleanTxid);
  payload += formatField('62', additionalData);

  // 63: CRC16
  payload += '6304';
  const checksum = crc16(payload);

  return `${payload}${checksum}`;
}

export function getPixQrCodeUrl(payload: string, size = 300): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(payload)}`;
}

export const CHAVE_PIX_CEPR = 'cepr@edu.itajai.sc.gov.br';
export const NOME_RECEBEDOR_PIX = 'CE PEDRO RIZZI';
export const CIDADE_PIX = 'ITAJAI';
export const WHATSAPP_APP = '(47) 99675-2537';
export const WHATSAPP_APP_RAW = '5547996752537';

/**
 * Converte o código amigável (ex: 'NL-0042') para o formato de TXID do BACEN (ex: 'NL0042')
 */
export function formatCodigoPixTxid(codigo: string): string {
  return codigo.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}
