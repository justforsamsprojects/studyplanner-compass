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

  const subjects: Subject[] = [
    {
      id: uid(),
      name: "Cálculo I",
      examDate: isoDaysFromNow(5),
      difficulty: 3,
      hoursStudied: 2,
    },
    {
      id: uid(),
      name: "Algoritmos",
      examDate: isoDaysFromNow(12),
      difficulty: 2,
      hoursStudied: 4,
    },
    {
      id: uid(),
      name: "História da Arte",
      examDate: isoDaysFromNow(20),
      difficulty: 1,
      hoursStudied: 1,
    },
  ];

  write(KEYS.blocks, blocks);
  write(KEYS.subjects, subjects);
  write(KEYS.sessions, [] as StudySession[]);
}

export function clearAllData() {
  [KEYS.blocks, KEYS.subjects, KEYS.sessions].forEach((k) => write(k, []));
}
