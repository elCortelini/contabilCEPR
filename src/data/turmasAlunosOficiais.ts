import data from './turmasAlunosOficiais.json';

export interface TurmaOficial {
  codigo: string;
  nome: string;
  ano: string;
  turno: string;
  totalAlunos: number;
}

export interface AlunoOficial {
  id: number;
  nome: string;
  turmaCodigo: string;
  turmaNome: string;
  responsavel: string;
}

export const TURMAS_OFICIAIS: TurmaOficial[] = data.turmas.map((t: any) => ({
  codigo: t.codigo,
  nome: t.nome,
  ano: t.ano,
  turno: t.turno,
  totalAlunos: t.totalAlunos
}));

export const ALUNOS_POR_TURMA: Record<string, AlunoOficial[]> = {};

let idCounter = 1;
data.turmas.forEach((t: any) => {
  ALUNOS_POR_TURMA[t.codigo] = t.alunos.map((al: any) => ({
    id: idCounter++,
    nome: al.nome,
    turmaCodigo: t.codigo,
    turmaNome: t.nome,
    responsavel: al.responsavel || ''
  }));
});
