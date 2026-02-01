// Serviço para buscar liturgia diária da API
// API: https://github.com/Dancrf/liturgia-diaria

export interface LiturgiaResponse {
  data: string; // DD/MM/YYYY
  liturgia: string; // Ex: "3ª feira da 29ª Semana do Tempo Comum"
  cor: string; // Ex: "Verde", "Roxo", "Branco"
  oracoes: {
    coleta: string;
    oferendas: string;
    comunhao: string;
    extras: string[];
  };
  leituras: {
    primeiraLeitura: Array<{
      referencia: string;
      titulo: string;
      texto: string;
    }>;
    salmo: Array<{
      referencia: string;
      refrao: string;
      texto: string;
    }>;
    segundaLeitura: Array<{
      referencia: string;
      titulo: string;
      texto: string;
    }>;
    evangelho: Array<{
      referencia: string;
      titulo: string;
      texto: string;
    }>;
    extras: any[];
  };
  antifonas: {
    entrada: string;
    comunhao: string;
  };
}

const API_BASE_URL = 'https://liturgia.up.railway.app/v2';

/**
 * Busca a liturgia do dia especificado
 * @param date Data no formato YYYY-MM-DD
 * @returns Liturgia do dia
 */
export async function fetchLiturgia(date: string): Promise<LiturgiaResponse> {
  try {
    // Validar formato da data (YYYY-MM-DD)
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Formato de data inválido. Use YYYY-MM-DD');
    }
    
    // Converte YYYY-MM-DD para DD-MM-YYYY para a API
    const [year, month, day] = date.split('-').map(Number);
    
    // Validar valores
    if (!year || !month || !day || year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error('Data fora do intervalo válido');
    }
    
    const formattedDate = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
    
    const url = `${API_BASE_URL}/${formattedDate}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        throw new Error(`A liturgia para esta data ainda não está disponível na base de dados. Tente uma data mais recente.`);
      }
      throw new Error(`Erro ao buscar liturgia: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar liturgia:', error);
    throw error;
  }
}

/**
 * Busca a liturgia do dia atual
 * @returns Liturgia de hoje
 */
export async function fetchLiturgiaHoje(): Promise<LiturgiaResponse> {
  try {
    const response = await fetch(API_BASE_URL);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar liturgia de hoje: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar liturgia de hoje:', error);
    throw error;
  }
}
