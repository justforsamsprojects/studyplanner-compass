export type Role = "aluno" | "professor";

export type BlockType = "aula" | "trabalho" | "transporte" | "compromisso";

export interface BusyBlock {
  id: string;
  /** 0 = segunda ... 6 = domingo */
  day: number;
  /** hora inicial (6-23) */
  start: number;
  /** hora final exclusiva (7-24) */
  end: number;
  label: string;
  type: BlockType;
}

export interface Subject {
  id: string;
  name: string;
  examDate: string; // YYYY-MM-DD
  difficulty: 1 | 2 | 3;
  hoursStudied: number;
  /** código da disciplina do professor, quando importada */
  code?: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  hour: number;
  done: boolean;
}

export type TeacherDateKind = "prova" | "entrega";

export interface TeacherDate {
  id: string;
  kind: TeacherDateKind;
  label: string;
  date: string; // YYYY-MM-DD
}

export interface TeacherSubject {
  id: string;
  name: string;
  code: string;
  dates: TeacherDate[];
}

export const DAY_NAMES = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

export const DAY_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

export const BLOCK_LABELS: Record<BlockType, string> = {
  aula: "Aula",
  trabalho: "Trabalho / Estágio",
  transporte: "Transporte",
  compromisso: "Compromisso",
};

export const DIFFICULTY_LABELS: Record<1 | 2 | 3, string> = {
  1: "Fácil",
  2: "Média",
  3: "Difícil",
};
