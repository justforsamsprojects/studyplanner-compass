import { useCallback, useEffect, useState } from "react";
import type { BusyBlock, NotebookDoc, HelpRequest, Role, StudySession, Subject, TeacherSubject } from "./types";

/**
 * Camada de dados isolada. Hoje grava no localStorage; para migrar para o
 * Lovable Cloud basta trocar a implementação de `read`/`write` por chamadas
 * assíncronas, mantendo as mesmas chaves e formatos.
 */

const PREFIX = "studyplanner:";

export const KEYS = {
  role: `${PREFIX}role`,
  blocks: `${PREFIX}blocks`,
  subjects: `${PREFIX}subjects`,
  sessions: `${PREFIX}sessions`,
  teacherSubjects: `${PREFIX}teacherSubjects`,
  helpRequests: `${PREFIX}helpRequests`,
  notebookDocs: `${PREFIX}notebookDocs`,
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("studyplanner:change", { detail: key }));
  } catch {
    /* ignora */
  }
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/** Estado persistido, sincronizado entre telas e abas. */
export function usePersisted<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(read<T>(key, fallback));
    setHydrated(true);
    const sync = () => setValue(read<T>(key, fallback));
    const onCustom = (e: Event) => {
      if ((e as CustomEvent).detail === key) sync();
    };
    window.addEventListener("studyplanner:change", onCustom);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("studyplanner:change", onCustom);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        write(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, update, hydrated] as const;
}

export const useRole = () => usePersisted<Role | null>(KEYS.role, null);
export const useBlocks = () => usePersisted<BusyBlock[]>(KEYS.blocks, []);
export const useSubjects = () => usePersisted<Subject[]>(KEYS.subjects, []);
export const useSessions = () => usePersisted<StudySession[]>(KEYS.sessions, []);
export const useTeacherSubjects = () => usePersisted<TeacherSubject[]>(KEYS.teacherSubjects, []);

export const useHelpRequests = () => usePersisted<HelpRequest[]>(KEYS.helpRequests, []);

/** Cadernos: privados do aluno, nunca lidos nas telas do professor. */
export const useNotebookDocs = () => usePersisted<NotebookDoc[]>(KEYS.notebookDocs, []);

export function readTeacherSubjects() {
  return read<TeacherSubject[]>(KEYS.teacherSubjects, []);
}

export function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function isoDaysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Dados de demonstração: rotina cheia + 3 disciplinas fictícias. */
export function loadSampleData() {
  const blocks: BusyBlock[] = [
    { id: uid(), day: 0, start: 8, end: 12, label: "Aulas na faculdade", type: "aula" },
    { id: uid(), day: 0, start: 14, end: 18, label: "Estágio", type: "trabalho" },
    { id: uid(), day: 1, start: 8, end: 12, label: "Aulas na faculdade", type: "aula" },
    { id: uid(), day: 1, start: 18, end: 19, label: "Deslocamento", type: "transporte" },
    { id: uid(), day: 2, start: 8, end: 12, label: "Aulas na faculdade", type: "aula" },
    { id: uid(), day: 2, start: 14, end: 18, label: "Estágio", type: "trabalho" },
    { id: uid(), day: 3, start: 8, end: 12, label: "Aulas na faculdade", type: "aula" },
    { id: uid(), day: 4, start: 8, end: 12, label: "Aulas na faculdade", type: "aula" },
    { id: uid(), day: 4, start: 19, end: 22, label: "Compromisso familiar", type: "compromisso" },
    { id: uid(), day: 5, start: 9, end: 11, label: "Curso de inglês", type: "aula" },
  ];

  const teacherCode = "EST2K7";
  const teacherSubject: TeacherSubject = {
    id: uid(),
    name: "Estatística Aplicada",
    code: teacherCode,
    dates: [
      { id: uid(), kind: "prova", label: "Prova 1", date: isoDaysFromNow(9) },
      { id: uid(), kind: "entrega", label: "Lista de exercícios", date: isoDaysFromNow(4) },
    ],
  };

  const subjects: Subject[] = [
    { id: uid(), name: "Cálculo I", examDate: isoDaysFromNow(5), difficulty: 3, hoursStudied: 2 },
    { id: uid(), name: "Algoritmos", examDate: isoDaysFromNow(12), difficulty: 2, hoursStudied: 4 },
    { id: uid(), name: "História da Arte", examDate: isoDaysFromNow(20), difficulty: 1, hoursStudied: 1 },
    {
      id: uid(),
      name: teacherSubject.name,
      examDate: isoDaysFromNow(9),
      difficulty: 2,
      hoursStudied: 1,
      code: teacherCode,
    },
  ];

  const now = Date.now();
  const at = (minAgo: number) => new Date(now - minAgo * 60000).toISOString();
  const help: HelpRequest = {
    id: uid(),
    subjectCode: teacherCode,
    subjectName: teacherSubject.name,
    studentName: "Ana Souza",
    anonymous: false,
    summary: { plannedHours: 3, studiedHours: 1, neededHours: 12, alerts: [] },
    status: "aguardando",
    createdAt: at(180),
    messages: [
      { id: uid(), author: "aluno", text: "Professor, não entendi bem como calcular o desvio padrão. Pode indicar um material?", createdAt: at(180) },
      { id: uid(), author: "professor", text: "Olá, Ana! Revise o capítulo 3 da apostila e faça os exercícios 1 a 5.", createdAt: at(120) },
      { id: uid(), author: "aluno", text: "Obrigada! Fiz os exercícios, mas fiquei com dúvida no 4. Podemos ver na próxima aula?", createdAt: at(30) },
    ],
  };

  const doc: NotebookDoc = {
    id: uid(),
    subjectId: subjects[0].id,
    title: "Resumo: Limites",
    content:
      "<h1>Limites</h1><p>O <strong>limite</strong> descreve o valor de que uma função se aproxima.</p><h2>Propriedades</h2><ul><li>Limite da soma é a soma dos limites</li><li>Limite do produto é o produto dos limites</li></ul><p><em>Revisar exemplos da aula 2.</em></p>",
    updatedAt: new Date().toISOString(),
  };

  write(KEYS.blocks, blocks);
  write(KEYS.subjects, subjects);
  write(KEYS.sessions, [] as StudySession[]);
  const existingTeacher = read<TeacherSubject[]>(KEYS.teacherSubjects, []).filter((t) => t.code !== teacherCode);
  write(KEYS.teacherSubjects, [...existingTeacher, teacherSubject]);
  write(KEYS.helpRequests, [help]);
  write(KEYS.notebookDocs, [doc]);
}

export function clearAllData() {
  Object.values(KEYS).forEach((k) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(k);
    window.dispatchEvent(new CustomEvent("studyplanner:change", { detail: k }));
  });
}

/** Exporta todos os dados salvos do app. */
export function exportAllData() {
  const data: Record<string, unknown> = {};
  for (const [name, key] of Object.entries(KEYS)) data[name] = read<unknown>(key, null);
  return { app: "studyplanner", version: 1, exportedAt: new Date().toISOString(), data };
}

/** Restaura um arquivo exportado. Lança erro se o formato for inválido. */
export function importAllData(json: unknown) {
  const obj = json as { app?: string; data?: Record<string, unknown> };
  if (!obj || obj.app !== "studyplanner" || typeof obj.data !== "object" || !obj.data) {
    throw new Error("Arquivo inválido");
  }
  clearAllData();
  for (const [name, key] of Object.entries(KEYS)) {
    const v = obj.data[name];
    if (v !== undefined && v !== null) write(key, v);
  }
}
